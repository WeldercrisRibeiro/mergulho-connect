import { IsString, IsOptional, IsBoolean, IsUUID, IsDecimal, IsInt, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateEventDto {
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() eventDate: string | Date;
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
