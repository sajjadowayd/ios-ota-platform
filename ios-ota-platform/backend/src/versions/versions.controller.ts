import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VersionsService } from './versions.service';
import { CreateVersionDto } from './dto/create-version.dto';

@Controller('api/apps/:appId/versions')
export class VersionsController {
  constructor(private readonly versionsService: VersionsService) {}

  @Get()
  async findAll(@Param('appId') appId: string) {
    return this.versionsService.findAll(appId);
  }

  @Get(':versionId')
  async findOne(@Param('appId') appId: string, @Param('versionId') versionId: string) {
    return this.versionsService.findOne(appId, versionId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('ipa', {
      limits: { fileSize: 500 * 1024 * 1024 },
      storage: require('multer').memoryStorage(),
    }),
  )
  async create(
    @Param('appId') appId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateVersionDto,
  ) {
    if (!file) {
      throw new BadRequestException('IPA file is required');
    }
    if (!file.originalname.toLowerCase().endsWith('.ipa')) {
      throw new BadRequestException('Only .ipa files are allowed');
    }
    return this.versionsService.create(appId, dto, file);
  }
}
