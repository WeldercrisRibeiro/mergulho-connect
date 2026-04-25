import { IsString, IsOptional, IsBoolean, IsUUID, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty() @IsString() @IsNotEmpty() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty({ description: 'ISO 8601 date string' }) @IsNotEmpty() @IsDateString() eventDate: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isGeneral?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsUUID() groupId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() createdBy?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() eventType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bannerUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() speakers?: string;
  @ApiPropertyOptional() @IsOptional() price?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() pixKey?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pixQrcodeUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() mapUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() sendWhatsapp?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() requireCheckin?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() checkinQrSecret?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublic?: boolean;
}
