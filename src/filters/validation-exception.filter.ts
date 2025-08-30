import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    let message = 'Validation failed';
    let errors = [];

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const responseObj = exceptionResponse as any;

      // Handle class-validator errors
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (Array.isArray(responseObj.message)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        errors = responseObj.message;
        message = 'Validation failed';
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      } else if (responseObj.message) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        message = responseObj.message;
      }
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: 'Bad Request',
      message,
      ...(errors.length > 0 && { errors }),
    };

    // Log validation errors
    this.logger.warn(
      `Validation Exception: ${status} ${request.method} ${request.url}`,
      JSON.stringify(errorResponse),
    );

    response.status(status).json(errorResponse);
  }
}
