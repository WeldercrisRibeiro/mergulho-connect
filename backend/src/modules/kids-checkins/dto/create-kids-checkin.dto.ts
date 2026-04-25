import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKidsCheckinDto {
  @ApiProperty() @IsString() childName: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() guardianId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() itemsDescription?: string;
  @ApiProperty() @IsString() validationToken: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() callRequested?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() eventId?: string;
}
