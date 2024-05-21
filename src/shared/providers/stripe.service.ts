import { Injectable } from "@nestjs/common";
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
    let priceId = "";
    switch (tier) {
      case Tier.STANDARD: {
        priceId = process.env.STRIPE_STANDARD_MONTHLY_PRICE_ID;
        break;
      }

      case Tier.PRO: {
        priceId = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
        break;
      }

      case Tier.MAX: {
        priceId = process.env.STRIPE_MAX_MONTHLY_PRICE_ID;
        break;
      }

      case Tier.ULTRA: {
        priceId = process.env.STRIPE_ULTRA_MONTHLY_PRICE_ID;
        break;
      }
    }

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
      // subscription_data: {
      //   trial_period_days: 30,
      // },
      // cancel_url: 'https://example.com/canceled.html',
    });

    return session;
  }

  async cancelSubscription(subscriptionId: string) {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  }
}
