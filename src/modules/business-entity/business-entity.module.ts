import { Module } from "@nestjs/common";
import { BusinessEntityService } from "./business-entity.service";
import { BusinessEntityController } from "./business-entity.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BusinessEntity } from "./entities/business-entity.entity";
import { SubscriptionModule } from "../subscription/subscription.module";
import { BusinessEntityDataRepository } from "./business-entity.repository";
import { EmailService } from "src/shared/providers/email.service";
import { User } from "../users/entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessEntity, User]),
    SubscriptionModule,
  ],
  controllers: [BusinessEntityController],
  providers: [
    BusinessEntityService,
    BusinessEntityDataRepository,
    EmailService,
  ],
})
export class BusinessEntityModule {}
