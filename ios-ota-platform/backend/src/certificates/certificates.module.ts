import { Module } from '@nestjs/common';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';
import { EncryptionService } from '../common/crypto/encryption.service';

@Module({
  controllers: [CertificatesController],
  providers: [CertificatesService, EncryptionService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
