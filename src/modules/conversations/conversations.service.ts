import { Injectable } from "@nestjs/common";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { Conversation } from "./entities/conversation.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UpdateConversationDto } from "./dto/update-conversation.dto";
import { OpenAIService } from "src/shared/providers/openai.service";

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    private readonly openAIService: OpenAIService
  ) {}

  async create(createConversationDto: CreateConversationDto, userId: string) {
    const previousConversations = await this.conversationsRepository.find({
      where: {
        userId: userId,
      },
      order: { createdAt: "DESC" },
      take: 16
    });

    const latestConversations = previousConversations.reverse().map(conversation => {
      if (conversation.isUserMessage) {
        return  { role: "user", content: conversation.message }
      }

      return { role: "assistant", content: conversation.message }
    })

    console.log("latestConversations", latestConversations);

    const aiResponse = await this.openAIService.suggestMessage(createConversationDto.message, latestConversations);
    // console.log(aiResponse);
    // const aiResponseObj = JSON.parse(aiResponse);

    console.log(aiResponse)

    const message = aiResponse;

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
