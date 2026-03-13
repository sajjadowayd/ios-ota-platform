import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SignerService } from './signer.service';

@Controller('api/apps/:appId/versions/:versionId')
@UseGuards(JwtAuthGuard)
export class SignerController {
  constructor(private readonly signerService: SignerService) {}

  @Post('sign')
  async sign(
    @Param('appId') appId: string,
    @Param('versionId') versionId: string,
    @Body('certificateId') certificateId: string,
  ) {
    return this.signerService.signVersion(appId, versionId, certificateId);
  }
}
