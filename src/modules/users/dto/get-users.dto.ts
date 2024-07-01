import { Transform } from "class-transformer";
import { Tier, UserType } from "../entities/user.entity";

export class GetUsersDto {
  page?: number = 0;
  limit?: number = 10;
  type: UserType = UserType.User;

  @Transform(({ value }) => value.trim())
  searchKeyword?: string;

  @Transform(({ value }) => String(value) === "true")
  showActive?: boolean = true;

  startDate?: Date;
  endDate?: Date;

  @Transform(({ value }) => value.split(",").map((tier) => tier.trim()))
  tiers?: Tier[];
}
