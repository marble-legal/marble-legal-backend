import { Module } from "@nestjs/common";
import { SubscriptionService } from "./subscription.service";
import { UserSubscription } from "../users/entities/user-subscription.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserCustomPlan } from "../users/entities/user-custom-plan.entity";
import { User } from "../users/entities/user.entity";
import { StripeService } from "src/shared/providers/stripe.service";

@Module({
  imports: [TypeOrmModule.forFeature([User, UserSubscription, UserCustomPlan])],
  providers: [SubscriptionService, StripeService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
