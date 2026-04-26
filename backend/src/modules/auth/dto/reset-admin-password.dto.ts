import { IsOptional, IsString, MinLength } from 'class-validator';

export class ResetAdminPasswordDto {
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
