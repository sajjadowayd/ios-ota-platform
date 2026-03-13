import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  getAppIconPath(appId: string): string | null {
    const iconPath = this.storage.getAppIconPath(appId);
    if (this.storage.fileExists(iconPath)) return iconPath;
    return null;
  }

  async getIpaPath(appId: string, versionId: string): Promise<string | null> {
    const version = await this.prisma.appVersion.findFirst({
      where: { id: versionId, appId },
    });
    if (!version) return null;

    // Prefer signed IPA
    if (version.signedIpaPath) {
      const signedPath = path.join(this.storage.getBasePath(), version.signedIpaPath);
      if (this.storage.fileExists(signedPath)) return signedPath;
    }

    // Fall back to original
    const originalPath = path.join(this.storage.getBasePath(), version.originalIpaPath);
    if (this.storage.fileExists(originalPath)) return originalPath;

    return null;
  }

  async trackDownload(appId: string, versionId: string, ipAddress?: string, userAgent?: string) {
    await Promise.all([
      this.prisma.download.create({
        data: { appId, versionId, ipAddress, userAgent },
      }),
      this.prisma.app.update({
        where: { id: appId },
        data: { downloadCount: { increment: 1 } },
      }),
      this.prisma.appVersion.update({
        where: { id: versionId },
        data: { downloadCount: { increment: 1 } },
      }),
    ]).catch(() => {});
  }

  // Legacy routes support
  getLegacyIpaPath(filename: string): string | null {
    if (!filename || filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      return null;
    }
    const filePath = path.join(process.cwd(), 'uploads', 'ipa', filename);
    if (fs.existsSync(filePath)) return filePath;
    return null;
  }

  getLegacyIconPath(filename: string): string | null {
    if (!filename || filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      return null;
    }
    const filePath = path.join(process.cwd(), 'uploads', 'icons', filename);
    if (fs.existsSync(filePath)) return filePath;
    return null;
  }

  async trackLegacyDownload(ipaFilename: string) {
    await this.prisma.app.updateMany({
      where: { ipaFilename },
      data: { downloadCount: { increment: 1 } },
    }).catch(() => {});
  }
}
