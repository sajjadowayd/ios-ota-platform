import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAppDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  bundleId!: string;

  @IsString()
  @IsNotEmpty()
  version!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsOptional()
  category?: string;
}
