import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import { ConversationsService } from "./conversations.service";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/shared/providers/jwt.auth.guard";
import { GetConversationsDto } from "./dto/get-conversations.dto";
import { UpdateConversationDto } from "./dto/update-conversation.dto";
import { UserType } from "../users/entities/user.entity";

@ApiTags("Conversations Management")
@Controller("conversations")
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  create(@Body() createConversationDto: CreateConversationDto, @Request() req) {
    return this.conversationsService.create(createConversationDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  findAll(@Query() getConversationsDto: GetConversationsDto, @Request() req) {
    if (
      req.user.type !== UserType.Admin &&
      req.user.id !== getConversationsDto.userId
    ) {
      throw new UnauthorizedException(
        "You don't have permission to perform this operation.",
      );
    }
    return this.conversationsService.findAll(
      getConversationsDto.userId,
      getConversationsDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateConversationDto: UpdateConversationDto,
  ) {
    return this.conversationsService.update(id, updateConversationDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.conversationsService.remove(id);
  }
}
