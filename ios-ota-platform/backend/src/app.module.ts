import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AppsModule } from './apps/apps.module';
import { VersionsModule } from './versions/versions.module';
import { CertificatesModule } from './certificates/certificates.module';
import { SignerModule } from './signer/signer.module';
import { ManifestModule } from './manifest/manifest.module';
import { FilesModule } from './files/files.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    PrismaModule,
    AuthModule,
    AppsModule,
    VersionsModule,
    CertificatesModule,
    SignerModule,
    ManifestModule,
    FilesModule,
    StorageModule,
  ],
})
export class AppModule {}
