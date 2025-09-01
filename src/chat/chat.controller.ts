import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { 
  ChatMessageDto, 
  ChatResponseDto, 
  FertilizerCalculationDto, 
  FertilizerCalculationResponseDto,
  CropRecommendationRequestDto,
  CropRecommendationResponseDto,
  CropDiseaseAnalysisRequestDto,
  CropDiseaseAnalysisResponseDto,
  ConversationDto,
  ConversationListDto
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  @ApiOperation({ 
    summary: 'Send a message to the AI assistant',
    description: 'Send a text, voice, or image message to the SoilSense AI assistant. Supports ChatGPT-like conversations with automatic conversation management.'
  })
  @ApiResponse({
    status: 200,
    description: 'Message sent successfully',
    type: ChatResponseDto,
    schema: {
      type: 'object',
      properties: {
        message: { 
          type: 'string', 
          example: 'Based on your soil conditions, I recommend applying lime to increase pH. Here are the steps...' 
        },
        messageType: { 
          type: 'string', 
          example: 'text',
          description: 'Type of response: text, voice_response, or image_analysis'
        },
        timestamp: { 
          type: 'string', 
          format: 'date-time',
          example: '2024-01-15T10:30:00Z'
        },
        conversationId: { 
          type: 'string', 
          example: 'conv_123abc',
          description: 'ID of the conversation (created automatically if not provided)'
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid message type or missing required data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid message type or missing required data' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found - When conversationId is provided but doesn\'t exist or belong to user',
  })
  @ApiResponse({
    status: 503,
    description: 'Service Unavailable - AI service temporarily unavailable',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 503 },
        message: { type: 'string', example: 'AI service temporarily unavailable' },
        error: { type: 'string', example: 'Service Unavailable' }
      }
    }
  })
  async sendMessage(
    @GetUser('id') userId: string,
    @Body() chatMessageDto: ChatMessageDto,
  ): Promise<ChatResponseDto> {
    return this.chatService.sendMessage(userId, chatMessageDto);
  }

  @Get('history')
  @ApiOperation({ 
    summary: 'Get chat conversation history (Legacy)',
    description: 'Legacy endpoint for backward compatibility. Use /conversations instead.'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of conversations to retrieve (default: 50)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of conversations to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Chat history retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getChatHistory(
    @GetUser('id') userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.chatService.getChatHistory(userId, limit || 50, offset || 0);
  }

  @Get('conversations')
  @ApiOperation({ 
    summary: 'Get all user conversations',
    description: 'Retrieve a list of all conversations for the authenticated user with pagination support'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of conversations to retrieve (default: 50, max: 100)',
    example: 20
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of conversations to skip for pagination (default: 0)',
    example: 0
  })
  @ApiResponse({
    status: 200,
    description: 'Conversations retrieved successfully',
    type: [ConversationListDto],
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'conv_123abc' },
          title: { type: 'string', example: 'How to improve soil pH?' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          messageCount: { type: 'number', example: 5 },
          lastMessage: { type: 'string', example: 'How can I improve my soil pH level?' }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Failed to fetch conversations',
  })
  async getConversations(
    @GetUser('id') userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ): Promise<ConversationListDto[]> {
    const validatedLimit = Math.min(limit || 50, 100); // Cap at 100
    return this.chatService.getConversations(userId, validatedLimit, offset || 0);
  }

  @Get('conversations/:conversationId')
  @ApiOperation({ 
    summary: 'Get conversation details',
    description: 'Retrieve a specific conversation with all its messages for the authenticated user'
  })
  @ApiParam({
    name: 'conversationId',
    description: 'Unique identifier of the conversation',
    type: 'string',
    example: 'conv_123abc'
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation details retrieved successfully',
    type: ConversationDto,
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'conv_123abc' },
        userId: { type: 'string', example: 'user_456def' },
        title: { type: 'string', example: 'How to improve soil pH?' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        messages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'msg_789ghi' },
              userMessage: { type: 'string', example: 'How can I improve my soil pH level?' },
              assistantMessage: { type: 'string', example: 'To improve soil pH, you can add lime for acidic soil...' },
              messageType: { type: 'string', enum: ['TEXT', 'VOICE', 'IMAGE'] },
              createdAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found or access denied',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Failed to fetch conversation details',
  })
  async getConversationDetails(
    @GetUser('id') userId: string,
    @Param('conversationId') conversationId: string,
  ): Promise<ConversationDto> {
    return this.chatService.getConversationDetails(userId, conversationId);
  }

  @Delete('conversations/:conversationId')
  @ApiOperation({ 
    summary: 'Delete a conversation',
    description: 'Permanently delete a conversation and all its messages. This action cannot be undone.'
  })
  @ApiParam({
    name: 'conversationId',
    description: 'Unique identifier of the conversation to delete',
    type: 'string',
    example: 'conv_123abc'
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Conversation deleted successfully' }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found or access denied',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Failed to delete conversation',
  })
  async deleteConversation(
    @GetUser('id') userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chatService.deleteConversation(userId, conversationId);
  }

  @Post('calculate-fertilizer')
  @ApiOperation({ summary: 'Calculate fertilizer recommendations using AI' })
  @ApiResponse({
    status: 200,
    description: 'Fertilizer calculation completed successfully',
    type: FertilizerCalculationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid sensor data or calculation parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 503,
    description: 'AI service temporarily unavailable',
  })
  async calculateFertilizer(
    @Body() fertilizerCalculationDto: FertilizerCalculationDto,
  ): Promise<FertilizerCalculationResponseDto> {
    return this.chatService.calculateFertilizer(fertilizerCalculationDto);
  }

  @Post('crop-recommendations')
  @ApiOperation({ summary: 'Get crop recommendations based on soil sensor data' })
  @ApiResponse({
    status: 200,
    description: 'Crop recommendations retrieved successfully',
    type: CropRecommendationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid sensor data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 503,
    description: 'AI service temporarily unavailable',
  })
  async getCropRecommendations(
    @Body() cropRecommendationRequestDto: CropRecommendationRequestDto,
  ): Promise<CropRecommendationResponseDto> {
    return this.chatService.getCropRecommendations(cropRecommendationRequestDto);
  }

  @Post('analyze-crop-disease')
  @ApiOperation({ summary: 'Analyze crop disease from leaf image using AI' })
  @ApiResponse({
    status: 200,
    description: 'Crop disease analysis completed successfully',
    type: CropDiseaseAnalysisResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid image data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 503,
    description: 'AI service temporarily unavailable',
  })
  async analyzeCropDisease(
    @Body() cropDiseaseAnalysisRequestDto: CropDiseaseAnalysisRequestDto,
  ): Promise<CropDiseaseAnalysisResponseDto> {
    return this.chatService.analyzeCropDisease(cropDiseaseAnalysisRequestDto);
  }
}
