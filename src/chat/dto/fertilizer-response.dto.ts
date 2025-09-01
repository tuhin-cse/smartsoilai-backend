import { ApiProperty } from '@nestjs/swagger';

export class FertilizerItemDto {
  @ApiProperty({ description: 'Name of the fertilizer' })
  name: string;

  @ApiProperty({ description: 'Total amount needed' })
  amount: string;

  @ApiProperty({ description: 'Amount per tree/plant' })
  perTree: string;

  @ApiProperty({ description: 'Display color for UI' })
  color: string;
}

export class FertilizerRecommendationDto {
  @ApiProperty({ type: [FertilizerItemDto], description: 'Non-organic fertilizers' })
  nonOrganic: FertilizerItemDto[];

  @ApiProperty({ type: [FertilizerItemDto], description: 'Organic fertilizers' })
  organic: FertilizerItemDto[];
}

export class FertilizerCalculationResponseDto {
  @ApiProperty({ description: 'Whether the calculation was successful' })
  success: boolean;

  @ApiProperty({ description: 'Fertilizer recommendations' })
  recommendation: FertilizerRecommendationDto;
}
