import { Module, forwardRef } from '@nestjs/common';
import { SignerController } from './signer.controller';
import { SignerService } from './signer.service';
import { CertificatesModule } from '../certificates/certificates.module';
import { ManifestModule } from '../manifest/manifest.module';

@Module({
  imports: [CertificatesModule, forwardRef(() => ManifestModule)],
  controllers: [SignerController],
  providers: [SignerService],
  exports: [SignerService],
})
export class SignerModule {}
