import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateVersionDto {
  @IsString()
  @IsNotEmpty()
  version!: string;

  @IsString()
  @IsOptional()
  buildNumber?: string;

  @IsString()
  @IsOptional()
  releaseNotes?: string;
}
