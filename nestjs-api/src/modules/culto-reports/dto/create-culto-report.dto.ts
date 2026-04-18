import { IsString, IsOptional, IsInt, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCultoReportDto {
  @ApiProperty() reportDate: string | Date;
  @ApiPropertyOptional() @IsOptional() @IsString() reportType?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() totalAttendees?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() childrenCount?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() youthCount?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() monitorsCount?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() publicCount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() eventId?: string;
  @ApiPropertyOptional() @IsOptional() escalaData?: any[];
  @ApiPropertyOptional() @IsOptional() @IsUUID() createdBy?: string;
}
