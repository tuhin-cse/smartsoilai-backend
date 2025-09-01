import { ApiProperty } from '@nestjs/swagger';

export class ChatResponseDto {
  @ApiProperty({ description: 'AI assistant response message' })
  message: string;

  @ApiProperty({ description: 'Type of the response message' })
  messageType: string;

  @ApiProperty({ description: 'Timestamp of the response' })
  timestamp: string;

  @ApiProperty({ description: 'Conversation ID' })
  conversationId: string;
}
