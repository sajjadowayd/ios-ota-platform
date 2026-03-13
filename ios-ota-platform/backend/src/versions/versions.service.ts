import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateVersionDto } from './dto/create-version.dto';

@Injectable()
export class VersionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async findAll(appId: string) {
    const app = await this.prisma.app.findUnique({ where: { id: appId } });
    if (!app) throw new NotFoundException('App not found');

    return this.prisma.appVersion.findMany({
      where: { appId },
      orderBy: { createdAt: 'desc' },
      include: {
        certificate: { select: { id: true, name: true, teamName: true } },
      },
    });
  }

  async findOne(appId: string, versionId: string) {
    const version = await this.prisma.appVersion.findFirst({
      where: { id: versionId, appId },
      include: {
        certificate: { select: { id: true, name: true, teamName: true } },
      },
    });
    if (!version) throw new NotFoundException('Version not found');
    return version;
  }

  async create(appId: string, dto: CreateVersionDto, ipaFile: Express.Multer.File) {
    const app = await this.prisma.app.findUnique({ where: { id: appId } });
    if (!app) throw new NotFoundException('App not found');

    const version = await this.prisma.appVersion.create({
      data: {
        appId,
        version: dto.version,
        buildNumber: dto.buildNumber || null,
        releaseNotes: dto.releaseNotes || null,
        originalIpaPath: `apps/${appId}/versions/PLACEHOLDER/original.ipa`,
        fileSize: BigInt(ipaFile.size),
      },
    });

    // Store IPA file
    this.storage.ensureVersionDir(appId, version.id);
    const ipaPath = this.storage.getOriginalIpaPath(appId, version.id);
    this.storage.saveFile(ipaPath, ipaFile.buffer);

    // Update paths and app version
    await Promise.all([
      this.prisma.appVersion.update({
        where: { id: version.id },
        data: { originalIpaPath: `apps/${appId}/versions/${version.id}/original.ipa` },
      }),
      this.prisma.app.update({
        where: { id: appId },
        data: { version: dto.version },
      }),
    ]);

    return this.findOne(appId, version.id);
  }
}
