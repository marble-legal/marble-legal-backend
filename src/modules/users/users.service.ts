import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  LoginState,
  PlanType,
  Tier,
  User,
  UserType,
} from "./entities/user.entity";
import * as dotenv from "dotenv";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UpdateUserDto } from "./dto/update-user.dto";
import { GetUsersDto } from "./dto/get-users.dto";
import { UpdateUserPasswordDto } from "./dto/update-user-password.dto";
import { compare, hash } from "bcrypt";
import {
  GetSignedUrlDto,
  GetSignedUrlUploadType,
} from "./dto/get-signed-url.dto";
import { v1 as uuidv1 } from "uuid";
import * as mimeTypes from "mime-types";
import { EmailService } from "../../shared/providers/email.service";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { UserDataRepository } from "./users.repository";
import {
  GetReportsDto,
  ReportDuration,
  ReportsType,
} from "./dto/get-reports.dto";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";
import { welcomeProviderTemplate } from "../../shared/welome-provider.template";
import { GetStripeCheckoutUrlDto } from "./dto/get-stripe-checkout-url.dto";
import { StripeService } from "src/shared/providers/stripe.service";
import {
  UserSubscription,
  UserSubscriptionStatus,
} from "./entities/user-subscription.entity";
import { ContractsService } from "../contracts/contracts.service";
import { UpdateUserEmailDto } from "./dto/update-user-email.dto";

const otpGenerator = require("otp-generator");

dotenv.config();

const AWS = require("aws-sdk");
AWS.config.credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};
AWS.config.update({ region: process.env.AWS_REGION });

