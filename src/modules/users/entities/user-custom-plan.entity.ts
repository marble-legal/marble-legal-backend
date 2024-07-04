import { Base } from "../../../shared/entities/base.entity";
import { Column, Entity } from "typeorm";

export enum UserCustomPlanStatus {
  Initiated = "Initiated",
  Paid = "Paid",
  Cancelled = "Cancelled",
}

export enum Feature {
  AIAssistance = "AI",
  ContractAnalysis = "CA",
  ContractDrafting = "CD",
  BusinessEntity = "BE",
  AttorneyReview = "AR",
}

@Entity()
export class UserCustomPlan extends Base {
  @Column()
  userId: string;

  @Column({ nullable: true })
  checkoutSessionId?: string;

  @Column()
  status: UserCustomPlanStatus;

  @Column()
  customerEmail: string;

  @Column({ nullable: true })
  customerId?: string;

  @Column({ nullable: true, type: "decimal", precision: 7, scale: 2 })
  amount?: number;

  @Column({ nullable: true })
  currency?: string;

  @Column({ nullable: true })
  cancelledAt?: Date;

  @Column("simple-json", { nullable: true })
  assignedCredit?: any;

  @Column("simple-json", { nullable: true })
  currentCredit?: any;
}
