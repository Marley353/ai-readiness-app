import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { PRICING } from "@/lib/plans";

// Creates a Stripe Checkout Session for the authenticated user and
// returns the hosted checkout URL. Called from the Pricing page button.
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Stripe is not configured yet (missing STRIPE_SECRET_KEY)" }, { status: 500 });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "You must be signed in to start checkout" }, { status: 401 });
  }

  let body: { interval?: "monthly" | "annual" };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const interval = body.interval === "monthly" ? "monthly" : "annual";
  const priceId = interval === "monthly" ? PRICING.monthly.priceId : PRICING.annual.priceId;
  if (!priceId) {
    return NextResponse.json(
      {
        error:
          "Stripe Price ID is not configured yet. Ask the site owner to set STRIPE_PRICE_ID_MONTHLY and STRIPE_PRICE_ID_ANNUAL in Vercel environment variables.",
      },
      { status: 500 },
    );
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  const stripe = new Stripe(secret);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      // Tie the Stripe customer to the Clerk user so the webhook can
      // stamp subscription status back on Clerk metadata.
      client_reference_id: userId,
      metadata: { clerkUserId: userId, plan: "pro", interval },
      subscription_data: {
        metadata: { clerkUserId: userId, plan: "pro", interval },
      },
      allow_promotion_codes: true,
      success_url: `${appUrl}/account?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL" }, { status: 500 });
    }
    return NextResponse.json({ url: session.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
