import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { App } from '@prisma/client';

@Injectable()
export class ManifestService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  generatePlist(
    ipaUrl: string,
    iconUrl: string,
    bundleId: string,
    version: string,
    title: string,
  ): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>items</key>
  <array>
    <dict>
      <key>assets</key>
      <array>
        <dict>
          <key>kind</key>
          <string>software-package</string>
          <key>url</key>
          <string>${ipaUrl}</string>
        </dict>
        <dict>
          <key>kind</key>
          <string>display-image</string>
          <key>needs-shine</key>
          <false/>
          <key>url</key>
          <string>${iconUrl}</string>
        </dict>
        <dict>
          <key>kind</key>
          <string>full-size-image</string>
          <key>needs-shine</key>
          <false/>
          <key>url</key>
          <string>${iconUrl}</string>
        </dict>
      </array>
      <key>metadata</key>
      <dict>
        <key>bundle-identifier</key>
        <string>${bundleId}</string>
        <key>bundle-version</key>
        <string>${version}</string>
        <key>kind</key>
        <string>software</string>
        <key>title</key>
        <string>${title}</string>
      </dict>
    </dict>
  </array>
</dict>
</plist>`;
  }

  async generateAndSave(app: App, versionId: string): Promise<string> {
    const baseUrl = this.configService.get<string>('BASE_URL') || `http://localhost:${this.configService.get('PORT') || 3001}`;

    const version = await this.prisma.appVersion.findUnique({
      where: { id: versionId },
    });
    if (!version) throw new Error('Version not found');

    // Use signed IPA if available, otherwise original
    const ipaFileName = version.signedIpaPath
      ? 'signed.ipa'
      : 'original.ipa';

    const ipaUrl = `${baseUrl}/files/apps/${app.id}/versions/${versionId}/ipa`;
    const iconUrl = `${baseUrl}/files/apps/${app.id}/icon`;

    const plistXml = this.generatePlist(
      ipaUrl,
      iconUrl,
      app.bundleId,
      version.version,
      app.name,
    );

    // Save manifest to disk
    const manifestPath = this.storage.getManifestPath(app.id, versionId);
    this.storage.saveFile(manifestPath, Buffer.from(plistXml, 'utf-8'));

    // Update database
    await this.prisma.appVersion.update({
      where: { id: versionId },
      data: { manifestPath: `apps/${app.id}/versions/${versionId}/manifest.plist` },
    });

    return plistXml;
  }

  async getManifestForApp(appId: string): Promise<string> {
    const baseUrl = this.configService.get<string>('BASE_URL') || `http://localhost:${this.configService.get('PORT') || 3001}`;

    const app = await this.prisma.app.findUnique({
      where: { id: appId },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!app) throw new Error('App not found');

    // If we have a version with a manifest, check if it exists on disk
    const latestVersion = app.versions[0];
    if (latestVersion?.manifestPath) {
      const filePath = require('path').join(this.storage.getBasePath(), latestVersion.manifestPath);
      if (this.storage.fileExists(filePath)) {
        return require('fs').readFileSync(filePath, 'utf-8');
      }
    }

    // Generate dynamically (for legacy apps or if manifest not on disk)
    if (latestVersion) {
      const ipaUrl = `${baseUrl}/files/apps/${app.id}/versions/${latestVersion.id}/ipa`;
      const iconUrl = `${baseUrl}/files/apps/${app.id}/icon`;
      return this.generatePlist(ipaUrl, iconUrl, app.bundleId, latestVersion.version, app.name);
    }

    // Fallback for legacy apps without versions (backward compat)
    const ipaUrl = app.ipaFilename ? `${baseUrl}/files/ipa/${app.ipaFilename}` : '';
    const iconUrl = app.iconFilename ? `${baseUrl}/files/icons/${app.iconFilename}` : `${baseUrl}/files/apps/${app.id}/icon`;
    return this.generatePlist(ipaUrl, iconUrl, app.bundleId, app.version, app.name);
  }
}
