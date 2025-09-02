import { ApiProperty } from '@nestjs/swagger';

export class ReportResponseDto {
  @ApiProperty({ description: 'Report ID', example: 'rep_123abc456' })
  id: string;

  @ApiProperty({
    description: 'User ID who created the report',
    example: 'user_789def123',
  })
  userId: string;

  @ApiProperty({
    description: 'Report name',
    example: 'Field Analysis Report - North Section',
  })
  name: string;

  @ApiProperty({ description: 'Report date', example: '2024-01-15T10:30:00Z' })
  date: string;

  @ApiProperty({ description: 'Sensor data from the field' })
  sensorData: any;

  @ApiProperty({ description: 'Field calculation parameters' })
  calculationData: any;

  @ApiProperty({ description: 'Selected crop for analysis' })
  selectedCrop: any;

  @ApiProperty({ description: 'AI-generated crop recommendations' })
  cropRecommendations: any[];

  @ApiProperty({ description: 'AI-generated fertilizer recommendations' })
  fertilizerRecommendation: any;

  @ApiProperty({
    description: 'Report creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Report last update timestamp',
    example: '2024-01-15T10:35:00Z',
  })
  updatedAt: string;
}

export class ReportListItemDto {
  @ApiProperty({ description: 'Report ID', example: 'rep_123abc456' })
  id: string;

  @ApiProperty({
    description: 'Report name',
    example: 'Field Analysis Report - North Section',
  })
  name: string;

  @ApiProperty({ description: 'Report date', example: '2024-01-15T10:30:00Z' })
  date: string;

  @ApiProperty({ description: 'Selected crop name', example: 'Tomato' })
  cropName: string;

  @ApiProperty({ description: 'Selected crop icon', example: '🍅' })
  cropIcon: string;

  @ApiProperty({
    description: 'Report creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Report last update timestamp',
    example: '2024-01-15T10:35:00Z',
  })
  updatedAt: string;
}

export class DeleteReportResponseDto {
  @ApiProperty({ description: 'Success status', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Success message',
    example: 'Report deleted successfully',
  })
  message: string;
}
