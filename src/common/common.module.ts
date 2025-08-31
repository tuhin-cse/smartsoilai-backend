import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { FileUploadService } from './services';

@Module({
  imports: [ConfigModule],
  providers: [FileUploadService],
  exports: [FileUploadService],
})
export class CommonModule {}
