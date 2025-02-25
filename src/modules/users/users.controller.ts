import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../shared/providers/jwt.auth.guard";
import { UpdateUserDto } from "./dto/update-user.dto";
import { GetUsersDto } from "./dto/get-users.dto";
import { UpdateUserPasswordDto } from "./dto/update-user-password.dto";
import { GetSignedUrlDto } from "./dto/get-signed-url.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { UserType } from "./entities/user.entity";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";
import { GetReportsDto } from "./dto/get-reports.dto";
import { GetStripeCheckoutUrlDto } from "./dto/get-stripe-checkout-url.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { ContractsService } from "../contracts/contracts.service";
import { UpdateUserEmailDto } from "./dto/update-user-email.dto";
import { DeleteUserDto } from "./dto/delete-user.dto";
import { GetStripeCustomerPortalUrlDto } from "./dto/get-stripe-customer-portal-url.dto";
import { UpdateSubscriptionDto } from "./dto/update-subscription.dto";
import { SubscriptionService } from "../subscription/subscription.service";

@ApiTags("User Management")
@Controller("users")
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly contractsService: ContractsService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  findAll(@Query() getUsersDto: GetUsersDto, @Request() req) {
    if (req.user.type != UserType.Admin) {
      throw new UnauthorizedException(
        `You don't have permission to perform this operation.`,
      );
    }
    return this.userService.findAll(getUsersDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(":id")
  findOne(@Param("id") id: string, @Request() req) {
    if (req.user.type !== UserType.Admin && req.user.id !== id) {
      throw new UnauthorizedException(
        "You don't have permission to perform this operation.",
      );
    }
    return this.userService.findOne(id, true);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    if (req.user.type !== UserType.Admin && req.user.id !== id) {
      throw new UnauthorizedException(
        "You don't have permission to perform this operation.",
      );
    }
    return this.userService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(":id/password")
  updatePassword(
    @Param("id") id: string,
    @Body() updateUserDto: UpdateUserPasswordDto,
    @Request() req,
  ) {
    if (req.user.type !== UserType.Admin && req.user.id !== id) {
      throw new UnauthorizedException(
        "You don't have permission to perform this operation.",
      );
    }
    return this.userService.updatePassword(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(":id/images/signed-url")
  getImageSignedUrl(
    @Param("id") id: string,
    @Query() getSignedUrlDto: GetSignedUrlDto,
  ): {
    uploadUrl: string;
    accessUrl: string;
  } {
    return this.userService.getSignedUrl(id, getSignedUrlDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(":id/email/verify/initiate")
  initiateEmailVerification(@Param("id") id: string) {
    return this.userService.initiateEmailVerification(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(":id/email/verify")
  verifyEmail(@Param("id") id: string, @Body() verifyEmailDto: VerifyEmailDto) {
    return this.userService.verifyEmail(id, verifyEmailDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(":id/email/update/initiate")
  initiateEmailUpdation(
    @Param("id") id: string,
    @Body() updateEmailDto: UpdateUserEmailDto,
  ) {
    return this.userService.initiateEmailUpdation(id, updateEmailDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(":id/email/update")
  updateEmail(@Param("id") id: string, @Body() verifyEmailDto: VerifyEmailDto) {
    return this.userService.updateEmail(id, verifyEmailDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(":id")
  remove(
    @Param("id") id: string,
    @Request() req,
    @Body() deleteUserDto: DeleteUserDto,
  ) {
    if (req.user.type !== UserType.Admin && req.user.id !== id) {
      throw new UnauthorizedException(
        "You don't have permission to perform this operation.",
      );
    }
    return this.userService.remove(id, deleteUserDto, req.user.type);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Request() req,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ) {
    if (req.user.type !== UserType.Admin && req.user.id !== id) {
      throw new UnauthorizedException(
        "You are not authorized to perform this action.",
      );
    }
    return this.userService.updateStatus(id, updateUserStatusDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(":id/active")
  markUserActive(@Param("id") id: string) {
    return this.userService.markUserActive(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(":id/active-status")
  fetchUserActiveStatus(@Param("id") id: string) {
    return this.userService.fetchUserActiveStatus(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(":id/reports")
  fetchReports(
    @Param("id") id: string,
    @Request() req,
    @Query() getReportsDto: GetReportsDto,
  ) {
    if (req.user.type != UserType.Admin) {
      throw new UnauthorizedException(
        `You don't have permission to perform this operation.`,
      );
    }
    return this.userService.fetchReports(id, getReportsDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(":id/dashboard")
  fetchDashboard(@Param("id") id: string, @Request() req) {
    return this.userService.fetchDashboard(id, req.user?.type);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(":id/contracts")
  @UseInterceptors(FileInterceptor("file"))
  async provideResponse(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.contractsService.uploadContract(file, id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(":id/stripe-connect-url")
  fetchStripeConnectionUrl(
    @Param("id") id: string,
    @Request() req,
    @Query() getStripeCheckoutUrlDto: GetStripeCheckoutUrlDto,
  ) {
    if (req.user.type !== UserType.Admin && req.user.id !== id) {
      throw new UnauthorizedException(
        "You don't have permission to perform this operation.",
      );
    }
    return this.subscriptionService.fetchStripeCheckoutUrl(
      id,
      req.user,
      getStripeCheckoutUrlDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(":id/stripe-customer-portal-url")
  fetchStripeCustomerPortalUrl(
    @Param("id") id: string,
    @Request() req,
    @Query() getStripeCustomerPortalUrlDto: GetStripeCustomerPortalUrlDto,
  ) {
    if (req.user.type !== UserType.Admin && req.user.id !== id) {
      throw new UnauthorizedException(
        "You don't have permission to perform this operation.",
      );
    }
    return this.subscriptionService.fetchStripeCustomerPortalUrl(
      id,
      getStripeCustomerPortalUrlDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(":id/subscriptions")
  fetchSubscriptions(@Param("id") id: string, @Request() req) {
    if (req.user.type !== UserType.Admin && req.user.id !== id) {
      throw new UnauthorizedException(
        "You don't have permission to perform this operation.",
      );
    }
    return this.subscriptionService.fetchSubscriptions(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(":id/subscriptions/:subscriptionId")
  cancelSubscription(
    @Param("id") id: string,
    @Param("subscriptionId") subscriptionId: string,
    @Request() req,
  ) {
    if (req.user.type !== UserType.Admin && req.user.id !== id) {
      throw new UnauthorizedException(
        "You don't have permission to perform this operation.",
      );
    }
    return this.subscriptionService.cancelSubscription(subscriptionId, id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(":id/subscriptions/:subscriptionId")
  updateSubscription(
    @Param("id") id: string,
    @Param("subscriptionId") subscriptionId: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
    @Request() req,
  ) {
    if (req.user.type !== UserType.Admin && req.user.id !== id) {
      throw new UnauthorizedException(
        "You don't have permission to perform this operation.",
      );
    }
    return this.subscriptionService.updateSubscription(
      subscriptionId,
      id,
      updateSubscriptionDto,
    );
  }
}
