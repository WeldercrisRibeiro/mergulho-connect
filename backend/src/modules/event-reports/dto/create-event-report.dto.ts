import { IsString, IsOptional, IsInt, IsUUID, IsArray, IsDecimal } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateEventReportDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() eventId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() groupId?: string;
  @ApiPropertyOptional() @IsOptional() reportDate?: string | Date;
  @ApiPropertyOptional() @IsOptional() @IsString() reportType?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() totalAttendees?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() childrenCount?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() monitorsCount?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() youthCount?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() publicCount?: number;
  @ApiPropertyOptional() @IsOptional() totalOfferings?: number;
  @ApiPropertyOptional() @IsOptional() tithesAmount?: number;
  @ApiPropertyOptional() @IsOptional() tithers?: any[];
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() createdBy?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() visitorsCount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() preacher?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sermonRef?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() pastors?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() worshipTeam?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() welcomeTeam?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() mediaTeam?: string[];
}
