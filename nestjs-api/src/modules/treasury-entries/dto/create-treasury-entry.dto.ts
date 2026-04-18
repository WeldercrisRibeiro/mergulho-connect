import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTreasuryEntryDto {
  @ApiProperty() @IsString() memberName: string;
  @ApiProperty() amount: number;
  @ApiProperty() @IsString() paymentType: string;
  @ApiProperty() paymentDate: string | Date;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() createdBy?: string;
}
