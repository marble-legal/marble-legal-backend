import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  UseInterceptors,
  UploadedFile,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { ContractsService } from "./contracts.service";
import { CreateContractDto } from "./dto/create-contract.dto";
import { UpdateContractDto } from "./dto/update-contract.dto";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/shared/providers/jwt.auth.guard";
import { GetContractsDto } from "./dto/get-contracts.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { CreateContractConversationDto } from "./dto/create-contract-conversation.dto";
import { UserType } from "../users/entities/user.entity";

@ApiTags("Contracts Management")
@Controller("contracts")
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  create(@Body() createContractDto: CreateContractDto, @Request() req) {
    return this.contractsService.create(createContractDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  findAll(@Query() getContractsDto: GetContractsDto, @Request() req) {
    if (
      req.user.type !== UserType.Admin &&
      req.user.id !== getContractsDto.userId
    ) {
      throw new UnauthorizedException(
        "You don't have permission to perform this operation.",
      );
    }
    return this.contractsService.findAll(getContractsDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.contractsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateContractDto: UpdateContractDto,
    @Request() req,
  ) {
    return this.contractsService.update(id, updateContractDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.contractsService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(":id/query")
  provideQueryResponse(
    @Param("id") id: string,
    @Body() createContractConversationDto: CreateContractConversationDto,
    @Request() req,
  ) {
    return this.contractsService.provideQueryResponse(
      id,
      createContractConversationDto,
      req.user.id,
    );
  }
}
