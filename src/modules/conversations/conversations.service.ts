import { ForbiddenException, Injectable } from "@nestjs/common";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { Conversation } from "./entities/conversation.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { UpdateConversationDto } from "./dto/update-conversation.dto";
import axios from "axios";
import { SubscriptionService } from "../subscription/subscription.service";
import { Feature } from "../users/entities/user-custom-plan.entity";

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
        juridiction: createConversationDto.juridiction,
        followup_flag: isFollowUp,
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
    });

    await this.conversationsRepository.insert({
      userId: userId,
      message: message,
      isUserMessage: false,
      sourceDocuments: sourceDocuments,
      isFollowUp: followUp,
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
