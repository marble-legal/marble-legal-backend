import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { User } from "./entities/user.entity";
import { EmailService } from "../../shared/providers/email.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtStrategy } from "../../shared/providers/jwt.strategy";
import { UserDataRepository } from "./users.repository";
import { UserSubscription } from "./entities/user-subscription.entity";
import { StripeService } from "src/shared/providers/stripe.service";
import { ContractsService } from "../contracts/contracts.service";
import { ContractsModule } from "../contracts/contracts.module";
import { UserCustomPlan } from "./entities/user-custom-plan.entity";
import { SubscriptionModule } from "../subscription/subscription.module";
import { UserPayment } from "./entities/user-payment.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserPayment]),
    ContractsModule,
    SubscriptionModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    EmailService,
    JwtStrategy,
    UserDataRepository,
    StripeService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
