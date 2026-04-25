import { IsString, IsOptional, IsInt, IsUUID, IsDate, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCultoReportDto {
  @ApiProperty() @Type(() => Date) @IsDate() reportDate: Date;
  @ApiPropertyOptional() @IsOptional() @IsString() reportType?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() totalAttendees?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() childrenCount?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() youthCount?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() monitorsCount?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() publicCount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() eventId?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() escalaData?: any[];
  @ApiPropertyOptional() @IsOptional() @IsUUID() createdBy?: string;
}
