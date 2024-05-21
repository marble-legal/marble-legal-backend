import { Base } from "../../../shared/entities/base.entity";
import { Column, Entity } from "typeorm";

export enum UserType {
  User = "U",
  Admin = "A",
}

export enum LoginState {
  None = "None",
  ChangePassword = "ChangePassword",
}

export enum PlanType {
  MONTHLY = "M",
}

export enum Tier {
  STANDARD = "ST",
  PRO = "PR",
  MAX = "MX",
  ULTRA = "UL",
}

@Entity()
export class User extends Base {
  @Column()
  fullName: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ nullable: true })
  googleId?: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: UserType.User })
  userType: UserType;

  @Column({ nullable: true })
  profileImg?: string;

  @Column({ nullable: true })
  lastActive?: Date;

  @Column({ nullable: true })
  planType?: PlanType;

  @Column({ nullable: true })
  tier?: Tier;

  @Column({ nullable: true })
  otp?: string;

  @Column({ nullable: true })
  otpDate?: Date;

  accessToken: string;

  @Column({ default: LoginState.None })
  loginState?: LoginState;
}
