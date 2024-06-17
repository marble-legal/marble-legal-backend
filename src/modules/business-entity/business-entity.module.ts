import { Module } from "@nestjs/common";
import { BusinessEntityService } from "./business-entity.service";
import { BusinessEntityController } from "./business-entity.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BusinessEntity } from "./entities/business-entity.entity";

@Module({
  imports: [TypeOrmModule.forFeature([BusinessEntity])],
  controllers: [BusinessEntityController],
  providers: [BusinessEntityService],
})
export class BusinessEntityModule {}
