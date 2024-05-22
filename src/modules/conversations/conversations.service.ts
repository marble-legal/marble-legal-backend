import { Injectable } from "@nestjs/common";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { Conversation } from "./entities/conversation.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UpdateConversationDto } from "./dto/update-conversation.dto";

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
  ) {}

  async create(createConversationDto: CreateConversationDto, userId: string) {
    const message = "test message";

    await Promise.all([
      this.conversationsRepository.insert({
        userId: userId,
        message: createConversationDto.message,
        isUserMessage: true,
      }),
      this.conversationsRepository.insert({
        userId: userId,
        message: message,
        isUserMessage: false,
      }),
    ]);

    return {
      message: message,
    };
  }

  async findAll(userId: string) {
    return await this.conversationsRepository.find({
      where: {
        userId: userId,
      },
      order: {
        createdAt: "ASC",
      },
    });
  }

  async update(id: string, updateConversationDto: UpdateConversationDto) {
    await this.conversationsRepository.update(
      {
        id: id,
      },
      {
        likeStatus: updateConversationDto.likeStatus,
      },
    );

    return {
      message: "Status updated",
    };
  }

  async remove(id: string) {
    await this.conversationsRepository.update(
      {
        id: id,
      },
      {
        isActive: true,
      },
    );
  }
}
