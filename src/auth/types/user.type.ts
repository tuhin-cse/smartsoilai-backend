export interface User {
  id: string;
  name: string;
  email: string;
  gender: string | null;
  profileImage: string | null;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Otp {
  id: string;
  code: string;
  type: OtpType;
  expiresAt: Date;
  isUsed: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum OtpType {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PHONE_VERIFICATION = 'PHONE_VERIFICATION',
}
