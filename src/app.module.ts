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

const dbEntities = [User, UserSubscription, Conversation];

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
  ],
  controllers: [AppController],
  providers: [AppService, EmailService],
})
export class AppModule {}
