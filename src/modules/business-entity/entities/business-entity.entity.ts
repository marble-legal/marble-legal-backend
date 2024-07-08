import { Base } from "src/shared/entities/base.entity";
import { Column, Entity, Index } from "typeorm";

export enum BusinessEntityStatus {
  Completed = 1,
  InProgress = 0,
  Refused = -1,
}

export const businessEntityStatusMapper = {
  [BusinessEntityStatus.Completed]: "Completed",
  [BusinessEntityStatus.InProgress]: "In progress",
  [BusinessEntityStatus.Refused]: "Refused",
};

class BusinessEntityClient {
  name: string;
  address: string;
  phone: string;
  email: string;
}

class BusinessEntityOwner {
  name: string;
  address: string;
  interest: string;
  initialContribution: string;
}

@Entity()
export class BusinessEntity extends Base {
  @Index()
  @Column()
  userId: string;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column()
  state: string;

  @Column({ default: BusinessEntityStatus.InProgress })
  status: BusinessEntityStatus;

  @Column("simple-json", { default: [] })
  clients: BusinessEntityClient[];

  @Column("simple-json", { default: [] })
  owners: BusinessEntityOwner[];

  @Column({ nullable: true })
  isInvestorsUsCitizen?: boolean;

  @Column({ nullable: true })
  isRestrictionsOnTransfer?: boolean;

  @Column({ nullable: true })
  restrictionsOnTransferDetail?: string;

  @Column({ nullable: true })
  isProfitsLossSharedEqually?: boolean;

  @Column({ nullable: true })
  type?: string;

  @Column("simple-array", { default: [] })
  issues?: string[];

  @Column({ nullable: true })
  purpose?: string;

  @Column({ nullable: true })
  agent?: string;

  @Column({ nullable: true })
  useTrademark?: string;

  @Column({ nullable: true })
  specialLicenses?: string;

  @Column({ nullable: true })
  bankAccountType?: string;

  @Column({ nullable: true })
  loanDetail?: string;

  @Column({ nullable: true })
  accountantDetail?: string;

  @Column({ nullable: true })
  managementDetail?: string;

  @Column({ nullable: true })
  signingResposibility?: string;

  @Column({ nullable: true })
  powersDetail?: string;

  @Column({ nullable: true })
  initialOfficers?: string;
}
