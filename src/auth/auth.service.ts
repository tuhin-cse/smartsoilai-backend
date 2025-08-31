import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { OtpService } from './otp.service';
import { FileUploadService, FirebaseService } from '../common/services';
import { OtpType, User } from './types/user.type';
import * as bcrypt from 'bcryptjs';
import { SigninDto } from './dto/signin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { SocialLoginDto } from './dto/social-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private otpService: OtpService,
    private fileUploadService: FileUploadService,
    private firebaseService: FirebaseService,
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

    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Please verify your email before signing in',
        {
          description: 'EMAIL_NOT_VERIFIED',
        },
      );
    }

    return this.generateTokens(user);
  }

  async signup(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    if (!user) {
      return null;
    }

    // Generate OTP for email verification
    const otpCode = await this.otpService.createOtp(
      user.id,
      OtpType.EMAIL_VERIFICATION,
    );

    return {
      message:
        'User registered successfully. Please verify your email with the OTP sent.',
      user,
      // Remove this in production - OTP should be sent via email
      otp: otpCode,
    };
  }

  async verifySignupOtp(verifyOtpDto: VerifyOtpDto) {
    // Verify OTP
    await this.otpService.verifyOtpByEmail(
      verifyOtpDto.email,
      verifyOtpDto.otp,
      OtpType.EMAIL_VERIFICATION,
    );

    // Get user and verify email
    const user = await this.usersService.findByEmail(verifyOtpDto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const verifiedUser = await this.usersService.verifyUserEmail(user.id);
    return this.generateTokens(verifiedUser);
  }

  async resendSignupOtp(resendOtpDto: ResendOtpDto) {
    const user = await this.usersService.findByEmail(resendOtpDto.email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('User is already verified');
    }

    // Generate new OTP
    const otpCode = await this.otpService.resendOtpByEmail(
      resendOtpDto.email,
      OtpType.EMAIL_VERIFICATION,
    );

    // TODO: Send OTP via email
    // For development, return the OTP (remove in production)
    return { message: 'OTP sent successfully', otp: otpCode };
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
        gender: user.gender,
        profileImage: user.profileImage,
        isActive: user.isActive,
        isVerified: user.isVerified,
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
      if (!user || !user.isActive || !user.isVerified) {
        throw new UnauthorizedException(
          'User not found, inactive, or not verified',
        );
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
      return { message: 'If the email exists, a reset code has been sent' };
    }

    // Generate OTP for password reset
    const otpCode = await this.otpService.createOtp(
      user.id,
      OtpType.PASSWORD_RESET,
    );

    // TODO: Send OTP via email
    // For development, return the OTP (remove in production)
    return {
      message: 'If the email exists, a reset code has been sent',
      otp: otpCode, // Remove this in production
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      // First verify the OTP/token
      const user = await this.usersService.findByEmail(resetPasswordDto.email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify OTP
      await this.otpService.verifyOtp(
        user.id,
        resetPasswordDto.token,
        OtpType.PASSWORD_RESET,
      );

      // Hash new password
      const hashedPassword = await bcrypt.hash(
        resetPasswordDto.newPassword,
        10,
      );

      // Update user password
      await this.usersService.updatePassword(user.id, hashedPassword);

      return { message: 'Password reset successfully' };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException('Invalid or expired reset code');
    }
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  async uploadProfileImage(userId: string, file: Express.Multer.File) {
    // Get current user to check if they have an existing profile image
    const currentUser = await this.usersService.findOne(userId);

    // Delete old profile image if exists
    if (currentUser.profileImage) {
      await this.fileUploadService.deleteProfileImage(currentUser.profileImage);
    }

    // Upload new profile image
    const imagePath = await this.fileUploadService.saveProfileImage(
      file,
      userId,
    );

    // Update user with new profile image path
    const updatedUser = await this.usersService.updateProfileImage(
      userId,
      imagePath,
    );

    return {
      message: 'Profile image uploaded successfully',
      profileImage: imagePath,
      user: updatedUser,
    };
  }

  async socialLogin(socialLoginDto: SocialLoginDto) {
    try {
      // Verify Firebase ID token
      const decodedToken = await this.firebaseService.verifyIdToken(
        socialLoginDto.idToken,
      );

      // Extract user information from Firebase token
      const { uid, email, name } = decodedToken;

      if (!email) {
        throw new BadRequestException('Email is required for social login');
      }

      // Check if user already exists
      let user = await this.usersService.findByEmail(email);

      if (user) {
        // User exists, check if active and verified
        if (!user.isActive) {
          throw new UnauthorizedException('User account is not active');
        }

        // For social login users, we auto-verify them
        if (!user.isVerified) {
          const verifiedUser = await this.usersService.verifyUserEmail(user.id);
          return this.generateTokens(verifiedUser);
        }

        // Remove password from user object before generating tokens
        const { password: _, ...userWithoutPassword } = user;
        return this.generateTokens(userWithoutPassword);
      } else {
        // User doesn't exist, create new user
        const createUserDto: CreateUserDto = {
          name: name || email.split('@')[0] || 'User', // Use email prefix if name not provided
          email,
          password: uid, // Use Firebase UID as password (user won't need it for social login)
          gender: undefined, // Can be updated later
        };

        // Create user
        const newUser = await this.usersService.create(createUserDto);

        // Auto-verify social login users
        const verifiedUser = await this.usersService.verifyUserEmail(
          newUser.id,
        );

        // If user has a profile picture from social login, we could update it here
        // For now, we'll leave it as null and they can upload later

        return this.generateTokens(verifiedUser);
      }
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Social login error:', error);
      throw new UnauthorizedException('Social login failed');
    }
  }
}
