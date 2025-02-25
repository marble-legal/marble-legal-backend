import { Strategy } from "passport-local";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../../modules/auth/auth.service";
import { User } from "../../modules/users/entities/user.entity";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: "email" });
  }

  async validate(
    username: string,
    password: string,
  ): Promise<User | undefined> {
    const user = await this.authService.validateUser(username, password);

    if (!user) {
      throw new UnauthorizedException(
        "The email address or password is incorrect.",
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        "Your account has been blocked. Please contact support for assistance.",
      );
    }

    return user;
  }
}
