import { Injectable } from "@nestjs/common";
import { CreateBusinessEntityDto } from "./dto/create-business-entity.dto";
import { UpdateBusinessEntityDto } from "./dto/update-business-entity.dto";
import { BusinessEntity } from "./entities/business-entity.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class BusinessEntityService {
  constructor(
    @InjectRepository(BusinessEntity)
    private businessEnitiesRepository: Repository<BusinessEntity>,
  ) {}
  create(createBusinessEntityDto: CreateBusinessEntityDto) {
    return this.businessEnitiesRepository.save({
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
    });
  }

  findAll(userId: string) {
    return this.businessEnitiesRepository.findBy({
      userId: userId,
      isActive: true,
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
