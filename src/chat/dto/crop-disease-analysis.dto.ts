import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CropDiseaseAnalysisRequestDto {
  @ApiProperty({ 
    description: 'Base64 encoded image of the crop leaf for disease analysis',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...'
  })
  @IsString()
  imageBase64: string;
}
