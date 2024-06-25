import { ForbiddenException, Injectable } from "@nestjs/common";
import { CreateBusinessEntityDto } from "./dto/create-business-entity.dto";
import { UpdateBusinessEntityDto } from "./dto/update-business-entity.dto";
import { BusinessEntity } from "./entities/business-entity.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SubscriptionService } from "../subscription/subscription.service";
import { Feature } from "../users/entities/user-custom-plan.entity";
import { GetBusinessEntitiesDto } from "./dto/get-business-entities.dto";

@Injectable()
export class BusinessEntityService {
  constructor(
    @InjectRepository(BusinessEntity)
    private businessEnitiesRepository: Repository<BusinessEntity>,
    private readonly subscriptionService: SubscriptionService,
  ) {}
  
  async create(createBusinessEntityDto: CreateBusinessEntityDto) {
    const canUseFeature = await this.subscriptionService.canUseFeature(Feature.BusinessEntity, createBusinessEntityDto.userId)
    
    if (!canUseFeature) {
      throw new ForbiddenException(`You don't have credit balance to use this feature.`)
    }

    const [businessEntity] = await Promise.all([
      this.businessEnitiesRepository.save({
        userId: createBusinessEntityDto.userId,
        name: createBusinessEntityDto.name,
        address: createBusinessEntityDto.address,
        state: createBusinessEntityDto.state,
        clients: createBusinessEntityDto.clients,
        owners: createBusinessEntityDto.owners,
        isInvestorsUsCitizen: createBusinessEntityDto.isInvestorsUsCitizen,
        isRestrictionsOnTransfer:
          createBusinessEntityDto.isRestrictionsOnTransfer,
        restrictionsOnTransferDetail:
          createBusinessEntityDto.restrictionsOnTransferDetail,
        isProfitsLossSharedEqually:
          createBusinessEntityDto.isProfitsLossSharedEqually,
        type: createBusinessEntityDto.type,
        issues: createBusinessEntityDto.issues,
        purpose: createBusinessEntityDto.purpose,
        agent: createBusinessEntityDto.agent,
        useTrademark: createBusinessEntityDto.useTrademark,
        specialLicenses: createBusinessEntityDto.specialLicenses,
        bankAccountType: createBusinessEntityDto.bankAccountType,
        loanDetail: createBusinessEntityDto.loanDetail,
        accountantDetail: createBusinessEntityDto.accountantDetail,
        managementDetail: createBusinessEntityDto.managementDetail,
        signingResposibility: createBusinessEntityDto.signingResposibility,
        powersDetail: createBusinessEntityDto.powersDetail,
        initialOfficers: createBusinessEntityDto.initialOfficers,
      }),
      this.subscriptionService.deductCreditOnUsingFeature(Feature.BusinessEntity, createBusinessEntityDto.userId)
    ]);

    return businessEntity
  }

  findAll(getBusinessEntitiesDto: GetBusinessEntitiesDto) {
    const params = { isActive: true };
    if (getBusinessEntitiesDto.userId) {
      params["userId"] = getBusinessEntitiesDto.userId;
    }
    return this.businessEnitiesRepository.find({
      where: params,
      take: getBusinessEntitiesDto.limit,
      skip: getBusinessEntitiesDto.page * getBusinessEntitiesDto.limit,
      order: { createdAt: "DESC" },
    });
  }

  findOne(id: string) {
    return this.businessEnitiesRepository.findOneBy({
      id: id,
    });
  }

  async update(id: string, updateBusinessEntityDto: UpdateBusinessEntityDto) {
    await this.businessEnitiesRepository.update(
      {
        id: id,
      },
      {
        status: updateBusinessEntityDto.status,
      },
    );

    return {
      message: "Business Entity updated successfully",
    };
  }

  async remove(id: string) {
    await this.businessEnitiesRepository.update(id, { isActive: false });
  }
}
