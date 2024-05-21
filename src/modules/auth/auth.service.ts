import { UsersService } from "../users/users.service";
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { UserType } from "../users/entities/user.entity";
import { JwtService } from "@nestjs/jwt";
import { FieldType } from "./dto/validate-field-auth.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { EmailService } from "../../shared/providers/email.service";
import { LoginAuthDto } from "./dto/login-auth.dto";
import { RegisterAuthDto } from "./dto/register-auth.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async login(loginDto: LoginAuthDto): Promise<any> {
    try {
      const user = await this.validateUser(
        loginDto.email,
        loginDto.password,
        loginDto.googleId,
      );
      if (!user || user.userType !== loginDto.userType) {
        throw new UnauthorizedException();
      }
      const payload = { userId: user.id, type: user.userType };
      const accessToken = this.jwtService.sign(payload, { expiresIn: "1d" });

      return {
        id: user.id,
        email: user.email,
        accessToken: accessToken,
        loginState: user.loginState,
      };
    } catch (err) {
      throw err;
    }
  }

  async register(registerAuthDto: RegisterAuthDto) {
    try {
      await this.userService.validateEmail(registerAuthDto.email);
      let hashedPwd = undefined;
      if (registerAuthDto.password) {
        this.userService.validatePassword(registerAuthDto.password);

        hashedPwd = await this.userService.createHashedPassword(
          registerAuthDto.password,
        );
      }
      const user = await this.userService.createUser(
        {
          fullName: registerAuthDto.fullName,
          email: registerAuthDto.email.toLowerCase(),
          password: hashedPwd,
          googleId: registerAuthDto.googleId,
        },
        UserType.User,
      );

      const payload = { userId: user.id, type: UserType.User };
      const accessToken = this.jwtService.sign(payload, { expiresIn: "1d" });
      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        googleId: user.googleId,
        accessToken: accessToken,
      };
    } catch (err) {
      throw err;
    }
  }

  async registerAdmin(registerAuthDto: RegisterAuthDto) {
    try {
      await this.userService.validateEmail(registerAuthDto.email),
        this.userService.validatePassword(registerAuthDto.password);

      const hashedPwd = await this.userService.createHashedPassword(
        registerAuthDto.password,
      );
      const user = await this.userService.createUser(
        {
          fullName: registerAuthDto.fullName,
          email: registerAuthDto.email.toLowerCase(),
          password: hashedPwd,
        },
        UserType.Admin,
      );

      const payload = { userId: user.id, type: UserType.Admin };
      const accessToken = this.jwtService.sign(payload, { expiresIn: "1d" });
      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        accessToken: accessToken,
      };
    } catch (err) {
      throw err;
    }
  }

  async validateUser(
    email: string,
    password?: string,
    googleId?: string,
  ): Promise<any> {
    const user = await this.userService.findByEmail(email.toLowerCase());
    if (!user) {
      return undefined;
    }
    if (googleId && user.googleId === googleId) {
      return user;
    }
    return await this.userService.checkPassword(user, password);
  }

  async validateField(fieldType: FieldType, value: string): Promise<any> {
    try {
      switch (fieldType) {
        case FieldType.Password: {
          this.userService.validatePassword(value);

          return {
            message: "Password looks good!",
          };
        }

        case FieldType.Email: {
          await this.userService.validateEmail(value);

          return {
            message: "Email looks good!",
          };
        }
      }
    } catch (err) {
      throw err;
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    try {
      const user = await this.userService.findByEmail(forgotPasswordDto.email);
      if (!user) {
        throw new NotFoundException(
          `User with ${forgotPasswordDto.email} does not exist`,
        );
      }
      const payload = { userId: user.id, type: "resetPassword" };
      const resetPasswordToken = this.jwtService.sign(payload, {
        expiresIn: "10m",
      });

      const subject = "Reset your password";
      const content = `Please follow ${forgotPasswordDto.resetPasswordUrl}?rt=${resetPasswordToken} to reset your password.`;
      await this.emailService.sendEmail({
        toEmailIds: [forgotPasswordDto.email],
        isHtml: true,
        subject: subject,
        body: content,
      });
    } catch (exception) {
      throw exception;
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    try {
      this.jwtService.verify(resetPasswordDto.resetPasswordToken);
      const payload: [string: any] = this.jwtService.decode(
        resetPasswordDto.resetPasswordToken,
      ) as [string: any];
      const userId = payload["userId"];
      await this.userService.updateUserPassword(
        userId,
        resetPasswordDto.password,
      );
    } catch (exception) {
      throw exception;
    }
  }
}
