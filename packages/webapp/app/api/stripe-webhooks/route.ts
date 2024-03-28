import Cors from 'micro-cors';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { Stripe } from '@stripe/stripe-js';

const cors = Cors({
  allowMethods: ['POST', 'HEAD'],
});

export async function POST(req: Request) {
  try {
    let event: Event | null = null;
    if (process.env.VERCEL_ENV === 'production') {
      const body = await req.text();
      const signature = headers().get('stripe-signature');
      if (!signature) {
        throw new Error('Missing stripe-signature header');
      }
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!secret) {
        throw new Error('Missing STRIPE_WEBHOOK_SECRET');
      }
      event = stripe.webhooks.constructEvent(body, signature, secret);
    } else {
      event = (await req.json()) as Event;
    }
    console.log(`Received Stripe webhook event: ${JSON.stringify(event)}`);

    if (event.type === 'checkout.session.completed') {
      return handleSessionCompleted(event);
    } else if (event.type === 'customer.subscription.updated') {
      return handleSubscriptionUpdated(event);
    } else if (event.type === 'customer.subscription.deleted') {
      return handleSubscriptionDeleted(event);
    } else {
      console.warn(`Unhandled event type: ${event.type}`);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message: `Problem handling webhook: ${(error as { message: string }).message}`,
        ok: false,
      },
      { status: 500 },
    );
  }
}

async function handleSessionCompleted(event: Stripe.Event) {
  const session = event.data.object;
  console.log(`Session completed: ${JSON.stringify(session)}`);
}
