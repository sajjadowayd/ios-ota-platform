import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CertificatesService } from '../certificates/certificates.service';
import { ManifestService } from '../manifest/manifest.service';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execFileAsync = promisify(execFile);

@Injectable()
export class SignerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly certificatesService: CertificatesService,
    private readonly manifestService: ManifestService,
  ) {}

  async signVersion(appId: string, versionId: string, certificateId: string) {
    // Validate version exists
    const version = await this.prisma.appVersion.findFirst({
      where: { id: versionId, appId },
    });
    if (!version) throw new NotFoundException('Version not found');

    // Validate certificate exists
    const cert = await this.certificatesService.findOne(certificateId);
    if (!cert) throw new NotFoundException('Certificate not found');

    // Update status to SIGNING
    await this.prisma.appVersion.update({
      where: { id: versionId },
      data: { signingStatus: 'SIGNING', certificateId, signingError: null },
    });

    try {
      // Resolve file paths
      const storageBase = this.storage.getBasePath();
      const originalIpaPath = path.join(storageBase, version.originalIpaPath);
      const signedIpaPath = this.storage.getSignedIpaPath(appId, versionId);
      const p12Path = this.storage.getCertP12Path(certificateId);
      const password = await this.certificatesService.getDecryptedPassword(certificateId);

      // Validate files exist
      if (!this.storage.fileExists(originalIpaPath)) {
        throw new Error('Original IPA file not found');
      }
      if (!this.storage.fileExists(p12Path)) {
        throw new Error('Certificate .p12 file not found');
      }

      // Build zsign command arguments
      const args = [
        '-k', p12Path,
        '-p', password,
        '-o', signedIpaPath,
      ];

      // Add provisioning profile if available
      if (cert.provisionProfilePath) {
        const profilePath = this.storage.getProvisionProfilePath(certificateId);
        if (this.storage.fileExists(profilePath)) {
          args.push('-m', profilePath);
        }
      }

      args.push(originalIpaPath);

      // Execute zsign
      await execFileAsync('zsign', args, {
        timeout: 300000, // 5 minute timeout
        maxBuffer: 10 * 1024 * 1024,
      });

      // Update version record
      await this.prisma.appVersion.update({
        where: { id: versionId },
        data: {
          signingStatus: 'SIGNED',
          signedIpaPath: `apps/${appId}/versions/${versionId}/signed.ipa`,
          signingError: null,
        },
      });

      // Generate manifest after successful signing
      const app = await this.prisma.app.findUnique({ where: { id: appId } });
      if (app) {
        await this.manifestService.generateAndSave(app, versionId);
      }

      return this.prisma.appVersion.findUnique({
        where: { id: versionId },
        include: { certificate: { select: { id: true, name: true, teamName: true } } },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signing failed';
      await this.prisma.appVersion.update({
        where: { id: versionId },
        data: {
          signingStatus: 'FAILED',
          signingError: errorMessage,
        },
      });
      throw new BadRequestException(`Signing failed: ${errorMessage}`);
    }
  }
}
