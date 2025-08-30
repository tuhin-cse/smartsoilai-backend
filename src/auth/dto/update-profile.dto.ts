import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'User name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  name?: string;
}
