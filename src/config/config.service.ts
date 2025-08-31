import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get port(): number {
    return this.configService.get<number>('port')!;
  }

  get databaseUrl(): string {
    return this.configService.get<string>('database.url')!;
  }

  get jwtSecret(): string {
    return this.configService.get<string>('jwt.secret')!;
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('jwt.expiresIn')!;
  }

  get bcryptSaltRounds(): number {
    return this.configService.get<number>('bcrypt.saltRounds')!;
  }

  get appName(): string {
    return this.configService.get<string>('app.name')!;
  }

  get appVersion(): string {
    return this.configService.get<string>('app.version')!;
  }

  get environment(): string {
    return this.configService.get<string>('app.environment')!;
  }

  get isDevelopment(): boolean {
    return this.environment === 'development';
  }

  get isProduction(): boolean {
    return this.environment === 'production';
  }

  get isTest(): boolean {
    return this.environment === 'test';
  }

  // Cloudflare R2 Configuration
  get cloudflareR2Endpoint(): string {
    return this.configService.get<string>('CLOUDFLARE_R2_ENDPOINT')!;
  }

  get cloudflareR2AccessKeyId(): string {
    return this.configService.get<string>('CLOUDFLARE_R2_ACCESS_KEY_ID')!;
  }

  get cloudflareR2SecretAccessKey(): string {
    return this.configService.get<string>('CLOUDFLARE_R2_SECRET_ACCESS_KEY')!;
  }

  get cloudflareR2BucketName(): string {
    return this.configService.get<string>('CLOUDFLARE_R2_BUCKET_NAME')!;
  }

  get cloudflareR2PublicUrl(): string {
    return this.configService.get<string>('CLOUDFLARE_R2_PUBLIC_URL')!;
  }
}
