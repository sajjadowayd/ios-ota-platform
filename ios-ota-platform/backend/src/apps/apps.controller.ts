import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AppsService } from './apps.service';
import { QueryAppsDto } from './dto/query-apps.dto';

@Controller('api/apps')
export class AppsController {
  constructor(private readonly appsService: AppsService) {}

  @Get()
  async findAll(@Query() query: QueryAppsDto) {
    return this.appsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.appsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'ipa', maxCount: 1 },
        { name: 'icon', maxCount: 1 },
      ],
      {
        limits: { fileSize: 500 * 1024 * 1024 },
        storage: require('multer').memoryStorage(),
      },
    ),
  )
  async create(
    @UploadedFiles() files: { ipa?: Express.Multer.File[]; icon?: Express.Multer.File[] },
    @Body() body: { name: string; bundleId: string; version: string; description: string; category?: string },
  ) {
    if (!files?.ipa?.[0] || !files?.icon?.[0]) {
      throw new BadRequestException('Both IPA file and icon image are required');
    }
    if (!body.name || !body.bundleId || !body.version || !body.description) {
      throw new BadRequestException('name, bundleId, version, and description are required');
    }

    const ipaFile = files.ipa[0];
    const iconFile = files.icon[0];

    if (!ipaFile.originalname.toLowerCase().endsWith('.ipa')) {
      throw new BadRequestException('Only .ipa files are allowed');
    }
    if (!iconFile.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed for icon');
    }

    return this.appsService.create(
      {
        name: body.name,
        bundleId: body.bundleId,
        version: body.version,
        description: body.description,
        category: body.category,
      },
      ipaFile,
      iconFile,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return this.appsService.remove(id);
  }
}
