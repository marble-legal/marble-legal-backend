import { IsEmail } from "class-validator";

export class ContactUsDto {
  @IsEmail()
  email: string;
}
