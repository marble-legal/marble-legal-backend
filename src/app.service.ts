import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EmailService } from "./shared/providers/email.service";

@Injectable()
export class AppService {
  constructor() {}

  getHello(): string {
    return "Hello World!";
  }
}
