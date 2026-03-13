import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), 'storage');
    this.ensureDir(this.baseDir);
  }

  getBasePath(): string {
    return this.baseDir;
  }

  getAppDir(appId: string): string {
    return path.join(this.baseDir, 'apps', appId);
  }

  getVersionDir(appId: string, versionId: string): string {
    return path.join(this.baseDir, 'apps', appId, 'versions', versionId);
  }

  getCertDir(certId: string): string {
    return path.join(this.baseDir, 'certs', certId);
  }

  getAppIconPath(appId: string): string {
    return path.join(this.getAppDir(appId), 'icon.png');
  }

  getOriginalIpaPath(appId: string, versionId: string): string {
    return path.join(this.getVersionDir(appId, versionId), 'original.ipa');
  }

  getSignedIpaPath(appId: string, versionId: string): string {
    return path.join(this.getVersionDir(appId, versionId), 'signed.ipa');
  }

  getManifestPath(appId: string, versionId: string): string {
    return path.join(this.getVersionDir(appId, versionId), 'manifest.plist');
  }

  getCertP12Path(certId: string): string {
    return path.join(this.getCertDir(certId), 'cert.p12');
  }

  getProvisionProfilePath(certId: string): string {
    return path.join(this.getCertDir(certId), 'profile.mobileprovision');
  }

  ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  ensureAppDir(appId: string): void {
    this.ensureDir(this.getAppDir(appId));
  }

  ensureVersionDir(appId: string, versionId: string): void {
    this.ensureDir(this.getVersionDir(appId, versionId));
  }

  ensureCertDir(certId: string): void {
    this.ensureDir(this.getCertDir(certId));
  }

  saveFile(filePath: string, data: Buffer): void {
    const dir = path.dirname(filePath);
    this.ensureDir(dir);
    fs.writeFileSync(filePath, data);
  }

  deleteFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // Ignore missing files
    }
  }

  deleteDir(dirPath: string): void {
    try {
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    } catch {
      // Ignore errors
    }
  }

  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  resolveSafePath(base: string, ...segments: string[]): string | null {
    const resolved = path.resolve(base, ...segments);
    if (!resolved.startsWith(path.resolve(base))) {
      return null; // Path traversal attempt
    }
    return resolved;
  }
}
