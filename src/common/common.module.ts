import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { FileUploadService, FirebaseService } from './services';

@Module({
  imports: [ConfigModule],
  providers: [FileUploadService, FirebaseService],
  exports: [FileUploadService, FirebaseService],
})
export class CommonModule {}
