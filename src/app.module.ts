import { Module } from "@nestjs/common";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./modules/users/entities/user.entity";
import { EmailService } from "./shared/providers/email.service";
import { UserSubscription } from "./modules/users/entities/user-subscription.entity";
import { ConversationsModule } from "./modules/conversations/conversations.module";
import { Conversation } from "./modules/conversations/entities/conversation.entity";
import { ContractsModule } from "./modules/contracts/contracts.module";
import { Contract } from "./modules/contracts/entities/contract.entity";
import { BusinessEntityModule } from "./modules/business-entity/business-entity.module";
import { BusinessEntity } from "./modules/business-entity/entities/business-entity.entity";
import { UserCustomPlan } from "./modules/users/entities/user-custom-plan.entity";
import { SubscriptionModule } from "./modules/subscription/subscription.module";
import { UserPayment } from "./modules/users/entities/user-payment.entity";

const dbEntities = [
  User,
  UserSubscription,
  Conversation,
  Contract,
  BusinessEntity,
  UserCustomPlan,
  UserPayment,
];

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: dbEntities,
      synchronize: true,
    }),
    UsersModule,
    ConversationsModule,
    ContractsModule,
    BusinessEntityModule,
    SubscriptionModule,
  ],
  controllers: [AppController],
  providers: [AppService, EmailService],
})
export class AppModule {}
