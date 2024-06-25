import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";
import { BusinessEntityService } from "./business-entity.service";
import { CreateBusinessEntityDto } from "./dto/create-business-entity.dto";
import { UpdateBusinessEntityDto } from "./dto/update-business-entity.dto";
import { GetBusinessEntitiesDto } from "./dto/get-business-entities.dto";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/shared/providers/jwt.auth.guard";

@ApiTags("Business Entities management")
@Controller("business-entities")
export class BusinessEntityController {
  constructor(private readonly businessEntityService: BusinessEntityService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  create(@Body() createBusinessEntityDto: CreateBusinessEntityDto) {
    return this.businessEntityService.create(createBusinessEntityDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  findAll(@Query() getBusinessEntitiesDto: GetBusinessEntitiesDto) {
    return this.businessEntityService.findAll(getBusinessEntitiesDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.businessEntityService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateBusinessEntityDto: UpdateBusinessEntityDto,
  ) {
    return this.businessEntityService.update(id, updateBusinessEntityDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.businessEntityService.remove(id);
  }
}
