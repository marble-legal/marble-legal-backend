import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateBusinessEntityDto } from "./dto/create-business-entity.dto";
import { UpdateBusinessEntityDto } from "./dto/update-business-entity.dto";
import {
  BusinessEntity,
  businessEntityStatusMapper,
} from "./entities/business-entity.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Not, Repository } from "typeorm";
import { SubscriptionService } from "../subscription/subscription.service";
import { Feature } from "../users/entities/user-custom-plan.entity";
import { GetBusinessEntitiesDto } from "./dto/get-business-entities.dto";
import { BusinessEntityDataRepository } from "./business-entity.repository";
import { EmailService } from "src/shared/providers/email.service";
import { User } from "../users/entities/user.entity";

@Injectable()
export class BusinessEntityService {
  constructor(
    @InjectRepository(BusinessEntity)
    private businessEnitiesRepository: Repository<BusinessEntity>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly subscriptionService: SubscriptionService,
    private readonly businessEntityDataRepository: BusinessEntityDataRepository,
    private readonly emailService: EmailService,
  ) {}

  async create(createBusinessEntityDto: CreateBusinessEntityDto) {
    const canUseFeature = await this.subscriptionService.canUseFeature(
      Feature.BusinessEntity,
      createBusinessEntityDto.userId,
    );

    if (!canUseFeature) {
      throw new ForbiddenException(
        `You don't have credit balance to use this feature.`,
      );
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
      this.subscriptionService.deductCreditOnUsingFeature(
        Feature.BusinessEntity,
        createBusinessEntityDto.userId,
      ),
    ]);

    return businessEntity;
  }

  findAll(getBusinessEntitiesDto: GetBusinessEntitiesDto) {
    return this.businessEntityDataRepository.findEntities(
      getBusinessEntitiesDto,
    );
  }

  findOne(id: string) {
    return this.businessEnitiesRepository.findOneBy({
      id: id,
    });
  }

  async update(id: string, updateBusinessEntityDto: UpdateBusinessEntityDto) {
    const businessEntity = await this.businessEnitiesRepository.findOneBy({
      id: id,
    });

    if (!businessEntity) {
      throw new NotFoundException("Business Entity not found");
    }

    const [user] = await Promise.all([
      this.usersRepository.findOneBy({
        id: businessEntity.userId,
      }),
      this.businessEnitiesRepository.update(
        {
          id: id,
        },
        {
          status: updateBusinessEntityDto.status,
        },
      ),
    ]);

    if (user.isEmailNotificationOn) {
      await this.emailService.sendEmail({
        toEmailIds: [user.email],
        subject: "Updates on your Business Entity",
        body: `The status of your business Entity titled: ${businessEntity.name} has been updated to ${businessEntityStatusMapper[updateBusinessEntityDto.status]}`,
      });
    }

    return {
      message: "Business Entity updated successfully",
    };
  }

  async remove(id: string) {
    await this.businessEnitiesRepository.update(id, { isActive: false });
  }
}
