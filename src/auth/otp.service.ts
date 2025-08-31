import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OtpType } from './types/user.type';

@Injectable()
export class OtpService {
  constructor(private prisma: PrismaService) {}

  generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createOtp(userId: string, type: OtpType): Promise<string> {
    // Invalidate any existing unused OTPs for this user and type
    await this.prisma.otp.updateMany({
      where: {
        userId,
        type,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    const code = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.otp.create({
      data: {
        code,
        type,
        expiresAt,
        userId,
      },
    });

    return code;
  }

  async verifyOtp(
    userId: string,
    code: string,
    type: OtpType,
  ): Promise<boolean> {
    const otp = await this.prisma.otp.findFirst({
      where: {
        userId,
        code,
        type,
        isUsed: false,
      },
    });

    if (!otp) {
      throw new BadRequestException('Invalid OTP code');
    }

    if (otp.expiresAt < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    // Mark OTP as used
    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    return true;
  }

  async verifyOtpByEmail(
    email: string,
    code: string,
    type: OtpType,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.verifyOtp(user.id, code, type);
  }

  async resendOtp(userId: string, type: OtpType): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.createOtp(userId, type);
  }

  async resendOtpByEmail(email: string, type: OtpType): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.createOtp(user.id, type);
  }

  async cleanupExpiredOtps(): Promise<void> {
    await this.prisma.otp.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
