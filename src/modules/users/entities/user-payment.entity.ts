import { Base } from "../../../shared/entities/base.entity";
import { Column, Entity } from "typeorm";

@Entity()
export class UserPayment extends Base {
  @Column()
  userId: string;

  @Column()
  customerEmail: string;

  @Column({ nullable: true })
  customerId?: string;

  @Column({ type: "decimal", precision: 5, scale: 2 })
  amount: number;

  @Column()
  currency: string;

  @Column({ nullable: true })
  subscriptionId?: string;
}
