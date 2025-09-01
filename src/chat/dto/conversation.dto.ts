import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConversationMessageDto {
  @ApiProperty({ description: 'Message ID' })
  id: string;

  @ApiProperty({ description: 'User message content' })
  userMessage: string;

  @ApiProperty({ description: 'Assistant response' })
  assistantMessage: string;

  @ApiProperty({ description: 'Message type' })
  messageType: string;

  @ApiProperty({ description: 'Message timestamp' })
  createdAt: string;
}

export class ConversationDto {
  @ApiProperty({ description: 'Conversation ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiPropertyOptional({ description: 'Conversation title' })
  title?: string | null;

  @ApiProperty({ description: 'Conversation creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last updated date' })
  updatedAt: string;

  @ApiPropertyOptional({ 
    description: 'Messages in the conversation',
    type: [ConversationMessageDto] 
  })
  messages?: ConversationMessageDto[];
}

export class ConversationListDto {
  @ApiProperty({ description: 'Conversation ID' })
  id: string;

  @ApiPropertyOptional({ description: 'Conversation title' })
  title?: string | null;

  @ApiProperty({ description: 'Conversation creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last updated date' })
  updatedAt: string;

  @ApiProperty({ description: 'Number of messages in conversation' })
  messageCount: number;

  @ApiPropertyOptional({ description: 'Last message preview' })
  lastMessage?: string;
}
