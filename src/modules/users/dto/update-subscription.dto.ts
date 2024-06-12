import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { PlanType, Tier } from "../entities/user.entity";

export class UpdateSubscriptionDto {
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
}
