import { IsUUID, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty() @IsUUID() senderId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() recipientId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() groupId?: string;
  @ApiProperty() @IsString() content: string;
}
