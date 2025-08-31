import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as path from 'path';

@Injectable()
export class FileUploadService {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
    // Initialize Cloudflare R2 client
    this.s3Client = new S3Client({
      region: 'auto', // Cloudflare R2 uses 'auto' as region
      endpoint: this.configService.cloudflareR2Endpoint, // e.g., https://account-id.r2.cloudflarestorage.com
      credentials: {
        accessKeyId: this.configService.cloudflareR2AccessKeyId,
        secretAccessKey: this.configService.cloudflareR2SecretAccessKey,
      },
      forcePathStyle: true, // Required for R2
    });

    this.bucketName = this.configService.cloudflareR2BucketName;
    this.publicUrl = this.configService.cloudflareR2PublicUrl; // e.g., https://your-bucket.your-custom-domain.com
  }

  private readonly allowedImageTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB

  validateImageFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!this.allowedImageTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed',
      );
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException('File size too large. Maximum size is 5MB');
    }
  }

  generateFileName(originalName: string, userId: string): string {
    const timestamp = Date.now();
    const extension = path.extname(originalName);
    return `profiles/${userId}-${timestamp}${extension}`;
  }

  async saveProfileImage(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string> {
    this.validateImageFile(file);

    // Generate unique filename with folder structure
    const fileName = this.generateFileName(file.originalname, userId);

    try {
      // Upload to Cloudflare R2
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
        // Set cache control for better performance
        CacheControl: 'public, max-age=31536000', // 1 year
      });

      await this.s3Client.send(uploadCommand);

      // Return the public URL
      return `${this.publicUrl}/${fileName}`;
    } catch (error) {
      console.error('Error uploading to R2:', error);
      throw new BadRequestException('Failed to upload image');
    }
  }

  async deleteProfileImage(imageUrl: string): Promise<void> {
    if (!imageUrl || !imageUrl.includes(this.publicUrl)) return;

    try {
      // Extract the key from the URL
      const key = imageUrl.replace(`${this.publicUrl}/`, '');

      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(deleteCommand);
    } catch (error) {
      // Log error but don't throw - it's not critical if old image deletion fails
      console.error('Error deleting profile image from R2:', error);
    }
  }
}