const s3 = new AWS.S3();

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserSubscription)
    private userSubscriptionsRepository: Repository<UserSubscription>,
    private readonly emailService: EmailService,
    private readonly userDataRepository: UserDataRepository,
    private readonly stripeService: StripeService,
  ) {}

  async createUser(
    params: {
      fullName: string;
      email: string;
      password: string;
      googleId?: string;
    },
    type: UserType = UserType.Admin,
  ): Promise<User> {
    const data = {
      fullName: params.fullName,
      email: params.email.toLowerCase(),
      password: params.password,
      userType: type,
      googleId: params.googleId,
    };
    return await this.usersRepository.save(data);
  }

  async findAll(getUsersDto: GetUsersDto) {
    return await this.userDataRepository.findUsers(getUsersDto);
  }

  async findOne(id: string) {
    try {
      const user = await this.usersRepository.findOneBy({
        id: id,
        isActive: true,
      });
      if (!user) {
        throw new NotFoundException(`User with id: ${id} not found`);
      }
      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        profileImg: user.profileImg,
        type: user.userType,
        isEmailNotificationOn: user.isEmailNotificationOn,
      };
    } catch (err: any) {
      throw err;
    }
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOneBy({
      email: email.toLowerCase(),
      isActive: true,
    });
    return user;
  }

  async update(userId: string, requestParams: UpdateUserDto) {
    const user = await this.usersRepository.findOneBy({
      id: userId,
    });

    if (!user) {
      throw new NotFoundException("User does not exist.");
    }

    const params: any = {};
    if (requestParams.fullName) {
      params["fullName"] = requestParams.fullName;
    }
    if (requestParams.profileImg !== undefined) {
      params["profileImg"] = requestParams.profileImg;
    }

    if (requestParams.isEmailNotificationOn !== undefined) {
      params["isEmailNotificationOn"] = requestParams.isEmailNotificationOn;
    }

    await this.usersRepository.update(
      {
        id: userId,
      },
      params,
    );

    return {
      message: "User profile has been updated.",
    };
  }

  async updatePassword(userId: string, requestParams: UpdateUserPasswordDto) {
    const user = await this.usersRepository.findOneBy({
      id: userId,
    });
    const userObj = await this.checkPassword(user, requestParams.oldPassword);
    if (!userObj) {
      throw new BadRequestException(`Old password is not matching`);
    }

    if (requestParams.newPassword === requestParams.oldPassword) {
      throw new BadRequestException(
        `New password can't be same as old password.`,
      );
    }

    this.validatePassword(requestParams.newPassword);

    await this.updateUserPassword(userId, requestParams.newPassword);

    return {
      message: "Password updated successfully",
    };
  }

  async updateUserPassword(userId: string, password: string) {
    const hashedPassword = await hash(password, 10);
    await this.usersRepository.update(
      {
        id: userId,
      },
      {
        password: hashedPassword,
        loginState: LoginState.None,
      },
    );
  }

  validatePassword(password: string) {
    if (password?.length < 8) {
      throw new BadRequestException(
        "Password must be at least [8] characters long.",
      );
    }

    if (password.search(/[a-z]/i) < 0 || password.search(/[A-Z]/i) < 0) {
      throw new BadRequestException("Password must contain at least 1 letter.");
    }

    if (password.search(/[0-9]/) < 0) {
      throw new BadRequestException("Password must contain at least 1 number.");
    }

    if (password.search(/[!@#\$%\^&\*_?]/) < 0) {
      throw new BadRequestException(
        "Password must contain at least 1 special character.",
      );
    }
  }

  async validateEmail(email: string) {
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException(
        "Email is already in use, please choose another or Login.",
      );
    }

    if (!email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new BadRequestException("Email must be valid.");
    }

    if (!email.match(/^[0-9a-zA-Z@._+]+$/)) {
      throw new BadRequestException(
        "Email may not contain special characters.",
      );
    }
  }

  async createHashedPassword(password) {
    return await hash(password, 10);
  }

  async checkPassword(user: User, password: string) {
    if (user && user.password && password) {
      const isPasswordMatching = await compare(password, user.password);
      if (isPasswordMatching) {
        return user;
      }
    }

    return null;
  }

  getSignedUrl(
    userId: string,
    getSignedUrlDto: GetSignedUrlDto,
  ): {
    uploadUrl: string;
    accessUrl: string;
  } {
    try {
      const path = {
        [GetSignedUrlUploadType.USER_PROFILE]: "images",
      };

      const params: any = {
        Bucket: process.env.ASSETS_BUCKET_NAME,
        Key: `app/users/${userId}/${
          path[getSignedUrlDto.uploadType]
        }/${getSignedUrlDto.fileName ?? uuidv1()}.${mimeTypes.extension(getSignedUrlDto.mimeType)}`,
        Expires: 3600,
        ACL: "public-read",
        ContentType: getSignedUrlDto.mimeType,
      };

      const url = s3.getSignedUrl("putObject", params);

      return {
        uploadUrl: url,
        accessUrl: url.split("?")[0],
      };
    } catch (err: any) {
      throw err;
    }
  }

  async initiateEmailVerification(id: string) {
    try {
      const user = await this.findOne(id);
      if (user === undefined || user === null) {
        throw new NotFoundException(`No user found with id: ${id}`);
      }
      const otp = otpGenerator.generate(4, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });
      await Promise.all([
        this.emailService.sendEmail({
          toEmailIds: [user.email],
          subject: "Verify email",
          body: `OTP to verify email is: ${otp}`,
        }),
        this.usersRepository.update(
          {
            id: id,
          },
          {
            otp: otp,
            otpDate: new Date(),
          },
        ),
      ]);
    } catch (err: any) {
      throw err;
    }
  }

  async verifyEmail(id: string, verifyEmailDto: VerifyEmailDto) {
    try {
      const user = await this.usersRepository.findOneBy({
        id: id,
        otp: verifyEmailDto.otp,
      });
      if (user === undefined || user === null) {
        throw new BadRequestException(
          "Wrong OTP entered, Please enter the correct OTP.",
        );
      }
      await this.usersRepository.update(
        {
          id: id,
        },
        {
          isEmailVerified: true,
        },
      );
    } catch (err: any) {
      throw err;
    }
  }

  async initiateEmailUpdation(id: string, updateEmailDto: UpdateUserEmailDto) {
    try {
      const user = await this.findOne(id);
      if (user === undefined || user === null) {
        throw new NotFoundException(`No user found with id: ${id}`);
      }
      await this.validateEmail(updateEmailDto.email);

      const otp = otpGenerator.generate(4, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });
      await Promise.all([
        this.emailService.sendEmail({
          toEmailIds: [user.email],
          subject: "Verify email",
          body: `OTP to verify email is: ${otp}`,
        }),
        this.usersRepository.update(
          {
            id: id,
          },
          {
            otp: otp,
            otpDate: new Date(),
            updateEmail: updateEmailDto.email,
          },
        ),
      ]);
    } catch (err: any) {
      throw err;
    }
  }

  async updateEmail(id: string, verifyEmailDto: VerifyEmailDto) {
    try {
      const user = await this.usersRepository.findOneBy({
        id: id,
        otp: verifyEmailDto.otp,
      });
      if (user === undefined || user === null) {
        throw new BadRequestException(
          "Wrong OTP entered, Please enter the correct OTP.",
        );
      }
      await this.usersRepository.update(
        {
          id: id,
        },
        {
          email: user.updateEmail,
          isEmailVerified: true,
        },
      );
    } catch (err: any) {
      throw err;
    }
  }

  async remove(userId: string) {
    await this.usersRepository.delete({
      id: userId,
    });
  }

  async updateStatus(userId: string, updateUserStatusDto: UpdateUserStatusDto) {
    const params = {
      isActive: updateUserStatusDto.isActive,
    };
    if (updateUserStatusDto.isActive) {
      params["isPending"] = false;
    }

    await this.usersRepository.update(
      {
        id: userId,
      },
      params,
    );
  }

  async markUserActive(userId: string) {
    await this.usersRepository.update(
      {
        id: userId,
      },
      {
        lastActive: new Date(),
      },
    );
  }

  async fetchUserActiveStatus(userId: string) {
    const user = await this.usersRepository.findOneBy({
      id: userId,
    });

    return {
      status: this.getUserActiveStatus(user.lastActive),
    };
  }

  getUserActiveStatus(lastActiveDate?: Date) {
    if (lastActiveDate === undefined || lastActiveDate === null) {
      return "";
    }
    const currentTime = new Date();
    const timeDifference =
      Math.abs(currentTime.getTime() - lastActiveDate.getTime()) / 1000; // Difference in seconds

    if (timeDifference < 60) {
      return "Active now";
    } else if (timeDifference < 3600) {
      const minutes = Math.floor(timeDifference / 60);
      return `Active ${minutes} min ago`;
    } else if (timeDifference < 86400) {
      const hours = Math.floor(timeDifference / 3600);
      return `Active ${hours} hour ago`;
    } else {
      const days = Math.floor(timeDifference / 86400);
      return `Active ${days} days ago`;
    }
  }

  async fetchDashboard(userId: string, type: UserType) {
    if (type !== UserType.Admin) {
      throw new UnauthorizedException(
        `You don't have permission to access dashboard`,
      );
    }

    const [totalUsers] = await Promise.all([
      this.usersRepository.countBy({
        userType: UserType.User,
        isActive: true,
      }),
    ]);

    return {
      totalUsers,
    };
  }

  async fetchReports(userId: string, getReportsDto: GetReportsDto) {
    switch (getReportsDto.type) {
      case ReportsType.USERS_COUNT: {
        return this.fetchUsersReport(getReportsDto);
      }
    }
  }

  async fetchUsersReport(getReportsDto: GetReportsDto) {
    switch (getReportsDto.duration) {
      case ReportDuration.CURRENT_WEEK: {
        const currentDate = new Date();

        const startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - currentDate.getDay());

        const allDays = [];
        for (let index = 0; index < 7; index++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + index);
          allDays.push(date.toISOString().split("T")[0]);
        }

        const [users] = await Promise.all([
          this.userDataRepository.findUsersReports(
            getReportsDto,
            UserType.User,
          ),
        ]);

        return {
          users: allDays.map((day) => {
            return {
              day,
              count:
                users.find((r) => r.date.toISOString().split("T")[0] === day)
                  ?.count ?? 0,
            };
          }),
        };
      }

      case ReportDuration.CURRENT_MONTH: {
        const currentDate = new Date();

        const totalDays = this.getDaysInCurrentMonth();

        const startDate = new Date(currentDate);
        startDate.setDate(1);
        startDate.setMonth(currentDate.getMonth());
        startDate.setFullYear(currentDate.getFullYear());

        const allDays = [];
        for (let index = 0; index < totalDays; index++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + index);
          allDays.push(date.toISOString().split("T")[0]);
        }

        const [users] = await Promise.all([
          this.userDataRepository.findUsersReports(
            getReportsDto,
            UserType.User,
          ),
        ]);

        return {
          users: allDays.map((day) => {
            return {
              day,
              count:
                users.find((r) => r.date.toISOString().split("T")[0] === day)
                  ?.count ?? 0,
            };
          }),
        };
      }

      case ReportDuration.CURRENT_YEAR: {
        const totalMonths = 12;
        const allDays = [];
        for (let index = 1; index <= totalMonths; index++) {
          allDays.push(index);
        }

        const [users] = await Promise.all([
          this.userDataRepository.findUsersReports(
            getReportsDto,
            UserType.User,
          ),
        ]);

        return {
          users: allDays.map((day) => {
            return {
              month: day,
              count: users.find((r) => r.month === day)?.count ?? 0,
            };
          }),
        };
      }

      case ReportDuration.CUSTOM: {
        if (
          getReportsDto.startDate === undefined ||
          getReportsDto.endDate === undefined
        ) {
          throw new BadRequestException(
            "start date and end date must be provided",
          );
        }

        if (getReportsDto.startDate > getReportsDto.endDate) {
          throw new BadRequestException(
            "start date must be less than or equal to end date",
          );
        }

        const startDate = new Date(getReportsDto.startDate);
        const endDate = new Date(getReportsDto.endDate);

        let tempDate = startDate;
        const allDays = [];

        while (tempDate <= endDate) {
          allDays.push(tempDate.toISOString().split("T")[0]);
          tempDate.setDate(startDate.getDate() + 1);
        }

        const [users] = await Promise.all([
          this.userDataRepository.findUsersReports(
            getReportsDto,
            UserType.User,
          ),
        ]);

        return {
          users: allDays.map((day) => {
            return {
              day,
              count:
                users.find((r) => r.date.toISOString().split("T")[0] === day)
                  ?.count ?? 0,
            };
          }),
        };
      }
    }
  }

  getDaysInCurrentMonth() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // Months are zero-indexed, so we add 1

    // Get the last day of the current month
    const lastDayOfMonth = new Date(year, month, 0);

    // Extract the day part to get the number of days in the month
    const numberOfDays = lastDayOfMonth.getDate();

    return numberOfDays;
  }

  async fetchStripeCheckoutUrl(
    id: string,
    user: User,
    getStripeConnectUrlDto: GetStripeCheckoutUrlDto,
  ) {
    const session = await this.stripeService.fetchCheckoutUrl(
      getStripeConnectUrlDto.tier,
      getStripeConnectUrlDto.planType,
      getStripeConnectUrlDto.redirectUrl,
      id,
      user.email,
    );

    const params = {
      userId: id,
      checkoutSessionId: session.id,
      status: UserSubscriptionStatus.Initiated,
      customerEmail: session.customer_email,
      tier: getStripeConnectUrlDto.tier,
      planType: getStripeConnectUrlDto.planType,
    };

    await this.userSubscriptionsRepository.insert(params);

    return {
      url: session.url,
    };
  }

  async fetchSubscriptions(id: string) {
    const currentDate = new Date();
    return await this.userSubscriptionsRepository.findBy({
      userId: id,
      // $or: [
      //   { status: UserSubscriptionStatus.Paid },
      //   {
      //     status: UserSubscriptionStatus.Cancelled,
      //     cancelledAt: {
      //       $gte: currentDate,
      //     },
      //   },
      // ],
    });
  }

  async cancelSubscription(subscriptionId: string, userId: string) {
    const result = await this.stripeService.cancelSubscription(subscriptionId);
    await this.userSubscriptionsRepository.update(
      {
        subscriptionId: subscriptionId,
        userId: userId,
      },
      {
        status: UserSubscriptionStatus.Cancelled,
      },
    );
  }

  async handleStripeWebhook(event: any) {
    switch (event.type) {
      case "checkout.session.completed": {
        const data = event.data;
        const subscriptionStatus =
          data.object.payment_status === "paid"
            ? UserSubscriptionStatus.Paid
            : UserSubscriptionStatus.Cancelled;
        const session = await this.userSubscriptionsRepository.update(
          {
            checkoutSessionId: data.object.id,
            userId: data.object.client_reference_id,
          },
          {
            subscriptionId: data.object.subscription,
            status: subscriptionStatus,
            amount: data.object.amount_subtotal / 100,
            currency: data.object.currency,
          },
        );

        if (data.object.payment_status === "paid") {
          await this.usersRepository.update(
            {
              id: data.object.client_reference_id,
            },
            {
              isActive: subscriptionStatus === UserSubscriptionStatus.Paid,
            },
          );
        }

        break;
      }

      case "customer.subscription.updated": {
        const data = event.data;
        const planType = PlanType.MONTHLY;

        const subscriptionStatus =
          data.object.cancel_at === null
            ? UserSubscriptionStatus.Paid
            : UserSubscriptionStatus.Cancelled;
        let cancelledAt = undefined;
        if (data.object.cancel_at) {
          cancelledAt = new Date(0);
          cancelledAt.setUTCSeconds(data.object.cancel_at);
        }
        try {
          await this.userSubscriptionsRepository.update(
            {
              subscriptionId: data.object.id,
            },
            {
              status: subscriptionStatus,
              tier: Tier.STANDARD,
              planType: planType,
              amount: data.object.plan.amount / 100,
              currency: data.object.plan.currency,
              cancelledAt: cancelledAt,
            },
          );

          if (data.object.payment_status === "paid") {
            await this.usersRepository.update(
              {
                id: data.object.client_reference_id,
              },
              {
                tier: Tier.STANDARD,
                planType: planType,
                isActive: subscriptionStatus === UserSubscriptionStatus.Paid,
              },
            );
          }
        } catch (err) {
          console.error("handle stripe webhook", err);
        }

        break;
      }
    }
  }
}
