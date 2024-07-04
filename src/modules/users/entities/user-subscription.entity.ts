import { Base } from "../../../shared/entities/base.entity";
import { Column, Entity } from "typeorm";
import { PlanType, Tier } from "./user.entity";

export enum UserSubscriptionStatus {
  Initiated = "Initiated",
  Paid = "Paid",
  Cancelled = "Cancelled",
}

@Entity()
export class UserSubscription extends Base {
  @Column()
  userId: string;

  @Column({ nullable: true })
  subscriptionId?: string;

  @Column({ nullable: true })
  subscriptionItemId?: string;

  @Column({ nullable: true })
  checkoutSessionId?: string;

  @Column()
  status: UserSubscriptionStatus;

  @Column()
  customerEmail: string;

  @Column({ nullable: true })
  customerId?: string;

  @Column()
  tier: Tier;

  @Column()
  planType: PlanType;

  @Column({ nullable: true, type: "decimal", precision: 7, scale: 2 })
  amount?: number;

  @Column({ nullable: true })
  currency?: string;

  @Column({ nullable: true })
  cancelledAt?: Date;
}
