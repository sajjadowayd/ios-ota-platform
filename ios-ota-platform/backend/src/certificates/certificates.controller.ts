import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CertificatesService } from './certificates.service';

@Controller('api/certificates')
@UseGuards(JwtAuthGuard)
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get()
  async findAll() {
    return this.certificatesService.findAll();
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'p12', maxCount: 1 },
        { name: 'mobileprovision', maxCount: 1 },
      ],
      {
        limits: { fileSize: 50 * 1024 * 1024 },
        storage: require('multer').memoryStorage(),
      },
    ),
  )
  async upload(
    @UploadedFiles() files: { p12?: Express.Multer.File[]; mobileprovision?: Express.Multer.File[] },
    @Body() body: { name: string; p12Password: string },
  ) {
    if (!files?.p12?.[0]) {
      throw new BadRequestException('Certificate .p12 file is required');
    }
    if (!body.name || !body.p12Password) {
      throw new BadRequestException('Name and p12Password are required');
    }

    const p12File = files.p12[0];
    if (
      !p12File.originalname.toLowerCase().endsWith('.p12') &&
      !p12File.originalname.toLowerCase().endsWith('.pfx')
    ) {
      throw new BadRequestException('Only .p12 or .pfx files are allowed');
    }

    const provisionFile = files.mobileprovision?.[0];
    return this.certificatesService.upload(body.name, body.p12Password, p12File, provisionFile);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.certificatesService.remove(id);
  }

  @Patch(':id/default')
  async setDefault(@Param('id') id: string) {
    return this.certificatesService.setDefault(id);
  }
}
