import { BusinessEntityStatus } from "../entities/business-entity.entity";

export class UpdateBusinessEntityDto {
  status: BusinessEntityStatus = BusinessEntityStatus.InProgress;
}
