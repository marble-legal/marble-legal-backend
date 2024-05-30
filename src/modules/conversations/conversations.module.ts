import { Module } from "@nestjs/common";
import { ConversationsService } from "./conversations.service";
import { ConversationsController } from "./conversations.controller";
import { Conversation } from "./entities/conversation.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OpenAIService } from "src/shared/providers/openai.service";

@Module({
  imports: [TypeOrmModule.forFeature([Conversation])],
  controllers: [ConversationsController],
  providers: [ConversationsService, OpenAIService],
})
export class ConversationsModule {}
