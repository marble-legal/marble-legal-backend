import { Injectable } from "@nestjs/common";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { Conversation } from "./entities/conversation.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { UpdateConversationDto } from "./dto/update-conversation.dto";
import { OpenAIService } from "src/shared/providers/openai.service";
import axios from "axios";

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    private readonly openAIService: OpenAIService,
  ) {}

  async create(createConversationDto: CreateConversationDto, userId: string) {
    const previousConversations = await this.conversationsRepository.find({
      where: {
        userId: userId,
      },
      order: { createdAt: "DESC" },
      take: 16,
    });

    const latestConversations = previousConversations.reverse();

    console.log("latestConversations", latestConversations);

    // const aiResponse = await this.openAIService.suggestMessage(
    //   createConversationDto.message,
    //   latestConversations,
    //   false,
    // );
    // // console.log(aiResponse);
    // // const aiResponseObj = JSON.parse(aiResponse);

    // console.log(aiResponse);

    const response = await axios.post(
      "https://rag.api.marblels.com/app/ask",
      {
        query: createConversationDto.message,
        history: {
          User: latestConversations
            .filter((conv) => conv.isUserMessage)
            .map((conv) => conv.message),
          Assistant: latestConversations
            .filter((conv) => !conv.isUserMessage)
            .map((conv) => conv.message),
        },
      },
      {
        headers: {
          "x-api-key": process.env.RAG_API_KEY,
        },
      },
    );

    const message = response.data.answer;

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

  async findAll(userId: string, contractId?: string) {
    const params = {
      userId: userId,
    };

    if (contractId) {
      params["contractId"] = contractId;
    } else {
      params["contractId"] = IsNull();
    }

    return await this.conversationsRepository.find({
      where: params,
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
