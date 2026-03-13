import { IsString, IsNotEmpty } from 'class-validator';

export class UploadCertificateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  p12Password!: string;
}
