import { ApiProperty } from '@nestjs/swagger';

export class CropRecommendationDto {
  @ApiProperty({ description: 'Unique identifier for the crop' })
  id: string;

  @ApiProperty({ description: 'Name of the recommended crop' })
  name: string;

  @ApiProperty({ description: 'Emoji icon for the crop' })
  icon: string;

  @ApiProperty({ description: 'Suitability score (0-100)', example: 95 })
  suitabilityScore: number;

  @ApiProperty({ 
    description: 'Reasons why this crop is recommended',
    type: [String] 
  })
  reasons: string[];
}

export class CropRecommendationResponseDto {
  @ApiProperty({ description: 'Whether the recommendation was successful' })
  success: boolean;

  @ApiProperty({ 
    description: 'List of recommended crops',
    type: [CropRecommendationDto] 
  })
  recommendations: CropRecommendationDto[];
}
