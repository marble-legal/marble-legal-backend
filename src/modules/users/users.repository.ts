import { Injectable } from "@nestjs/common";
import { Connection } from "typeorm";
import { GetUsersDto } from "./dto/get-users.dto";
import { GetReportsDto, ReportDuration } from "./dto/get-reports.dto";
import { UserType } from "./entities/user.entity";

@Injectable()
export class UserDataRepository {
  constructor(private readonly dbConnection: Connection) {}

  async findUsers(getUsersDto: GetUsersDto) {
    const searchQuery =
      getUsersDto.searchKeyword !== undefined &&
      getUsersDto.searchKeyword !== ""
        ? `and ("fullName" ILIKE ANY ('{${getUsersDto.searchKeyword
            .split(" ")
            .map((keyword) => '"%' + keyword + '%"')
            .join(", ")}}') or "email" ILIKE ANY ('{${getUsersDto.searchKeyword
            .split(" ")
            .map((keyword) => '"%' + keyword + '%"')
            .join(", ")}}'))`
        : "";

    const filters = [];

    if (
      getUsersDto.startDate !== undefined &&
      getUsersDto.endDate !== undefined
    ) {
      filters.push(
        `DATE("createdAt") >= DATE('${getUsersDto.startDate}') and DATE("createdAt") <= DATE('${getUsersDto.endDate}')`,
      );
    } else if (getUsersDto.startDate !== undefined) {
      filters.push(
        `DATE("createdAt") >= DATE('${getUsersDto.startDate}')`,
      );
    } else if (getUsersDto.endDate !== undefined) {
      filters.push(
        `DATE("createdAt") <= DATE('${getUsersDto.endDate}')`,
      );
    }

    if (getUsersDto.tiers !== undefined) {
      const tier = getUsersDto.tiers.map((tier) => `'${tier}'`).join(",");
      filters.push(`"tier" = ANY(ARRAY[${[tier]}])`);
    }

    const filtersQuery =
      filters.length > 0 ? `and ${filters.join(" and ")}` : "";

    const results: any[] = await this.dbConnection.query(
      `
      select * from public."user"
      where "isActive" = ${getUsersDto.showActive} and "userType" = '${
        getUsersDto.type
      }' ${searchQuery} ${filtersQuery}
      order by "createdAt" desc
      LIMIT ${getUsersDto.limit}
      OFFSET ${getUsersDto.limit * getUsersDto.page}
       `,
    );

    if (results.length === 0) {
      return [];
    }

    return results.map((user) => {
      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        profileImg: user.profileImg,
        joinedOn: user.createdAt,
        tier: user.tier,
        planType: user.planType,
        lastActive: user.lastActive,
      };
    });
  }

  async findUsersReports(getReportsDto: GetReportsDto, type: UserType) {
    let query = "";
    switch (getReportsDto.duration) {
      case ReportDuration.CURRENT_WEEK: {
        query = `
        SELECT COUNT(*) as count, DATE("createdAt") as date from public."user" where DATE_PART('week', "createdAt") = DATE_PART('week', NOW()) and "userType" = '${type}' group by date;
        `;
        break;
      }

      case ReportDuration.CURRENT_MONTH: {
        query = `
        SELECT COUNT(*) as count, DATE("createdAt") as date from public."user" where DATE_PART('month', "createdAt") = DATE_PART('month', NOW()) and "userType" = '${type}' group by date;
        `;
        break;
      }

      case ReportDuration.CURRENT_YEAR: {
        query = `
        SELECT COUNT(*) as count, DATE_PART('month', "createdAt") as month from public."user" where DATE_PART('year', "createdAt") = DATE_PART('year', NOW()) and "userType" = '${type}' group by month;
        `;
        break;
      }

      case ReportDuration.CUSTOM: {
        query = `
        SELECT COUNT(*) as count, DATE("createdAt") as date from public."user" where DATE("createdAt") >= DATE('${getReportsDto.startDate}') and DATE("createdAt") <= DATE('${getReportsDto.endDate}') and "userType" = '${type}' group by date;
        `;
        break;
      }
    }
    const results = await this.dbConnection.query(query);
    return results.map((result) => {
      return {
        ...result,
        count: Number.parseInt(result.count),
      };
    });
  }

  async findRevenueReports(getReportsDto: GetReportsDto) {
    let query = "";
    switch (getReportsDto.duration) {
      case ReportDuration.CURRENT_WEEK: {
        query = `
        SELECT SUM(amount) as count, DATE("createdAt") as date from public."user_payment" where DATE_PART('week', "createdAt") = DATE_PART('week', NOW()) group by date;
        `;
        break;
      }

      case ReportDuration.CURRENT_MONTH: {
        query = `
        SELECT SUM(amount) as count, DATE("createdAt") as date from public."user_payment" where DATE_PART('month', "createdAt") = DATE_PART('month', NOW()) group by date;
        `;
        break;
      }

      case ReportDuration.CURRENT_YEAR: {
        query = `
        SELECT SUM(amount) as count, DATE_PART('month', "createdAt") as month from public."user_payment" where DATE_PART('year', "createdAt") = DATE_PART('year', NOW()) group by month;
        `;
        break;
      }

      case ReportDuration.CUSTOM: {
        query = `
        SELECT SUM(amount) as count, DATE("createdAt") as date from public."user_payment" where DATE("createdAt") >= DATE('${getReportsDto.startDate}') and DATE("createdAt") <= DATE('${getReportsDto.endDate}') group by date;
        `;
        break;
      }
    }
    const results = await this.dbConnection.query(query);
    return results.map((result) => {
      return {
        ...result,
        count: Number.parseInt(result.count),
      };
    });
  }
}
