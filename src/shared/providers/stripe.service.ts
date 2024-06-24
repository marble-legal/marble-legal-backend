import { Injectable } from "@nestjs/common";
import { Feature } from "src/modules/users/entities/user-custom-plan.entity";
import { PlanType, Tier } from "src/modules/users/entities/user.entity";

@Injectable()
export class StripeService {
  constructor() {}

  async fetchCheckoutUrl(
    tier: Tier,
    planType: PlanType,
    redirectUrl: string,
    userId: string,
    email: string,
  ) {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const priceId = this.fetchPriceId(tier, planType);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      metadata: {
        userId,
      },
      customer_email: email,
      success_url: `${redirectUrl}?session_id={CHECKOUT_SESSION_ID}`,
      allow_promotion_codes: true,
      // phone_number_collection: {
      //   enabled: true,
      // },
      subscription_data: {
        trial_period_days: 7,
      },
      // cancel_url: 'https://example.com/canceled.html',
    });

    return session;
  }

  async fetchOneTimeCheckoutUrl(
    redirectUrl: string,
    userId: string,
    email: string,
    products: any[],
  ) {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    const featurePriceMap = {
      [Feature.AIAssistance]: process.env.STRIPE_AI_ASSISTANT_PRICE_ID,
      [Feature.ContractAnalysis]: process.env.STRIPE_CONTRACT_ANALYSIS_PRICE_ID,
      [Feature.ContractDrafting]:
        process.env.STRIPE_CONTRACT_GENERATION_PRICE_ID,
      [Feature.BusinessEntity]: process.env.STRIPE_BUSINESS_ENTITY_PRICE_ID,
      [Feature.AttorneyReview]: process.env.STRIPE_ATTORNEY_REVIEW_PRICE_ID,
    };

    const lineItems = products.map((product) => {
      return {
        price: featurePriceMap[product.feature],
        quantity: Number.parseInt(product.quantity),
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      client_reference_id: userId,
      metadata: {
        userId,
      },
      customer_email: email,
      success_url: `${redirectUrl}?session_id={CHECKOUT_SESSION_ID}`,
      allow_promotion_codes: true,
      cancel_url: `${redirectUrl}/error`,
      // customer_creation: 'always'
    });

    return session;
  }

  async cancelSubscription(subscriptionId: string) {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  }

  async fetchSubscription(subscriptionId: string) {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  }

  async updateSubscription(
    subscriptionId: string,
    subscriptionItemId: string,
    tier: Tier,
    planType: PlanType,
  ) {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const priceId = this.fetchPriceId(tier, planType);
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscriptionItemId,
          price: priceId,
        },
      ],
    });
    return subscription;
  }

  async fetchCustomerPortalUrl(customerId: string, redirectUrl: string) {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: redirectUrl,
    });
    return session;
  }

  fetchPriceId(tier: Tier, planType: PlanType) {
    switch (tier) {
      case Tier.INDIVIDUAL: {
        if (planType === PlanType.YEARLY) {
          return process.env.STRIPE_INDIVIDUAL_YEARLY_PRICE_ID;
        } else {
          return process.env.STRIPE_INDIVIDUAL_MONTHLY_PRICE_ID;
        }
      }

      case Tier.SMALL_BUSINESS: {
        if (planType === PlanType.YEARLY) {
          return process.env.STRIPE_SMALL_BUSINESS_YEARLY_PRICE_ID;
        } else {
          return process.env.STRIPE_SMALL_BUSINESS_MONTHLY_PRICE_ID;
        }
      }

      case Tier.SOLO_PRACTITIONER: {
        if (planType === PlanType.YEARLY) {
          return process.env.STRIPE_SOLO_PRACTIONER_YEARLY_PRICE_ID;
        } else {
          return process.env.STRIPE_SOLO_PRACTIONER_MONTHLY_PRICE_ID;
        }
      }
    }
  }
}
