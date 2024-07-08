import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { StripeService } from "src/shared/providers/stripe.service";
import { MoreThan, Repository } from "typeorm";
import {
  Feature,
  UserCustomPlan,
  UserCustomPlanStatus,
} from "../users/entities/user-custom-plan.entity";
import {
  UserSubscription,
  UserSubscriptionStatus,
} from "../users/entities/user-subscription.entity";
import { Tier, PlanType, User } from "../users/entities/user.entity";
import { GetStripeCheckoutUrlDto } from "../users/dto/get-stripe-checkout-url.dto";
import { GetStripeCustomerPortalUrlDto } from "../users/dto/get-stripe-customer-portal-url.dto";
import { UpdateSubscriptionDto } from "../users/dto/update-subscription.dto";
import { UserPayment } from "../users/entities/user-payment.entity";

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserSubscription)
    private userSubscriptionsRepository: Repository<UserSubscription>,
    @InjectRepository(UserCustomPlan)
    private userCustomPlansRepository: Repository<UserCustomPlan>,
    @InjectRepository(UserPayment)
    private userPaymentsRepository: Repository<UserPayment>,
    private readonly stripeService: StripeService,
  ) {}

  async fetchSubscriptions(id: string) {
    const currentDate = new Date();
    const fixedPlans = await this.userSubscriptionsRepository.find({
      where: [
        {
          userId: id,
          status: UserSubscriptionStatus.Paid,
          isActive: true,
        },
        {
          userId: id,
          status: UserSubscriptionStatus.Cancelled,
          cancelledAt: MoreThan(currentDate),
          isActive: true,
        },
      ],
      order: {
        createdAt: "DESC",
      },
      take: 1,
    });

    if (fixedPlans.length > 0) {
      return fixedPlans;
    }

    const [customPlans, user] = await Promise.all([
      this.userCustomPlansRepository.find({
        where: [
          {
            userId: id,
            status: UserCustomPlanStatus.Paid,
          },
        ],
        order: {
          createdAt: "DESC",
        },
        take: 1,
      }),
      this.usersRepository.findOneBy({
        id: id,
      }),
    ]);

    return customPlans.map((plan) => {
      return {
        ...plan,
        tier: Tier.CUSTOMISED,
        planType: PlanType.MONTHLY,
        currentCredit: user.currentCredit,
      };
    });
  }

  async fetchStripeCheckoutUrl(
    id: string,
    user: User,
    getStripeConnectUrlDto: GetStripeCheckoutUrlDto,
  ) {
    if (getStripeConnectUrlDto.tier === Tier.CUSTOMISED) {
      const products = [];
      const currentDate = new Date();
      if (
        getStripeConnectUrlDto.aiAssistant &&
        getStripeConnectUrlDto.aiAssistant > 0
      ) {
        products.push({
          feature: Feature.AIAssistance,
          quantity: getStripeConnectUrlDto.aiAssistant,
          date: currentDate,
        });
      }
      if (
        getStripeConnectUrlDto.contractAnalysis &&
        getStripeConnectUrlDto.contractAnalysis > 0
      ) {
        products.push({
          feature: Feature.ContractAnalysis,
          quantity: getStripeConnectUrlDto.contractAnalysis,
          date: currentDate,
        });
      }
      if (
        getStripeConnectUrlDto.contractDrafting &&
        getStripeConnectUrlDto.contractDrafting > 0
      ) {
        products.push({
          feature: Feature.ContractDrafting,
          quantity: getStripeConnectUrlDto.contractDrafting,
          date: currentDate,
        });
      }
      if (
        getStripeConnectUrlDto.businessEntity &&
        getStripeConnectUrlDto.businessEntity > 0
      ) {
        products.push({
          feature: Feature.BusinessEntity,
          quantity: getStripeConnectUrlDto.businessEntity,
          date: currentDate,
        });
      }
      if (
        getStripeConnectUrlDto.attorneyReview &&
        getStripeConnectUrlDto.attorneyReview > 0
      ) {
        products.push({
          feature: Feature.AttorneyReview,
          quantity: getStripeConnectUrlDto.attorneyReview,
          date: currentDate,
        });
      }
      const session = await this.stripeService.fetchOneTimeCheckoutUrl(
        getStripeConnectUrlDto.redirectUrl,
        id,
        user.email,
        products,
      );
      const params = {
        userId: id,
        checkoutSessionId: session.id,
        status: UserCustomPlanStatus.Initiated,
        customerEmail: session.customer_email,
        tier: getStripeConnectUrlDto.tier,
        planType: getStripeConnectUrlDto.planType,
        assignedCredit: products,
        currentCredit: products,
      };

      await this.userCustomPlansRepository.insert(params);

      return {
        url: session.url,
      };
    } else {
      const subscriptionsCount = await this.userSubscriptionsRepository.countBy(
        {
          userId: id,
        },
      );
      const session = await this.stripeService.fetchCheckoutUrl(
        getStripeConnectUrlDto.tier,
        getStripeConnectUrlDto.planType,
        getStripeConnectUrlDto.redirectUrl,
        id,
        user.email,
        subscriptionsCount === 0,
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
  }

  async fetchStripeCustomerPortalUrl(
    id: string,
    getStripeCustomerPortalUrlDto: GetStripeCustomerPortalUrlDto,
  ) {
    const user = await this.usersRepository.findOneBy({
      id: id,
    });
    const session = await this.stripeService.fetchCustomerPortalUrl(
      user.stripeCustomerId,
      getStripeCustomerPortalUrlDto.redirectUrl,
    );

    return {
      url: session.url,
    };
  }

  async updateSubscription(
    subscriptionId: string,
    userId: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    const subscription = await this.userSubscriptionsRepository.findOneBy({
      subscriptionId: subscriptionId,
    });

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with id: ${subscriptionId} not found`,
      );
    }

    let subscriptionItemId = subscription.subscriptionItemId;

    if (subscriptionItemId === undefined || subscriptionItemId === null) {
      const subscriptionData =
        await this.stripeService.fetchSubscription(subscriptionId);
      subscriptionItemId = subscriptionData?.items?.data[0]?.id;
      await this.userSubscriptionsRepository.update(
        {
          subscriptionId: subscriptionId,
        },
        {
          subscriptionItemId: subscriptionItemId,
        },
      );
    }

    await Promise.all([
      this.stripeService.updateSubscription(
        subscriptionId,
        subscriptionItemId,
        updateSubscriptionDto.tier,
        updateSubscriptionDto.planType,
      ),
      this.userSubscriptionsRepository.update(
        {
          subscriptionId: subscriptionId,
          userId: userId,
        },
        {
          tier: updateSubscriptionDto.tier,
        },
      ),
    ]);

    return {
      message: "Subscription updated successfully",
    };
  }

  async cancelSubscription(subscriptionId: string, userId: string) {
    await this.stripeService.cancelSubscription(subscriptionId);
  }

  async canUseFeature(feature: Feature, userId: string) {
    const user = await this.usersRepository.findOneBy({
      id: userId,
    });

    if (!user.isActive || !user.tier) {
      return false;
    }

    if (
      user.tier === Tier.SMALL_BUSINESS &&
      [
        Feature.AIAssistance,
        Feature.ContractAnalysis,
        Feature.ContractDrafting,
      ].includes(feature)
    ) {
      return true;
    }

    const currentCredit = user.currentCredit ?? [];

    const featureIndex =
      currentCredit?.findIndex((credit) => credit.feature === feature) ?? -1;

    if (featureIndex === -1) {
      return false;
    }

    const credit = Number.parseInt(currentCredit[featureIndex].quantity);

    // if (feature === Feature.AIAssistance) {
    //   const aiAssistantCreditMonths = credit;
    //   const validDate = new Date(subscription.createdAt);
    //   validDate.setMonth(validDate.getMonth() + aiAssistantCreditMonths);

    //   if (validDate >= new Date()) {
    //     return true;
    //   }

    //   return false;
    // }

    if (credit <= 0) {
      return false;
    }

    return true;
  }

  async deductCreditOnUsingFeature(feature: Feature, userId: string) {
    const user = await this.usersRepository.findOneBy({
      id: userId,
    });

    if (
      user.tier === Tier.SMALL_BUSINESS &&
      [
        Feature.AIAssistance,
        Feature.ContractAnalysis,
        Feature.ContractDrafting,
      ].includes(feature)
    ) {
      return;
    }

    const currentCredit = user.currentCredit ?? [];

    const featureIndex =
      currentCredit?.findIndex((credit) => credit.feature === feature) ?? -1;

    if (featureIndex === -1) {
      return;
    }

    const credit = Number.parseInt(currentCredit[featureIndex].quantity);

    if (credit <= 0) {
      return;
    }

    await this.usersRepository.update(
      {
        id: userId,
      },
      {
        currentCredit: currentCredit.map((credit) => {
          if (credit.feature === feature) {
            return {
              feature: credit.feature,
              quantity: `${Number.parseInt(credit.quantity) - 1}`,
            };
          }
          return {
            feature: credit.feature,
            quantity: credit.quantity,
          };
        }),
      },
    );
  }

  getMonthsDifference(date1: Date, date2: Date) {
    return (
      (date2.getFullYear() - date1.getFullYear()) * 12 +
      (date2.getMonth() - date1.getMonth())
    );
  }

  async fetchTotalSubscriptions() {
    const subscriptions = await this.userSubscriptionsRepository.count({
      where: {
        status: UserSubscriptionStatus.Paid,
      },
    });

    const customPlans = await this.userCustomPlansRepository.count({
      where: {
        status: UserCustomPlanStatus.Paid,
      },
    });

    return subscriptions + customPlans;
  }

  async handleStripeWebhook(event: any, rawBody: any, signatureHeader: any) {
    try {
      this.stripeService.verifyWebhookSignature(rawBody, signatureHeader);
    } catch (err) {
      console.error("handle stripe webhook", err);
      throw err;
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const data = event.data;

        if (
          data.object.subscription === null ||
          data.object.subscription === undefined
        ) {
          // customised plan payment

          const [user, customPlan] = await Promise.all([
            this.usersRepository.findOneBy({
              id: data.object.client_reference_id,
            }),
            this.userCustomPlansRepository.findOneBy({
              checkoutSessionId: data.object.id,
              userId: data.object.client_reference_id,
            }),
          ]);

          const currentCredit = user.currentCredit ?? [];
          const assignedCredit = customPlan.assignedCredit;

          const currentDate = new Date();

          assignedCredit.forEach((credit) => {
            const creditIndex =
              currentCredit?.findIndex(
                (currentCredit) => currentCredit.feature === credit.feature,
              ) ?? -1;

            if (creditIndex === -1) {
              currentCredit.push(credit);
            } else {
              currentCredit[creditIndex].quantity = `${
                Number.parseInt(currentCredit[creditIndex].quantity) +
                Number.parseInt(credit.quantity)
              }`;

              if (currentCredit[creditIndex].feature === Feature.AIAssistance) {
                const creditDate = new Date(currentCredit[creditIndex].date);
                creditDate.setMonth(
                  creditDate.getMonth() + Number.parseInt(credit.quantity),
                );
                currentCredit[creditIndex].date =
                  currentDate > creditDate
                    ? currentDate
                    : new Date(currentCredit[creditIndex].date);
              } else {
                currentCredit[creditIndex].date = currentDate;
              }
            }
          });

          const paymentStatus =
            data.object.payment_status === "paid"
              ? UserCustomPlanStatus.Paid
              : UserCustomPlanStatus.Cancelled;
          await Promise.all([
            this.usersRepository.update(
              {
                id: data.object.client_reference_id,
              },
              {
                tier: user.tier ?? Tier.CUSTOMISED,
                stripeCustomerId: data.object.customer,
                planType: user.planType ?? PlanType.MONTHLY,
                currentCredit: currentCredit,
              },
            ),
            this.userCustomPlansRepository.update(
              {
                checkoutSessionId: data.object.id,
                userId: data.object.client_reference_id,
              },
              {
                status: paymentStatus,
                amount: data.object.amount_subtotal / 100,
                currency: data.object.currency,
                customerId: data.object.customer,
              },
            ),
            this.userPaymentsRepository.insert({
              userId: data.object.client_reference_id,
              amount: data.object.amount_subtotal / 100,
              currency: data.object.currency,
              customerEmail: data.object.customer_email,
              customerId: data.object.customer,
            }),
          ]);
          return;
        }

        const subscriptionStatus =
          data.object.payment_status === "paid"
            ? UserSubscriptionStatus.Paid
            : UserSubscriptionStatus.Cancelled;
        await Promise.all([
          this.userSubscriptionsRepository.update(
            {
              checkoutSessionId: data.object.id,
              userId: data.object.client_reference_id,
            },
            {
              subscriptionId: data.object.subscription,
              status: subscriptionStatus,
              amount: data.object.amount_subtotal / 100,
              currency: data.object.currency,
              customerId: data.object.customer,
              customerEmail: data.object.customer_email,
            },
          ),
          this.usersRepository.update(
            {
              id: data.object.client_reference_id,
            },
            {
              stripeCustomerId: data.object.customer,
              planType: data.object.metadata?.planType,
              tier: data.object.metadata?.tier,
            },
          ),
        ]);

        break;
      }

      case "customer.subscription.created": {
        const data = event.data;

        const subscriptionStatus =
          data.object.cancel_at === null
            ? UserSubscriptionStatus.Paid
            : UserSubscriptionStatus.Cancelled;
        let cancelledAt = undefined;
        if (data.object.cancel_at) {
          cancelledAt = new Date(0);
          cancelledAt.setUTCSeconds(data.object.cancel_at);
        }

        const MonthlyPriceTierMap = {
          [process.env.STRIPE_INDIVIDUAL_MONTHLY_PRICE_ID]: Tier.INDIVIDUAL,
          [process.env.STRIPE_SMALL_BUSINESS_MONTHLY_PRICE_ID]:
            Tier.SMALL_BUSINESS,
          [process.env.STRIPE_SOLO_PRACTIONER_MONTHLY_PRICE_ID]:
            Tier.SOLO_PRACTITIONER,
        };

        const YearlyPriceTierMap = {
          [process.env.STRIPE_INDIVIDUAL_YEARLY_PRICE_ID]: Tier.INDIVIDUAL,
          [process.env.STRIPE_SMALL_BUSINESS_YEARLY_PRICE_ID]:
            Tier.SMALL_BUSINESS,
          [process.env.STRIPE_SOLO_PRACTIONER_YEARLY_PRICE_ID]:
            Tier.SOLO_PRACTITIONER,
        };

        const priceId = data.object.plan.id;
        let tier = MonthlyPriceTierMap[priceId];
        let planType = PlanType.MONTHLY;
        if (tier === undefined) {
          tier = YearlyPriceTierMap[priceId];
          planType = PlanType.YEARLY;
        }

        const subscription = await this.userSubscriptionsRepository.findOneBy({
          subscriptionId: data.object.id,
        });

        if (!subscription) {
          return;
        }

        try {
          await Promise.all([
            this.userSubscriptionsRepository.update(
              {
                subscriptionId: subscription.subscriptionId,
              },
              {
                status: subscriptionStatus,
                amount: data.object.plan.amount / 100,
                currency: data.object.plan.currency,
                cancelledAt: cancelledAt,
                subscriptionItemId: data.object.items.data[0].id,
                planType: planType,
                tier: tier,
              },
            ),
            this.usersRepository.update(
              {
                id: subscription.userId,
              },
              {
                tier: tier,
                planType: planType,
                // currentCredit: currentCredits,
              },
            ),
          ]);
        } catch (err) {
          console.error("handle stripe webhook", err);
        }

        break;
      }

      case "customer.subscription.updated": {
        const data = event.data;

        const subscriptionStatus =
          data.object.cancel_at === null
            ? UserSubscriptionStatus.Paid
            : UserSubscriptionStatus.Cancelled;
        let cancelledAt = undefined;
        if (data.object.cancel_at) {
          cancelledAt = new Date(0);
          cancelledAt.setUTCSeconds(data.object.cancel_at);
        }

        const MonthlyPriceTierMap = {
          [process.env.STRIPE_INDIVIDUAL_MONTHLY_PRICE_ID]: Tier.INDIVIDUAL,
          [process.env.STRIPE_SMALL_BUSINESS_MONTHLY_PRICE_ID]:
            Tier.SMALL_BUSINESS,
          [process.env.STRIPE_SOLO_PRACTIONER_MONTHLY_PRICE_ID]:
            Tier.SOLO_PRACTITIONER,
        };

        const YearlyPriceTierMap = {
          [process.env.STRIPE_INDIVIDUAL_YEARLY_PRICE_ID]: Tier.INDIVIDUAL,
          [process.env.STRIPE_SMALL_BUSINESS_YEARLY_PRICE_ID]:
            Tier.SMALL_BUSINESS,
          [process.env.STRIPE_SOLO_PRACTIONER_YEARLY_PRICE_ID]:
            Tier.SOLO_PRACTITIONER,
        };

        const priceId = data.object.plan.id;
        let tier = MonthlyPriceTierMap[priceId];
        let planType = PlanType.MONTHLY;
        if (tier === undefined) {
          tier = YearlyPriceTierMap[priceId];
          planType = PlanType.YEARLY;
        }

        const subscription = await this.userSubscriptionsRepository.findOneBy({
          subscriptionId: data.object.id,
        });

        if (!subscription) {
          return;
        }

        try {
          await Promise.all([
            this.userSubscriptionsRepository.update(
              {
                subscriptionId: subscription.subscriptionId,
              },
              {
                status: subscriptionStatus,
                amount: data.object.plan.amount / 100,
                currency: data.object.plan.currency,
                cancelledAt: cancelledAt,
                subscriptionItemId: data.object.items.data[0].id,
                planType: planType,
                tier: tier,
              },
            ),
            this.usersRepository.update(
              {
                id: subscription.userId,
              },
              {
                tier: tier,
                planType: planType,
                // currentCredit: currentCredits,
              },
            ),
          ]);
        } catch (err) {
          console.error("handle stripe webhook", err);
        }

        break;
      }

      case "invoice.payment_succeeded": {
        const customerEmail = event.data.object.customer_email;

        const user = await this.usersRepository.findOneBy({
          email: customerEmail,
        });

        if (!user) {
          return;
        }

        const MonthlyPriceTierMap = {
          [process.env.STRIPE_INDIVIDUAL_MONTHLY_PRICE_ID]: Tier.INDIVIDUAL,
          [process.env.STRIPE_SMALL_BUSINESS_MONTHLY_PRICE_ID]:
            Tier.SMALL_BUSINESS,
          [process.env.STRIPE_SOLO_PRACTIONER_MONTHLY_PRICE_ID]:
            Tier.SOLO_PRACTITIONER,
        };

        const YearlyPriceTierMap = {
          [process.env.STRIPE_INDIVIDUAL_YEARLY_PRICE_ID]: Tier.INDIVIDUAL,
          [process.env.STRIPE_SMALL_BUSINESS_YEARLY_PRICE_ID]:
            Tier.SMALL_BUSINESS,
          [process.env.STRIPE_SOLO_PRACTIONER_YEARLY_PRICE_ID]:
            Tier.SOLO_PRACTITIONER,
        };

        const lineItems = event.data.object?.lines?.data ?? [];

        if (lineItems.length === 0) {
          return;
        }

        const priceId = lineItems[lineItems.length - 1].plan?.id;
        let tier = MonthlyPriceTierMap[priceId];
        let planType = PlanType.MONTHLY;
        if (tier === undefined) {
          tier = YearlyPriceTierMap[priceId];
          planType = PlanType.YEARLY;
        }

        const subscriptionsCount =
          await this.userSubscriptionsRepository.countBy({
            userId: user.id,
          });

        const trialLines = lineItems.some((line) => {
          return line.description?.toLowerCase()?.includes("trial") ?? false;
        });

        const isTrialPeriod = trialLines > 0;

        const currentCredits = this.provideLatestCredit(
          tier,
          user.currentCredit ?? [],
          isTrialPeriod,
        );

        await Promise.all([
          this.userPaymentsRepository.insert({
            userId: user.id,
            amount: event.data.object.amount_paid / 100,
            currency: event.data.object.currency,
            customerEmail: event.data.object.customer_email,
            customerId: event.data.object.customer,
            subscriptionId: event.data.object.subscription,
          }),
          this.usersRepository.update(
            {
              id: user.id,
            },
            {
              currentCredit: currentCredits,
            },
          ),
        ]);
        break;
      }

      case "customer.subscription.deleted": {
        const data = event.data;

        const subscriptionStatus =
          data.object.cancel_at === null && data.object.canceled_at === null
            ? UserSubscriptionStatus.Paid
            : UserSubscriptionStatus.Cancelled;
        let cancelledAt = undefined;
        if (data.object.cancel_at) {
          cancelledAt = new Date(0);
          cancelledAt.setUTCSeconds(data.object.cancel_at);
        } else if (data.object.canceled_at) {
          cancelledAt = new Date(0);
          cancelledAt.setUTCSeconds(data.object.canceled_at);
        }

        if (
          data.object.trial_end &&
          data.object.trial_end > Math.floor(Date.now() / 1000)
        ) {
          console.log(
            "Subscription was in trial period at the time of deletion.",
          );
          const user = await this.usersRepository.findOneBy({
            stripeCustomerId: data.object.customer,
          });
          if (user) {
            const subscriptionsCount =
              await this.userCustomPlansRepository.countBy({
                userId: user.id,
                isActive: true,
                status: UserCustomPlanStatus.Paid,
              });
            if (subscriptionsCount === 0) {
              await this.usersRepository.update(
                {
                  id: user.id,
                },
                {
                  currentCredit: [],
                },
              );
            }
          }
        }

        try {
          await Promise.all([
            this.userSubscriptionsRepository.update(
              {
                subscriptionId: data.object.id,
              },
              {
                status: subscriptionStatus,
                cancelledAt: cancelledAt,
              },
            ),
            this.usersRepository.update(
              {
                stripeCustomerId: data.object.customer,
              },
              {
                tier: null,
                planType: null,
              },
            ),
          ]);
        } catch (err) {
          console.error("handle stripe webhook", err);
        }

        break;
      }
    }
  }

  provideLatestCredit(
    tier: Tier,
    currentCredit: any[],
    isTrialPeriod: boolean,
  ) {
    const creditsPerPlan = {
      [Tier.INDIVIDUAL]: {
        [Feature.AIAssistance]: isTrialPeriod ? 2 : 10,
        [Feature.ContractAnalysis]: isTrialPeriod ? 1 : 2,
        [Feature.ContractDrafting]: isTrialPeriod ? 1 : 2,
      },
    };

    if (tier === Tier.SMALL_BUSINESS) {
      const arr = [];

      const businessEntityCredit = currentCredit.find(
        (credit) => credit.feature === Feature.BusinessEntity,
      );
      const attorneyReviewCredit = currentCredit.find(
        (credit) => credit.feature === Feature.AttorneyReview,
      );

      if (businessEntityCredit) {
        arr.push(businessEntityCredit);
      }

      if (attorneyReviewCredit) {
        arr.push(attorneyReviewCredit);
      }

      return arr;
    }

    const assignedCredit = [];
    const credits = creditsPerPlan[tier];
    const currentDate = new Date();

    for (const [feature, quantity] of Object.entries(credits)) {
      assignedCredit.push({
        feature: feature,
        quantity: quantity,
        date: currentDate,
      });
    }

    assignedCredit.forEach((credit) => {
      const creditIndex =
        currentCredit?.findIndex(
          (currentCredit) => currentCredit.feature === credit.feature,
        ) ?? -1;

      if (creditIndex === -1) {
        currentCredit.push(credit);
      } else {
        currentCredit[creditIndex].quantity = `${
          Number.parseInt(currentCredit[creditIndex].quantity) +
          Number.parseInt(credit.quantity)
        }`;

        if (currentCredit[creditIndex].feature === Feature.AIAssistance) {
          const creditDate = new Date(currentCredit[creditIndex].date);
          creditDate.setMonth(
            creditDate.getMonth() + Number.parseInt(credit.quantity),
          );
          currentCredit[creditIndex].date =
            currentDate > creditDate
              ? currentDate
              : new Date(currentCredit[creditIndex].date);
        } else {
          currentCredit[creditIndex].date = currentDate;
        }
      }
    });

    return currentCredit;
  }
}
