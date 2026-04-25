import { IsString, IsOptional, IsUUID, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVolunteerDto {
  @ApiProperty() @IsUUID() userId: string;
  @ApiProperty() @IsString() fullName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() availability?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() interestArea?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() interestAreas?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}
