import { ForbiddenException, Injectable } from "@nestjs/common";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { Conversation } from "./entities/conversation.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { UpdateConversationDto } from "./dto/update-conversation.dto";
import axios from "axios";
import { SubscriptionService } from "../subscription/subscription.service";
import { Feature } from "../users/entities/user-custom-plan.entity";
import { GetConversationsDto } from "./dto/get-conversations.dto";

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async create(createConversationDto: CreateConversationDto, userId: string) {
    const canUseFeature = await this.subscriptionService.canUseFeature(
      Feature.AIAssistance,
      userId,
    );

    if (!canUseFeature) {
      throw new ForbiddenException(
        `You don't have credit balance to use this feature.`,
      );
    }

    const previousConversations = await this.conversationsRepository.find({
      where: {
        userId: userId,
        jurisdiction: createConversationDto.juridiction,
      },
      order: { createdAt: "DESC" },
      take: 16,
    });

    const aiConversations = previousConversations.filter(
      (conv) => !conv.isUserMessage,
    );
    const isFollowUp =
      aiConversations.length > 0 ? aiConversations[0].isFollowUp : false;

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
        jurisdiction: createConversationDto.juridiction,
        follow_up_flag: isFollowUp,
      },
      {
        headers: {
          "x-api-key": process.env.RAG_API_KEY,
        },
      },
    );

    const message = response.data.answer;
    const sourceDocuments = response.data?.source_documents;
    const followUp = response.data?.follow_up;

    await this.conversationsRepository.insert({
      userId: userId,
      message: createConversationDto.message,
      isUserMessage: true,
      jurisdiction: createConversationDto.juridiction,
    });

    await this.conversationsRepository.insert({
      userId: userId,
      message: message,
      isUserMessage: false,
      sourceDocuments: sourceDocuments,
      isFollowUp: followUp,
      jurisdiction: createConversationDto.juridiction,
    });

    await this.subscriptionService.deductCreditOnUsingFeature(
      Feature.AIAssistance,
      userId,
    );

    return {
      message: message,
      sourceDocuments: sourceDocuments,
    };
  }

  async findAll(userId: string, getConversationsDto: GetConversationsDto) {
    const params = {
      userId: userId,
    };

    if (getConversationsDto.contractId) {
      params["contractId"] = getConversationsDto.contractId;
    } else {
      params["contractId"] = IsNull();
    }

    if (getConversationsDto.jurisdiction) {
      params["jurisdiction"] = getConversationsDto.jurisdiction;
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
