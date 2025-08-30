import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomBusinessException extends HttpException {
  constructor(message: string, statusCode = HttpStatus.BAD_REQUEST) {
    super(
      {
        message,
        error: 'Business Logic Error',
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }
}

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, id: string | number) {
    super(
      {
        message: `${resource} with ID ${id} not found`,
        error: 'Resource Not Found',
        timestamp: new Date().toISOString(),
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class DuplicateResourceException extends HttpException {
  constructor(resource: string, field: string, value: string) {
    super(
      {
        message: `${resource} with ${field} '${value}' already exists`,
        error: 'Duplicate Resource',
        timestamp: new Date().toISOString(),
      },
      HttpStatus.CONFLICT,
    );
  }
}
