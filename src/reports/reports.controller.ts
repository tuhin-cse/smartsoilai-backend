import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import {
  CreateReportDto,
  DeleteReportResponseDto,
  ReportListItemDto,
  ReportResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new agricultural report',
    description:
      'Create a comprehensive agricultural report with sensor data, crop analysis, and AI recommendations',
  })
  @ApiResponse({
    status: 201,
    description: 'Report created successfully',
    type: ReportResponseDto,
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'rep_123abc456' },
        userId: { type: 'string', example: 'user_789def123' },
        name: {
          type: 'string',
          example: 'Field Analysis Report - North Section',
        },
        date: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-15T10:30:00Z',
        },
        sensorData: {
          type: 'object',
          properties: {
            temperature: { type: 'number', example: 25.5 },
            humidity: { type: 'number', example: 65.0 },
            ec: { type: 'number', example: 1200 },
            ph: { type: 'number', example: 6.8 },
            nitrogen: { type: 'number', example: 45 },
            phosphorus: { type: 'number', example: 25 },
            potassium: { type: 'number', example: 180 },
            salinity: { type: 'number', example: 120 },
          },
        },
        calculationData: {
          type: 'object',
          properties: {
            areaSize: { type: 'string', example: '2.5 hectares' },
            numberOfTrees: { type: 'string', example: '150' },
          },
        },
        selectedCrop: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'tomato' },
            name: { type: 'string', example: 'Tomato' },
            icon: { type: 'string', example: '🍅' },
          },
        },
        cropRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'potato' },
              name: { type: 'string', example: 'Potato' },
              icon: { type: 'string', example: '🥔' },
              suitabilityScore: { type: 'number', example: 85 },
              reasons: {
                type: 'array',
                items: { type: 'string' },
                example: ['Good pH match', 'Suitable climate'],
              },
            },
          },
        },
        fertilizerRecommendation: {
          type: 'object',
          properties: {
            nonOrganic: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Nitrogen' },
                  amount: { type: 'string', example: '15 Kg' },
                  perTree: { type: 'string', example: '0.5 kg/tree' },
                  color: { type: 'string', example: '#D8285C' },
                },
              },
            },
            organic: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Compost' },
                  amount: { type: 'string', example: '40 Kg' },
                  perTree: { type: 'string', example: '1.3 kg/tree' },
                  color: { type: 'string', example: '#624A46' },
                },
              },
            },
          },
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['name should not be empty'],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error - Failed to create report',
  })
  async createReport(
    @GetUser('id') userId: string,
    @Body() createReportDto: CreateReportDto,
  ): Promise<ReportResponseDto> {
    return this.reportsService.createReport(userId, createReportDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all user reports',
    description:
      'Retrieve a paginated list of all reports created by the authenticated user',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of reports to retrieve (default: 50, max: 100)',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of reports to skip for pagination (default: 0)',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Reports retrieved successfully',
    type: [ReportListItemDto],
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'rep_123abc456' },
          name: {
            type: 'string',
            example: 'Field Analysis Report - North Section',
          },
          date: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00Z',
          },
          cropName: { type: 'string', example: 'Tomato' },
          cropIcon: { type: 'string', example: '🍅' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error - Failed to fetch reports',
  })
  async getReports(
    @GetUser('id') userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ): Promise<ReportListItemDto[]> {
    const validatedLimit = Math.min(limit || 50, 100); // Cap at 100
    return this.reportsService.getReports(userId, validatedLimit, offset || 0);
  }

  @Get(':reportId')
  @ApiOperation({
    summary: 'Get report details',
    description:
      'Retrieve detailed information about a specific report including all sensor data, recommendations, and analysis',
  })
  @ApiParam({
    name: 'reportId',
    description: 'Unique identifier of the report',
    type: 'string',
    example: 'rep_123abc456',
  })
  @ApiResponse({
    status: 200,
    description: 'Report details retrieved successfully',
    type: ReportResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Report not found or access denied',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'Report not found or access denied',
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error - Failed to fetch report details',
  })
  async getReportById(
    @GetUser('id') userId: string,
    @Param('reportId') reportId: string,
  ): Promise<ReportResponseDto> {
    return this.reportsService.getReportById(userId, reportId);
  }

  @Delete(':reportId')
  @ApiOperation({
    summary: 'Delete a report',
    description:
      'Permanently delete a report and all its associated data. This action cannot be undone.',
  })
  @ApiParam({
    name: 'reportId',
    description: 'Unique identifier of the report to delete',
    type: 'string',
    example: 'rep_123abc456',
  })
  @ApiResponse({
    status: 200,
    description: 'Report deleted successfully',
    type: DeleteReportResponseDto,
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Report deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Report not found or access denied',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'Report not found or access denied',
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error - Failed to delete report',
  })
  async deleteReport(
    @GetUser('id') userId: string,
    @Param('reportId') reportId: string,
  ): Promise<DeleteReportResponseDto> {
    return this.reportsService.deleteReport(userId, reportId);
  }
}
