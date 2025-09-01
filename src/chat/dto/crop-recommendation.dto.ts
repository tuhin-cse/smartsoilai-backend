import { IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CropSensorDataDto {
  @ApiProperty({ description: 'Soil temperature in Celsius', example: 25.5 })
  @IsNumber()
  temperature: number;

  @ApiProperty({ description: 'Soil humidity percentage', example: 65.2 })
  @IsNumber()
  humidity: number;

  @ApiProperty({ description: 'Electrical conductivity in µS/cm', example: 450 })
  @IsNumber()
  ec: number;

  @ApiProperty({ description: 'Soil pH level', example: 6.8 })
  @IsNumber()
  ph: number;

  @ApiProperty({ description: 'Current nitrogen content in mg/kg', example: 120 })
  @IsNumber()
  nitrogen: number;

  @ApiProperty({ description: 'Current phosphorus content in mg/kg', example: 85 })
  @IsNumber()
  phosphorus: number;

  @ApiProperty({ description: 'Current potassium content in mg/kg', example: 200 })
  @IsNumber()
  potassium: number;

  @ApiProperty({ description: 'Soil salinity in mg/kg', example: 300 })
  @IsNumber()
  salinity: number;
}

export class CropRecommendationRequestDto {
  @ApiProperty({ description: 'Soil sensor data for crop recommendations' })
  @ValidateNested()
  @Type(() => CropSensorDataDto)
  sensorData: CropSensorDataDto;
}
