export enum ReportsType {
  USERS_COUNT = "USERS_COUNT",
  REVENUE = "REVENUE",
}

export enum ReportDuration {
  CURRENT_WEEK = "CURRENT_WEEK",
  CURRENT_MONTH = "CURRENT_MONTH",
  CURRENT_YEAR = "CURRENT_YEAR",
  CUSTOM = "CUSTOM",
}

export class GetReportsDto {
  type: ReportsType = ReportsType.USERS_COUNT;
  duration: ReportDuration = ReportDuration.CURRENT_WEEK;
  startDate?: Date;
  endDate?: Date;
}
