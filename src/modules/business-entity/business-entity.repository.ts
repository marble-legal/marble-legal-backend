import { Injectable } from "@nestjs/common";
import { Connection } from "typeorm";
import { GetBusinessEntitiesDto } from "./dto/get-business-entities.dto";

@Injectable()
export class BusinessEntityDataRepository {
  constructor(private readonly dbConnection: Connection) {}

  async findEntities(getBusinessEntitiesDto: GetBusinessEntitiesDto) {
    const searchQuery =
      getBusinessEntitiesDto.searchKeyword !== undefined &&
      getBusinessEntitiesDto.searchKeyword !== ""
        ? `and (be."name" ILIKE ANY ('{${getBusinessEntitiesDto.searchKeyword
            .split(" ")
            .map((keyword) => '"%' + keyword + '%"')
            .join(", ")}}'))`
        : "";

    const userIdQuery =
      getBusinessEntitiesDto.userId !== undefined
        ? `and be."userId" = '${getBusinessEntitiesDto.userId}'`
        : "";

    let dateQuery = "";

    if (
      getBusinessEntitiesDto.startDate !== undefined &&
      getBusinessEntitiesDto.endDate !== undefined
    ) {
      dateQuery = `and DATE(be."createdAt") >= DATE('${getBusinessEntitiesDto.startDate}') and DATE(be."createdAt") <= DATE('${getBusinessEntitiesDto.endDate}')`;
    } else if (getBusinessEntitiesDto.startDate !== undefined) {
      dateQuery = `and DATE(be."createdAt") >= DATE('${getBusinessEntitiesDto.startDate}')`;
    } else if (getBusinessEntitiesDto.endDate !== undefined) {
      dateQuery = `and DATE(be."createdAt") <= DATE('${getBusinessEntitiesDto.endDate}')`;
    }

    let statusQuery = "";

    if (getBusinessEntitiesDto.status !== undefined) {
      const status = getBusinessEntitiesDto.status
        .map((status) => `${status}`)
        .join(",");
      statusQuery = `and be."status" = ANY(ARRAY[${[status]}])`;
    }

    const query = `
      select be.*,u."fullName" from public."business_entity" be
      left join public."user" u
      on be."userId" = u.id::text
      where be."isActive" = ${getBusinessEntitiesDto.showActive} ${searchQuery} ${userIdQuery} ${dateQuery} ${statusQuery}
      order by be."createdAt" desc
      LIMIT ${getBusinessEntitiesDto.limit}
      OFFSET ${getBusinessEntitiesDto.limit * getBusinessEntitiesDto.page}
    `;
    const results: any[] = await this.dbConnection.query(query);

    if (results.length === 0) {
      return [];
    }

    return results.map((entity) => {
      return {
        ...entity,
        clients: entity.clients ? JSON.parse(entity.clients) : [],
        owners: entity.owners ? JSON.parse(entity.owners) : [],
        issues: entity.issues
          ? typeof entity.issues === "object"
            ? JSON.parse(entity.issues)
            : [entity.issues]
          : [],
        submittedBy: entity.fullName,
      };
    });
  }
}
