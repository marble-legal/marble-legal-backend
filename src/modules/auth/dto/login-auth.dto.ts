import { IsEmail } from "class-validator";
import { UserType } from "../../../modules/users/entities/user.entity";

export class LoginAuthDto {
  @IsEmail()
  email: string;
  password?: string;
  userType: UserType;
  googleId?: string;
  googleIdToken?: string;
  name?: string;
}
