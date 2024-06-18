import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PlanType, Tier } from "../entities/user.entity";

export class GetStripeCheckoutUrlDto {
  @ApiProperty({
    description: "The redirect url.",
    example: "http://localhost:3000",
  })
  @IsString()
  readonly redirectUrl!: string;

  @ApiProperty({
    description: "The Tier",
    enum: Tier,
  })
  @IsEnum(Tier)
  readonly tier!: Tier;

  @ApiProperty({
    description: "The Plan Type",
    enum: PlanType,
  })
  @IsEnum(PlanType)
  readonly planType: PlanType = PlanType.MONTHLY;

  aiAssistant?: number = 0;
  contractAnalysis?: number = 0;
  contractDrafting?: number = 0;
  businessEntity?: number = 0;
  attorneyReview?: number = 0;
}
