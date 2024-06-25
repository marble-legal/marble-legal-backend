import { Transform } from "class-transformer";
import { BusinessEntityStatus } from "../entities/business-entity.entity";

export class GetBusinessEntitiesDto {
  userId?: string;
  page?: number = 0;
  limit?: number = 10;
  
  @Transform(({ value }) => value.trim())
  searchKeyword?: string;

  @Transform(({ value }) => String(value) === "true")
  showActive?: boolean = true;

  @Transform(({ value }) => value.split(",").map((tier) => tier.trim()))
  status?: BusinessEntityStatus[];

  startDate?: Date;
  endDate?: Date;
}
