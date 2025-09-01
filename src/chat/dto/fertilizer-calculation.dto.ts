import { IsString, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SensorDataDto {
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

export class SelectedCropDto {
  @ApiProperty({ description: 'Name of the selected crop', example: 'Tomato' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Crop variety', example: 'Cherry Tomato' })
  @IsOptional()
  @IsString()
  variety?: string;
}

export class CalculationDataDto {
  @ApiProperty({ description: 'Area size in square meters or acres', example: '1000 sq.m' })
  @IsString()
  areaSize: string;

  @ApiProperty({ description: 'Number of trees/plants', example: '30' })
  @IsString()
  numberOfTrees: string;

  @ApiProperty({ description: 'Selected crop information' })
  @ValidateNested()
  @Type(() => SelectedCropDto)
  selectedCrop: SelectedCropDto;
}

export class FertilizerCalculationDto {
  @ApiProperty({ description: 'Soil sensor data' })
  @ValidateNested()
  @Type(() => SensorDataDto)
  sensorData: SensorDataDto;

  @ApiProperty({ description: 'Field and crop calculation data' })
  @ValidateNested()
  @Type(() => CalculationDataDto)
  calculationData: CalculationDataDto;
}
