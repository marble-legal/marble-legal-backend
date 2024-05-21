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
        ? `and ("firstName" LIKE '%${getUsersDto.searchKeyword}%' or "lastName" LIKE '%${getUsersDto.searchKeyword}%' or "email" LIKE '%${getUsersDto.searchKeyword}%')`
        : "";

    const results: any[] = await this.dbConnection.query(
      `
      select * from public."user"
      where "isActive" = ${getUsersDto.showActive} and "userType" = '${
        getUsersDto.type
      }' ${searchQuery} 
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
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImg: user.profileImg,
        joinedOn: user.createdAt,
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
}
