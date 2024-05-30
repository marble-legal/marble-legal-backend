import { Module } from "@nestjs/common";
import { ContractsService } from "./contracts.service";
import { ContractsController } from "./contracts.controller";
import { Contract } from "./entities/contract.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OpenAIService } from "src/shared/providers/openai.service";
import { FileUploaderService } from "src/shared/providers/file-uploader.service";
import { Conversation } from "../conversations/entities/conversation.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Contract, Conversation])],
  controllers: [ContractsController],
  providers: [ContractsService, OpenAIService, FileUploaderService],
  exports: [ContractsService],
})
export class ContractsModule {}
