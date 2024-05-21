import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { User, UserType } from "../users/entities/user.entity";
import { LoginAuthDto } from "./dto/login-auth.dto";
import { ValidateFieldAuthDto } from "./dto/validate-field-auth.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { JwtAuthGuard } from "../../shared/providers/jwt.auth.guard";
import { RegisterAuthDto } from "./dto/register-auth.dto";

@ApiTags("Auth Management")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("/login")
  login(@Body() loginAuthDto: LoginAuthDto): Promise<User> {
    return this.authService.login(loginAuthDto);
  }

  @Post("/register")
  register(@Body() registerAuthDto: RegisterAuthDto) {
    return this.authService.register(registerAuthDto);
  }

  @Post("/validate-field")
  validateField(@Body() validateFieldAuthDto: ValidateFieldAuthDto) {
    return this.authService.validateField(
      validateFieldAuthDto.fieldType,
      validateFieldAuthDto.value,
    );
  }

  @Post("/forgot-password")
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post("/reset-password")
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("/admin/register")
  registerAdmin(@Body() registerAuthDto: RegisterAuthDto, @Request() req) {
    if (req.user.type != UserType.Admin) {
      throw new UnauthorizedException(
        `You don't have permission to perform this operation.`,
      );
    }
    return this.authService.registerAdmin(registerAuthDto);
  }
}
