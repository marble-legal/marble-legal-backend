import { Body, Controller, Get, Post, Request } from "@nestjs/common";
import { AppService } from "./app.service";
import { ApiTags } from "@nestjs/swagger";
import { UsersService } from "./modules/users/users.service";

@ApiTags("Basic")
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly userService: UsersService,
  ) {}

  @Get("/health")
  checkStatus() {
    return {
      status: "online",
      version: "0.0.1",
      message: "all_good",
    };
  }

  // @Post("/stripe-webhook")
  // handleStripeWebhook(@Request() req) {
  //   this.userService.handleStripeWebhook(req.body);
  // }
}
