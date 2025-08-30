import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class ConfigValidation {
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @IsOptional()
  PORT?: number;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  @IsOptional()
  JWT_SECRET?: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN?: string;

  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @IsOptional()
  BCRYPT_SALT_ROUNDS?: number;

  @IsString()
  @IsOptional()
  APP_NAME?: string;

  @IsString()
  @IsOptional()
  APP_VERSION?: string;

  @IsString()
  @IsOptional()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV?: string;
}
