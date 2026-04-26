import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { clerkClient } from "@clerk/nextjs/server";

// Stripe webhook receiver. Must be a Node.js runtime (not Edge) because
// it needs the raw request body to verify the signature.
export const runtime = "nodejs";
// Make sure Next.js never caches this endpoint's response.
export const dynamic = "force-dynamic";

async function setUserPlan(clerkUserId: string, plan: "free" | "pro", extra: Record<string, unknown> = {}) {
  try {
    const client = await clerkClient();
    await client.users.updateUser(clerkUserId, {
      publicMetadata: { plan, ...extra },
    });
  } catch (e) {
    console.error("[stripe webhook] failed to update Clerk user", clerkUserId, e);
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !whSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const stripe = new Stripe(secret);
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, whSecret);
  } catch (e) {
    const message = e instanceof Error ? e.message : "signature verification failed";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const clerkUserId = s.client_reference_id || (s.metadata?.clerkUserId as string | undefined);
        if (clerkUserId) {
          await setUserPlan(clerkUserId, "pro", {
            stripeCustomerId: typeof s.customer === "string" ? s.customer : undefined,
            stripeSubscriptionId: typeof s.subscription === "string" ? s.subscription : undefined,
          });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const clerkUserId = sub.metadata?.clerkUserId;
        if (clerkUserId) {
          const isActive = sub.status === "active" || sub.status === "trialing";
          await setUserPlan(clerkUserId, isActive ? "pro" : "free", {
            stripeSubscriptionId: sub.id,
            stripeCustomerId: typeof sub.customer === "string" ? sub.customer : undefined,
            subscriptionStatus: sub.status,
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const clerkUserId = sub.metadata?.clerkUserId;
        if (clerkUserId) {
          await setUserPlan(clerkUserId, "free", {
            stripeSubscriptionId: sub.id,
            subscriptionStatus: "canceled",
          });
        }
        break;
      }
      default:
        // Ignore events we don't care about — ack with 200 so Stripe doesn't retry.
        break;
    }
  } catch (e) {
    console.error("[stripe webhook] handler error", e);
    // Respond 500 so Stripe retries transient failures. Known-bad inputs
    // should have been rejected before reaching here.
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
