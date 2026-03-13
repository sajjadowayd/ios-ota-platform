import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateAppDto } from './dto/create-app.dto';
import { QueryAppsDto } from './dto/query-apps.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AppsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async findAll(query: QueryAppsDto) {
    const { search, category, page = 1, limit = 50 } = query;
    const where: Prisma.AppWhereInput = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (category) {
      where.category = category;
    }

    const [apps, total] = await Promise.all([
      this.prisma.app.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          versions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.app.count({ where }),
    ]);

    return { apps, total, page, limit };
  }

  async findOne(id: string) {
    const app = await this.prisma.app.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          include: { certificate: { select: { id: true, name: true, teamName: true } } },
        },
      },
    });
    if (!app) throw new NotFoundException('App not found');
    return app;
  }

  async create(
    dto: CreateAppDto,
    ipaFile: Express.Multer.File,
    iconFile: Express.Multer.File,
  ) {
    const app = await this.prisma.app.create({
      data: {
        name: dto.name,
        bundleId: dto.bundleId,
        version: dto.version,
        description: dto.description,
        category: dto.category || null,
      },
    });

    // Store icon
    this.storage.ensureAppDir(app.id);
    const iconPath = this.storage.getAppIconPath(app.id);
    this.storage.saveFile(iconPath, iconFile.buffer);

    // Create initial version and store IPA
    const version = await this.prisma.appVersion.create({
      data: {
        appId: app.id,
        version: dto.version,
        originalIpaPath: `apps/${app.id}/versions/PLACEHOLDER/original.ipa`,
        fileSize: BigInt(ipaFile.size),
      },
    });

    this.storage.ensureVersionDir(app.id, version.id);
    const ipaPath = this.storage.getOriginalIpaPath(app.id, version.id);
    this.storage.saveFile(ipaPath, ipaFile.buffer);

    // Update paths
    await this.prisma.appVersion.update({
      where: { id: version.id },
      data: { originalIpaPath: `apps/${app.id}/versions/${version.id}/original.ipa` },
    });

    await this.prisma.app.update({
      where: { id: app.id },
      data: { iconPath: `apps/${app.id}/icon.png` },
    });

    return this.findOne(app.id);
  }

  async remove(id: string) {
    const app = await this.prisma.app.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('App not found');

    await this.prisma.app.delete({ where: { id } });
    this.storage.deleteDir(this.storage.getAppDir(id));

    return { message: 'App deleted successfully' };
  }
}
