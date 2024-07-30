import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EmailService } from "./shared/providers/email.service";

@Injectable()
export class AppService {
  constructor(private readonly emailService: EmailService) {}

  getHello(): string {
    return "Hello World!";
  }

  async contactUs(email: string) {
    await this.emailService.sendEmail({
      toEmailIds: [process.env.EMAIL_SENDER_ID],
      subject: "New Customer Query Alert",
      body: `A new customer wants to connect and he can be reached out at: ${email}.`,
    });
  }
}
