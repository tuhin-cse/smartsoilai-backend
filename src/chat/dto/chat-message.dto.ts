import { IsString, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum MessageType {
  TEXT = 'text',
  VOICE = 'voice',
  IMAGE = 'image',
}

export class ConversationHistoryDto {
  @ApiProperty({ description: 'Role of the message sender' })
  @IsString()
  role: 'user' | 'assistant';

  @ApiProperty({ description: 'Content of the message' })
  @IsString()
  content: string;
}

export class ChatMessageDto {
  @ApiPropertyOptional({ description: 'Conversation ID - if not provided, creates new conversation' })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiPropertyOptional({ description: 'Text message content' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'Base64 encoded image' })
  @IsOptional()
  @IsString()
  imageBase64?: string;

  @ApiPropertyOptional({ description: 'Base64 encoded audio' })
  @IsOptional()
  @IsString()
  audioBase64?: string;

  @ApiProperty({ 
    enum: MessageType, 
    description: 'Type of the message',
    example: MessageType.TEXT 
  })
  @IsEnum(MessageType)
  messageType: MessageType;

  @ApiPropertyOptional({ 
    type: [ConversationHistoryDto],
    description: 'Previous conversation history (optional - will be fetched from conversation if conversationId provided)' 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversationHistoryDto)
  conversationHistory?: ConversationHistoryDto[];
}
