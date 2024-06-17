import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { BusinessEntityService } from './business-entity.service';
import { CreateBusinessEntityDto } from './dto/create-business-entity.dto';
import { UpdateBusinessEntityDto } from './dto/update-business-entity.dto';
import { GetBusinessEntitiesDto } from './dto/get-business-entities.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Business Entities management')
@Controller('business-entities')
export class BusinessEntityController {
  constructor(private readonly businessEntityService: BusinessEntityService) {}

  @Post()
  create(@Body() createBusinessEntityDto: CreateBusinessEntityDto) {
    return this.businessEntityService.create(createBusinessEntityDto);
  }

  @Get()
  findAll(@Query() getBusinessEntitiesDto: GetBusinessEntitiesDto) {
    return this.businessEntityService.findAll(getBusinessEntitiesDto.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessEntityService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBusinessEntityDto: UpdateBusinessEntityDto) {
    return this.businessEntityService.update(id, updateBusinessEntityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.businessEntityService.remove(id);
  }
}
