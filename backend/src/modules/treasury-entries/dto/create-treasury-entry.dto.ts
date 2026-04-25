import { IsString, IsUUID, IsOptional, IsNumber, IsDate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTreasuryEntryDto {
  @ApiProperty() @IsString() memberName: string;
  @ApiProperty() @IsNumber() amount: number;
  @ApiProperty() @IsString() paymentType: string;
  @ApiProperty() @Type(() => Date) @IsDate() paymentDate: Date;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() createdBy?: string;
}
