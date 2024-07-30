import { Body, Controller, Get, Post, Request } from "@nestjs/common";
import { AppService } from "./app.service";
import { ApiTags } from "@nestjs/swagger";
import { UsersService } from "./modules/users/users.service";
import { SubscriptionService } from "./modules/subscription/subscription.service";
import { ContactUsDto } from "./dto/contact-us.dto";

@ApiTags("Basic")
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly userService: UsersService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Get("/health")
  checkStatus() {
    return {
      status: "online",
      version: "0.0.1",
      message: "all_good",
    };
  }

  @Post("/stripe-webhook")
  handleStripeWebhook(@Request() req) {
    this.subscriptionService.handleStripeWebhook(
      req.body,
      req.rawBody,
      req.headers["stripe-signature"],
    );
  }

  @Post("/contact-us")
  async handleContactUs(@Body() contactUsDto: ContactUsDto) {
    await this.appService.contactUs(contactUsDto.email);
  }
}
