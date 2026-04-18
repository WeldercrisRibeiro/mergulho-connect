import { PartialType } from '@nestjs/swagger';
import { CreateContactMessageDto } from './create-contact-message.dto';
export class UpdateContactMessageDto extends PartialType(CreateContactMessageDto) {}
