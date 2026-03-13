import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class IpaFileValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('IPA file is required');
    }
    if (!file.originalname.toLowerCase().endsWith('.ipa')) {
      throw new BadRequestException('Only .ipa files are allowed');
    }
    // Check ZIP magic bytes (PK\x03\x04)
    if (file.buffer && file.buffer.length >= 4) {
      const magic = file.buffer.slice(0, 4);
      if (magic[0] !== 0x50 || magic[1] !== 0x4b || magic[2] !== 0x03 || magic[3] !== 0x04) {
        throw new BadRequestException('Invalid IPA file format');
      }
    }
    return file;
  }
}

@Injectable()
export class IconFileValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Icon image is required');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed for icon');
    }
    return file;
  }
}

@Injectable()
export class CertificateFileValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Certificate .p12 file is required');
    }
    if (!file.originalname.toLowerCase().endsWith('.p12') && !file.originalname.toLowerCase().endsWith('.pfx')) {
      throw new BadRequestException('Only .p12 or .pfx files are allowed');
    }
    return file;
  }
}
