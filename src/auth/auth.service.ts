import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { SigninDto } from './dto/signin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from './types/user.type';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signin(signinDto: SigninDto) {
    const user = await this.usersService.findByEmail(signinDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      signinDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is not active');
    }

    return this.generateTokens(user);
  }

  async signup(createUserDto: any) {
    const user = await this.usersService.create(createUserDto);
    if (!user) {
      return null;
    }
    return this.generateTokens(user);
  }

  generateTokens(user: Omit<User, 'password'>) {
    const accessToken = this.jwtService.sign({
      id: user.id,
      email: user.email,
      type: 'access',
    });
    const refreshToken = this.jwtService.sign(
      {
        id: user.id,
        email: user.email,
        type: 'refresh',
      },
      {
        expiresIn: '30d',
      },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload: {
        id: string;
        email: string;
        type: string;
      } = this.jwtService.verify(refreshTokenDto.refreshToken);

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.usersService.findByEmail(payload.email);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      // Don't reveal if email exists or not for security
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = this.jwtService.sign(
      {
        id: user.id,
        email: user.email,
        type: 'reset',
      },
      {
        expiresIn: '1h',
      },
    );

    // TODO: Send email with reset token
    // For now, return the token (in production, this should be sent via email)
    return {
      message: 'If the email exists, a reset link has been sent',
      resetToken, // Remove this in production
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const payload: {
        id: string;
        email: string;
        type: string;
      } = this.jwtService.verify(resetPasswordDto.token);

      if (payload.type !== 'reset') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.usersService.findByEmail(payload.email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(
        resetPasswordDto.newPassword,
        10,
      );

      // Update user password
      await this.usersService.updatePassword(user.id, hashedPassword);

      return { message: 'Password reset successfully' };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, updateProfileDto);
  }
}
