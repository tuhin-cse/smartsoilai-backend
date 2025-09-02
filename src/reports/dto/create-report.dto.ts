import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsString,
} from 'class-validator';

export class SensorDataDto {
  @ApiProperty({ description: 'Temperature in Celsius', example: 25.5 })
  temperature: number;

  @ApiProperty({ description: 'Humidity percentage', example: 65.0 })
  humidity: number;

  @ApiProperty({
    description: 'Electrical Conductivity in µS/cm',
    example: 1200,
  })
  ec: number;

  @ApiProperty({ description: 'pH level', example: 6.8 })
  ph: number;

  @ApiProperty({ description: 'Nitrogen content in mg/kg', example: 45 })
  nitrogen: number;

  @ApiProperty({ description: 'Phosphorus content in mg/kg', example: 25 })
  phosphorus: number;

  @ApiProperty({ description: 'Potassium content in mg/kg', example: 180 })
  potassium: number;

  @ApiProperty({ description: 'Salinity in mg/kg', example: 120 })
  salinity: number;
}

export class CalculationDataDto {
  @ApiProperty({
    description: 'Area size of the field',
    example: '2.5 hectares',
  })
  areaSize: string;

  @ApiProperty({ description: 'Number of trees/plants', example: '150' })
  numberOfTrees: string;
}

export class SelectedCropDto {
  @ApiProperty({ description: 'Crop ID', example: 'tomato' })
  id: string;

  @ApiProperty({ description: 'Crop name', example: 'Tomato' })
  name: string;

  @ApiProperty({ description: 'Crop icon', example: '🍅' })
  icon: string;
}

export class CropRecommendationDto {
  @ApiProperty({ description: 'Crop ID', example: 'potato' })
  id: string;

  @ApiProperty({ description: 'Crop name', example: 'Potato' })
  name: string;

  @ApiProperty({ description: 'Crop icon', example: '🥔' })
  icon: string;

  @ApiProperty({ description: 'Suitability score', example: 85 })
  suitabilityScore: number;

  @ApiProperty({
    description: 'Reasons for recommendation',
    example: ['Good pH match', 'Suitable climate'],
  })
  reasons: string[];
}

export class FertilizerItemDto {
  @ApiProperty({ description: 'Fertilizer name', example: 'Nitrogen' })
  name: string;

  @ApiProperty({ description: 'Amount needed', example: '15 Kg' })
  amount: string;

  @ApiProperty({ description: 'Amount per tree', example: '0.5 kg/tree' })
  perTree: string;

  @ApiProperty({ description: 'Color code for UI', example: '#D8285C' })
  color: string;
}

export class FertilizerRecommendationDto {
  @ApiProperty({
    description: 'Non-organic fertilizers',
    type: [FertilizerItemDto],
  })
  nonOrganic: FertilizerItemDto[];

  @ApiProperty({
    description: 'Organic fertilizers',
    type: [FertilizerItemDto],
  })
  organic: FertilizerItemDto[];
}

export class CreateReportDto {
  @ApiProperty({
    description: 'Report name',
    example: 'Field Analysis Report - North Section',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Report date', example: '2024-01-15T10:30:00Z' })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Sensor data collected from the field',
    type: SensorDataDto,
  })
  @IsObject()
  sensorData: SensorDataDto;

  @ApiProperty({
    description: 'Field calculation parameters',
    type: CalculationDataDto,
  })
  @IsObject()
  calculationData: CalculationDataDto;

  @ApiProperty({
    description: 'Selected crop for analysis',
    type: SelectedCropDto,
  })
  @IsObject()
  selectedCrop: SelectedCropDto;

  @ApiProperty({
    description: 'AI-generated crop recommendations',
    type: [CropRecommendationDto],
    example: [
      {
        id: 'tomato',
        name: 'Tomato',
        icon: '🍅',
        suitabilityScore: 92,
        reasons: ['Optimal pH range', 'Good nutrient levels'],
      },
    ],
  })
  @IsArray()
  cropRecommendations: CropRecommendationDto[];

  @ApiProperty({
    description: 'AI-generated fertilizer recommendations',
    type: FertilizerRecommendationDto,
  })
  @IsObject()
  fertilizerRecommendation: FertilizerRecommendationDto;
}
