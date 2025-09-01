import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  ChatMessageDto,
  CropDiseaseAnalysisRequestDto,
  CropRecommendationRequestDto,
  FertilizerCalculationDto,
  MessageType,
} from './dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly openaiApiKey: string;
  private readonly openaiApiUrl: string;
  private readonly openaiAudioUrl: string;
  private readonly deepseekApiKey: string;
  private readonly deepseekApiUrl: string;

  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {
    this.openaiApiKey = this.configService.get<string>('openai.apiKey') || '';
    this.openaiApiUrl =
      this.configService.get<string>('openai.apiUrl') ||
      'https://api.openai.com/v1/chat/completions';
    this.openaiAudioUrl =
      this.configService.get<string>('openai.audioUrl') ||
      'https://api.openai.com/v1/audio/transcriptions';
    this.deepseekApiKey =
      this.configService.get<string>('deepseek.apiKey') || '';
    this.deepseekApiUrl =
      this.configService.get<string>('deepseek.apiUrl') ||
      'https://api.deepseek.com/chat/completions';

    if (!this.openaiApiKey) {
      this.logger.warn('OpenAI API key not configured');
    }
    if (!this.deepseekApiKey) {
      this.logger.warn('DeepSeek API key not configured');
    }
  }

  async sendMessage(userId: string, chatMessageDto: ChatMessageDto) {
    const {
      conversationId,
      message,
      imageBase64,
      audioBase64,
      messageType,
      conversationHistory = [],
    } = chatMessageDto;

    // Check if OpenAI API key is available
    if (!this.openaiApiKey) {
      throw new HttpException(
        'AI service temporarily unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    let userMessage = '';
    let responseType = 'text';
    let currentConversationId = conversationId;

    try {
      // Create new conversation if not provided
      if (!currentConversationId) {
        const newConversation = await this.prismaService.conversation.create({
          data: {
            userId,
            title: this.generateConversationTitle(
              message || 'New Conversation',
            ),
          },
        });
        currentConversationId = newConversation.id;
      } else {
        // Verify conversation belongs to user
        const conversation = await this.prismaService.conversation.findFirst({
          where: {
            id: currentConversationId,
            userId,
          },
        });

        if (!conversation) {
          throw new HttpException(
            'Conversation not found or access denied',
            HttpStatus.NOT_FOUND,
          );
        }
      }

      // Get conversation history if conversationId provided and no history in request
      let messages: any[] = [];
      if (currentConversationId && conversationHistory.length === 0) {
        const existingMessages =
          await this.prismaService.chatConversation.findMany({
            where: { conversationId: currentConversationId },
            orderBy: { createdAt: 'asc' },
            select: {
              userMessage: true,
              assistantMessage: true,
            },
          });

        messages = existingMessages.flatMap((msg) => [
          { role: 'user', content: msg.userMessage },
          { role: 'assistant', content: msg.assistantMessage },
        ]);
      } else {
        messages = conversationHistory;
      }

      // Handle different message types
      if (messageType === MessageType.VOICE && audioBase64) {
        userMessage = await this.transcribeAudio(audioBase64);
        responseType = 'voice_response';
      } else if (messageType === MessageType.TEXT && message) {
        userMessage = message;
        responseType = 'text';
      } else if (messageType === MessageType.IMAGE && imageBase64) {
        responseType = 'image_analysis';
      } else {
        throw new HttpException(
          'Invalid message type or missing required data',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Create system prompt for agricultural AI assistant
      const systemPrompt = `You are SoilSense, an expert agricultural AI assistant specialized in soil health, crop management, and sustainable farming practices. Your role is to provide practical, actionable advice to farmers and agricultural professionals.

Key areas of expertise:
- Soil health assessment and management
- Crop nutrition and fertilization
- Pest and disease identification and control
- Water management and irrigation
- Sustainable farming practices
- Crop rotation and planning
- Weather and climate considerations
- Equipment and technology recommendations

Guidelines:
- Always provide practical, actionable advice
- Include specific product recommendations when appropriate
- Consider local conditions and sustainable practices
- Be encouraging and supportive in your tone
- Ask clarifying questions when needed
- Provide step-by-step instructions for complex tasks
- Include safety considerations for chemical applications

Remember: Great harvests begin underground. Help farmers unlock their soil's potential and grow better crops.`;

      // Prepare messages for OpenAI API
      const apiMessages = [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ];

      // Handle image analysis
      if (messageType === MessageType.IMAGE && imageBase64) {
        apiMessages.push({
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze this image and provide detailed agricultural advice. Focus on soil condition, plant health, potential issues, and specific recommendations for improvement.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: 'high',
              },
            },
          ] as any,
        });
      } else {
        // Handle text/voice messages
        apiMessages.push({
          role: 'user',
          content: userMessage,
        });
      }

      // Make API call to OpenAI GPT-4o
      const response = await fetch(this.openaiApiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: apiMessages,
          max_tokens: 1000,
          temperature: 0.7,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error('OpenAI API error:', errorData);
        throw new HttpException(
          `OpenAI API error: ${response.status}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const aiResponse = await response.json();
      const assistantMessage =
        aiResponse.choices[0]?.message?.content ||
        'I apologize, but I was unable to process your request. Please try again.';

      // Save conversation to database
      await this.saveConversationMessage(
        currentConversationId!,
        userId,
        messageType === MessageType.IMAGE ? '[Image uploaded]' : userMessage,
        assistantMessage,
        messageType,
      );

      // Update conversation timestamp
      await this.prismaService.conversation.update({
        where: { id: currentConversationId! },
        data: { updatedAt: new Date() },
      });

      return {
        message: assistantMessage,
        messageType: responseType,
        timestamp: new Date().toISOString(),
        conversationId: currentConversationId!,
      };
    } catch (error) {
      this.logger.error('Error in chat service:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private generateConversationTitle(message: string): string {
    // Generate a title from the first message, truncated to 50 characters
    const title =
      message.length > 50 ? message.substring(0, 47) + '...' : message;
    return title || 'New Conversation';
  }

  private async transcribeAudio(audioBase64: string): Promise<string> {
    try {
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audioBase64, 'base64');

      // Create form data
      const formData = new FormData();
      const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      const response = await fetch(this.openaiAudioUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.openaiApiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Voice transcription failed');
      }

      const transcriptionData = await response.json();
      return transcriptionData.text || '';
    } catch (error) {
      this.logger.error('Audio transcription error:', error);
      throw new HttpException(
        'Voice transcription failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async saveConversationMessage(
    conversationId: string,
    userId: string,
    userMessage: string,
    assistantMessage: string,
    messageType: MessageType,
  ): Promise<void> {
    try {
      await this.prismaService.chatConversation.create({
        data: {
          conversationId,
          userId,
          userMessage,
          assistantMessage,
          messageType: messageType.toUpperCase() as 'TEXT' | 'VOICE' | 'IMAGE',
        },
      });
    } catch (error) {
      this.logger.error('Database error when saving conversation:', error);
      // Don't throw error to avoid failing the main request
    }
  }

  async getConversations(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    try {
      const conversations = await this.prismaService.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              userMessage: true,
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
      });

      return conversations.map((conv) => ({
        id: conv.id,
        title: conv.title,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
        messageCount: conv._count.messages,
        lastMessage: conv.messages[0]?.userMessage || '',
      }));
    } catch (error) {
      this.logger.error('Error fetching conversations:', error);
      throw new HttpException(
        'Failed to fetch conversations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getConversationDetails(userId: string, conversationId: string) {
    try {
      const conversation = await this.prismaService.conversation.findFirst({
        where: {
          id: conversationId,
          userId,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              userMessage: true,
              assistantMessage: true,
              messageType: true,
              createdAt: true,
            },
          },
        },
      });

      if (!conversation) {
        throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
      }

      return {
        id: conversation.id,
        userId: conversation.userId,
        title: conversation.title,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        messages: conversation.messages.map((msg) => ({
          id: msg.id,
          userMessage: msg.userMessage,
          assistantMessage: msg.assistantMessage,
          messageType: msg.messageType,
          createdAt: msg.createdAt.toISOString(),
        })),
      };
    } catch (error) {
      this.logger.error('Error fetching conversation details:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to fetch conversation details',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteConversation(userId: string, conversationId: string) {
    try {
      const conversation = await this.prismaService.conversation.findFirst({
        where: {
          id: conversationId,
          userId,
        },
      });

      if (!conversation) {
        throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
      }

      await this.prismaService.conversation.delete({
        where: { id: conversationId },
      });

      return { success: true, message: 'Conversation deleted successfully' };
    } catch (error) {
      this.logger.error('Error deleting conversation:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to delete conversation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Legacy method for backward compatibility
  async getChatHistory(userId: string, limit: number = 50, offset: number = 0) {
    try {
      const conversations = await this.prismaService.chatConversation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          userMessage: true,
          assistantMessage: true,
          messageType: true,
          createdAt: true,
        },
      });

      return conversations;
    } catch (error) {
      this.logger.error('Error fetching chat history:', error);
      throw new HttpException(
        'Failed to fetch chat history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Fertilizer Calculation Method
  async calculateFertilizer(fertilizerData: FertilizerCalculationDto) {
    const { sensorData, calculationData } = fertilizerData;

    if (!this.deepseekApiKey) {
      throw new HttpException(
        'AI service temporarily unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      const prompt = `
You are an agricultural fertilizer expert AI. Based on the soil sensor data, crop selection, and field parameters, calculate the optimal fertilizer quantities needed.

Soil Sensor Data:
- Temperature: ${sensorData.temperature}°C
- Humidity: ${sensorData.humidity}%
- EC (Electrical Conductivity): ${sensorData.ec} µS/cm
- pH Level: ${sensorData.ph}
- Current Nitrogen: ${sensorData.nitrogen} mg/kg
- Current Phosphorus: ${sensorData.phosphorus} mg/kg
- Current Potassium: ${sensorData.potassium} mg/kg
- Salinity: ${sensorData.salinity} mg/kg

Field Parameters:
- Area Size: ${calculationData.areaSize}
- Number of Trees: ${calculationData.numberOfTrees}
- Selected Crop: ${calculationData.selectedCrop.name}

Please calculate fertilizer recommendations for one full year. Provide recommendations in the following JSON format:

{
  "fertilizerRecommendation": {
    "nonOrganic": [
      {
        "name": "Nitrogen",
        "amount": "15 Kg",
        "perTree": "0.5 kg/tree",
        "color": "#D8285C"
      }
    ],
    "organic": [
      {
        "name": "Compost",
        "amount": "40 Kg",
        "perTree": "1.3 kg/tree",
        "color": "#624A46"
      }
    ]
  }
}

Consider factors like soil nutrient levels, crop requirements, pH, field size, and tree density.`;

      const response = await fetch(this.deepseekApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.deepseekApiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 3000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const content = aiResponse.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Invalid response from AI service');
      }

      let fertilizerRecommendation;
      try {
        let jsonContent = content;
        if (content.includes('```json')) {
          jsonContent = content.split('```json')[1].split('```')[0];
        }
        const parsedResponse = JSON.parse(jsonContent.trim());
        fertilizerRecommendation = parsedResponse.fertilizerRecommendation;
      } catch (e) {
        // Fallback recommendations
        const numTrees = parseFloat(calculationData.numberOfTrees) || 30;
        fertilizerRecommendation = {
          nonOrganic: [
            {
              name: 'Nitrogen',
              amount: `${Math.round(numTrees * 0.5)} Kg`,
              perTree: '0.5 kg/tree',
              color: '#D8285C',
            },
            {
              name: 'Phosphorus',
              amount: `${Math.round(numTrees * 0.4)} Kg`,
              perTree: '0.4 kg/tree',
              color: '#4096F1',
            },
          ],
          organic: [
            {
              name: 'Compost',
              amount: `${Math.round(numTrees * 1.3)} Kg`,
              perTree: '1.3 kg/tree',
              color: '#624A46',
            },
          ],
        };
      }

      return { success: true, recommendation: fertilizerRecommendation };
    } catch (error) {
      this.logger.error('Error in fertilizer calculation:', error);
      throw new HttpException(
        'Failed to calculate fertilizer quantities',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Crop Recommendations Method
  async getCropRecommendations(cropRequestDto: CropRecommendationRequestDto) {
    const { sensorData } = cropRequestDto;

    if (!this.deepseekApiKey) {
      throw new HttpException(
        'AI service temporarily unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      const prompt = `
You are an agricultural expert AI. Based on soil sensor data, recommend the top 6 most suitable crops.

Soil Data: Temperature: ${sensorData.temperature}°C, Humidity: ${sensorData.humidity}%, EC: ${sensorData.ec} µS/cm, pH: ${sensorData.ph}, N: ${sensorData.nitrogen} mg/kg, P: ${sensorData.phosphorus} mg/kg, K: ${sensorData.potassium} mg/kg, Salinity: ${sensorData.salinity} mg/kg

Provide JSON format:
{
  "recommendations": [
    {
      "id": "crop_id",
      "name": "Crop Name", 
      "icon": "🌾",
      "suitabilityScore": 95,
      "reasons": ["Reason 1", "Reason 2"]
    }
  ]
}`;

      const response = await fetch(this.deepseekApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.deepseekApiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const content = aiResponse.choices?.[0]?.message?.content;

      let recommendations;
      try {
        let jsonContent = content;
        if (content.includes('```json')) {
          jsonContent = content.split('```json')[1].split('```')[0];
        }
        const parsedResponse = JSON.parse(jsonContent.trim());
        recommendations = parsedResponse.recommendations || [];
      } catch (e) {
        // Fallback recommendations
        recommendations = [
          {
            id: 'tomato',
            name: 'Tomato',
            icon: '🍅',
            suitabilityScore: 85,
            reasons: ['Based on current soil conditions'],
          },
          {
            id: 'potato',
            name: 'Potato',
            icon: '🥔',
            suitabilityScore: 80,
            reasons: ['Suitable for your pH level'],
          },
        ];
      }

      return { success: true, recommendations: recommendations.slice(0, 6) };
    } catch (error) {
      this.logger.error('Error in crop recommendations:', error);
      throw new HttpException(
        'Failed to get crop recommendations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Crop Disease Analysis Method
  async analyzeCropDisease(diseaseAnalysisDto: CropDiseaseAnalysisRequestDto) {
    const { imageBase64 } = diseaseAnalysisDto;

    if (!this.openaiApiKey) {
      throw new HttpException(
        'AI service temporarily unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      const prompt = `Analyze this crop image for diseases, health, hydration, and nutrients. Provide JSON format with results and advice.`;

      const response = await fetch(this.openaiApiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                    detail: 'high',
                  },
                },
              ] as any,
            },
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data: any = await response.json();
      const aiResponse = data.choices[0].message.content;

      let diseaseAnalysis;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedResponse = JSON.parse(jsonMatch[0]);
          diseaseAnalysis = parsedResponse.diseaseAnalysis;
        } else {
          throw new Error('No JSON found');
        }
      } catch (parseError) {
        // Fallback analysis
        diseaseAnalysis = {
          results: [
            {
              title: 'Disease Detection',
              description:
                'Unable to parse detailed analysis. Please try again.',
            },
            {
              title: 'Health Condition',
              description: 'Manual inspection recommended.',
            },
          ],
          advices: [
            {
              key: 'fertilizer',
              advices: [
                {
                  title: 'General Recommendation',
                  description: 'Apply balanced NPK fertilizer.',
                },
              ],
            },
          ],
        };
      }

      return { diseaseAnalysis };
    } catch (error) {
      this.logger.error('Error in crop disease analysis:', error);
      throw new HttpException(
        'Failed to analyze crop disease',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
