import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getDb } from "@/db";
import { subscriptions, invoices } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const db = getDb();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const professionalId = Number(session.metadata?.professionalId);
      const planKey = session.metadata?.planKey;
      const billingCycle = session.metadata?.billingCycle as "monthly" | "yearly" | undefined;
      if (professionalId && planKey) {
        const existing = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.professionalId, professionalId));

        const values = {
          professionalId,
          planKey,
          billingCycle: billingCycle ?? "monthly",
          status: "active" as const,
          paymentMethod: "stripe" as const,
          stripeSubscriptionId: String(session.subscription ?? ""),
          stripeCustomerId: String(session.customer ?? ""),
        };

        if (existing[0]) {
          await db.update(subscriptions).set(values).where(eq(subscriptions.id, existing[0].id));
        } else {
          await db.insert(subscriptions).values(values);
        }

        await db.insert(invoices).values({
          professionalId,
          amountMad: (session.amount_total ?? 0) / 100,
          status: "paid",
          paymentMethod: "stripe",
          paidAt: new Date(),
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await db
        .update(subscriptions)
        .set({ status: "canceled" })
        .where(eq(subscriptions.stripeSubscriptionId, sub.id));
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
