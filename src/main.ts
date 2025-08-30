import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import {
  GlobalExceptionFilter,
  HttpExceptionFilter,
  ValidationExceptionFilter,
} from './filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable global exception filters
  app.useGlobalFilters(
    new GlobalExceptionFilter(),
    new ValidationExceptionFilter(),
    new HttpExceptionFilter(),
  );

  // Enable CORS for development
  app.enableCors();

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle(configService.appName)
    .setDescription(
      'A comprehensive NestJS backend with authentication, authorization, and user management',
    )
    .setVersion(configService.appVersion)
    .addBearerAuth(
      {
        description: 'JWT Authorization header using the Bearer scheme',
        name: 'Authorization',
        bearerFormat: 'Bearer',
        scheme: 'Bearer',
        type: 'http',
        in: 'Header',
      },
      'access-token',
    )
    .addTag('Authentication', 'User authentication and registration endpoints')
    .addTag('Users', 'User management operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Setup Swagger UI at /api route
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Make the JSON schema available at /api-json
  SwaggerModule.setup('api-json', app, document, {
    jsonDocumentUrl: '/api-json',
    yamlDocumentUrl: '/api-yaml',
  });

  const port = configService.port;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger UI is available at: http://localhost:${port}/api`);
  console.log(
    `API JSON schema is available at: http://localhost:${port}/api-json`,
  );
}

bootstrap();
