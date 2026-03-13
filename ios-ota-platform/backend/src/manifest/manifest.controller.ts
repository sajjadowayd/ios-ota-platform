import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { ManifestService } from './manifest.service';

@Controller()
export class ManifestController {
  constructor(private readonly manifestService: ManifestService) {}

  @Get('api/apps/:id/manifest.plist')
  async getManifest(@Param('id') id: string, @Res() res: Response) {
    try {
      const plistXml = await this.manifestService.getManifestForApp(id);
      res.setHeader('Content-Type', 'application/xml');
      res.send(plistXml);
    } catch {
      throw new NotFoundException('App not found');
    }
  }
}
