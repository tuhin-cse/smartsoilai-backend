import { ApiProperty } from '@nestjs/swagger';

export class AnalysisResultDto {
  @ApiProperty({ description: 'Title of the analysis result' })
  title: string;

  @ApiProperty({ description: 'Detailed description of the analysis' })
  description: string;
}

export class AdviceItemDto {
  @ApiProperty({ description: 'Title of the advice' })
  title: string;

  @ApiProperty({ description: 'Detailed description of the advice' })
  description: string;
}

export class AdviceCategoryDto {
  @ApiProperty({ description: 'Category key for the advice' })
  key: string;

  @ApiProperty({ 
    description: 'List of advice items for this category',
    type: [AdviceItemDto] 
  })
  advices: AdviceItemDto[];
}

export class DiseaseAnalysisDto {
  @ApiProperty({ 
    description: 'Analysis results for disease detection',
    type: [AnalysisResultDto] 
  })
  results: AnalysisResultDto[];

  @ApiProperty({ 
    description: 'Categorized advice for crop care',
    type: [AdviceCategoryDto] 
  })
  advices: AdviceCategoryDto[];
}

export class CropDiseaseAnalysisResponseDto {
  @ApiProperty({ description: 'Complete disease analysis results' })
  diseaseAnalysis: DiseaseAnalysisDto;
}
