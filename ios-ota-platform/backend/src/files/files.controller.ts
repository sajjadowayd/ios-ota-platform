import { Controller, Get, Param, Res, Req, NotFoundException } from '@nestjs/common';
import { Response, Request } from 'express';
import { FilesService } from './files.service';

@Controller()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  // New structured routes
  @Get('files/apps/:appId/icon')
  async getIcon(@Param('appId') appId: string, @Res() res: Response) {
    const filePath = this.filesService.getAppIconPath(appId);
    if (!filePath) throw new NotFoundException('Icon not found');
    res.sendFile(filePath);
  }

  @Get('files/apps/:appId/versions/:versionId/ipa')
  async getIpa(
    @Param('appId') appId: string,
    @Param('versionId') versionId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const filePath = await this.filesService.getIpaPath(appId, versionId);
    if (!filePath) throw new NotFoundException('IPA not found');

    // Track download
    const ip = req.ip || req.socket.remoteAddress;
    const ua = req.headers['user-agent'];
    this.filesService.trackDownload(appId, versionId, ip, ua);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.sendFile(filePath);
  }

  // Legacy routes for backward compatibility
  @Get('files/ipa/:filename')
  async getLegacyIpa(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = this.filesService.getLegacyIpaPath(filename);
    if (!filePath) throw new NotFoundException('File not found');

    this.filesService.trackLegacyDownload(filename);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.sendFile(filePath);
  }

  @Get('files/icons/:filename')
  async getLegacyIcon(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = this.filesService.getLegacyIconPath(filename);
    if (!filePath) throw new NotFoundException('File not found');
    res.sendFile(filePath);
  }

  // Health check
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
