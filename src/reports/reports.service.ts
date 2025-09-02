import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateReportDto,
  DeleteReportResponseDto,
  ReportListItemDto,
  ReportResponseDto,
} from './dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private prismaService: PrismaService) {}

  async createReport(
    userId: string,
    createReportDto: CreateReportDto,
  ): Promise<ReportResponseDto> {
    try {
      const report = await this.prismaService.report.create({
        data: {
          userId,
          name: createReportDto.name,
          date: new Date(createReportDto.date),
          sensorData: createReportDto.sensorData as any,
          calculationData: createReportDto.calculationData as any,
          selectedCrop: createReportDto.selectedCrop as any,
          cropRecommendations: createReportDto.cropRecommendations as any,
          fertilizerRecommendation:
            createReportDto.fertilizerRecommendation as any,
        },
      });

      return {
        id: report.id,
        userId: report.userId,
        name: report.name,
        date: report.date.toISOString(),
        sensorData: report.sensorData,
        calculationData: report.calculationData,
        selectedCrop: report.selectedCrop,
        cropRecommendations: report.cropRecommendations,
        fertilizerRecommendation: report.fertilizerRecommendation,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
      };
    } catch (error) {
      this.logger.error('Error creating report:', error);
      throw new HttpException(
        'Failed to create report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getReports(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ReportListItemDto[]> {
    try {
      const reports = await this.prismaService.report.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          name: true,
          date: true,
          selectedCrop: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return reports.map((report) => ({
        id: report.id,
        name: report.name,
        date: report.date.toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        cropName: (report.selectedCrop as any)?.name || 'Unknown',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        cropIcon: (report.selectedCrop as any)?.icon || '🌱',
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
      }));
    } catch (error) {
      this.logger.error('Error fetching reports:', error);
      throw new HttpException(
        'Failed to fetch reports',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getReportById(
    userId: string,
    reportId: string,
  ): Promise<ReportResponseDto> {
    try {
      const report = await this.prismaService.report.findFirst({
        where: {
          id: reportId,
          userId,
        },
      });

      if (!report) {
        throw new HttpException(
          'Report not found or access denied',
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        id: report.id,
        userId: report.userId,
        name: report.name,
        date: report.date.toISOString(),
        sensorData: report.sensorData,
        calculationData: report.calculationData,
        selectedCrop: report.selectedCrop,
        cropRecommendations: report.cropRecommendations,
        fertilizerRecommendation: report.fertilizerRecommendation,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
      };
    } catch (error) {
      this.logger.error('Error fetching report details:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to fetch report details',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteReport(
    userId: string,
    reportId: string,
  ): Promise<DeleteReportResponseDto> {
    try {
      const report = await this.prismaService.report.findFirst({
        where: {
          id: reportId,
          userId,
        },
      });

      if (!report) {
        throw new HttpException(
          'Report not found or access denied',
          HttpStatus.NOT_FOUND,
        );
      }

      await this.prismaService.report.delete({
        where: { id: reportId },
      });

      return {
        success: true,
        message: 'Report deleted successfully',
      };
    } catch (error) {
      this.logger.error('Error deleting report:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to delete report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
