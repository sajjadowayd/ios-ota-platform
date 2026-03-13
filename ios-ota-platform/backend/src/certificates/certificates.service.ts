import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { EncryptionService } from '../common/crypto/encryption.service';
import * as forge from 'node-forge';

@Injectable()
export class CertificatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly encryption: EncryptionService,
  ) {}

  async findAll() {
    return this.prisma.certificate.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        teamName: true,
        teamId: true,
        expiresAt: true,
        isDefault: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        provisionProfilePath: true,
      },
    });
  }

  async findOne(id: string) {
    const cert = await this.prisma.certificate.findUnique({ where: { id } });
    if (!cert) throw new NotFoundException('Certificate not found');
    return cert;
  }

  async upload(
    name: string,
    p12Password: string,
    p12File: Express.Multer.File,
    provisionFile?: Express.Multer.File,
  ) {
    // Validate .p12 by attempting to parse it
    let teamName: string | null = null;
    let expiresAt: Date | null = null;

    try {
      const p12Der = forge.util.createBuffer(p12File.buffer.toString('binary'));
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, p12Password);

      // Extract certificate info
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certs = certBags[forge.pki.oids.certBag];
      if (certs && certs.length > 0 && certs[0].cert) {
        const cert = certs[0].cert;
        const subject = cert.subject;
        const orgAttr = subject.getField('O');
        if (orgAttr) teamName = orgAttr.value as string;
        expiresAt = cert.validity.notAfter;
      }
    } catch {
      throw new BadRequestException('Invalid .p12 file or wrong password');
    }

    // Encrypt password
    const p12PasswordEncrypted = this.encryption.encrypt(p12Password);

    // Create record
    const certificate = await this.prisma.certificate.create({
      data: {
        name,
        teamName,
        expiresAt,
        p12Path: `certs/PLACEHOLDER/cert.p12`,
        p12PasswordEncrypted,
        provisionProfilePath: provisionFile ? `certs/PLACEHOLDER/profile.mobileprovision` : null,
      },
    });

    // Store files
    this.storage.ensureCertDir(certificate.id);
    const p12Path = this.storage.getCertP12Path(certificate.id);
    this.storage.saveFile(p12Path, p12File.buffer);

    if (provisionFile) {
      const profilePath = this.storage.getProvisionProfilePath(certificate.id);
      this.storage.saveFile(profilePath, provisionFile.buffer);
    }

    // Update paths
    await this.prisma.certificate.update({
      where: { id: certificate.id },
      data: {
        p12Path: `certs/${certificate.id}/cert.p12`,
        provisionProfilePath: provisionFile ? `certs/${certificate.id}/profile.mobileprovision` : null,
      },
    });

    return this.findOne(certificate.id);
  }

  async remove(id: string) {
    const cert = await this.prisma.certificate.findUnique({ where: { id } });
    if (!cert) throw new NotFoundException('Certificate not found');

    await this.prisma.certificate.delete({ where: { id } });
    this.storage.deleteDir(this.storage.getCertDir(id));

    return { message: 'Certificate deleted successfully' };
  }

  async setDefault(id: string) {
    const cert = await this.prisma.certificate.findUnique({ where: { id } });
    if (!cert) throw new NotFoundException('Certificate not found');

    // Remove default from all others
    await this.prisma.certificate.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });

    await this.prisma.certificate.update({
      where: { id },
      data: { isDefault: true },
    });

    return this.findOne(id);
  }

  async getDecryptedPassword(id: string): Promise<string> {
    const cert = await this.findOne(id);
    return this.encryption.decrypt(cert.p12PasswordEncrypted);
  }
}
