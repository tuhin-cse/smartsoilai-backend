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
}
