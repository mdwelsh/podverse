import Cors from 'micro-cors';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { getSupabaseClientWithToken } from '@/lib/supabase';
import { GetUser, GetSubscriptions } from 'podverse-utils';
import { SubscriptionState, PLANS } from '@/lib/plans';
import moment from 'moment';
import { createClient } from '@supabase/supabase-js';

const cors = Cors({
  allowMethods: ['POST', 'HEAD'],
});

export async function POST(req: Request) {
  try {
    let event = null;
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
      event = await req.json();
    }
    console.log(`Received Stripe webhook event: ${event.type}`);

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

async function handleSessionCompleted(event: any) {
  const session = event.data.object;
  const userId = event.data.object.client_reference_id;
  console.log(`Checkout session completed for user ${userId}`);
  const { supabaseAccessToken } = session.metadata;
  if (!userId || !supabaseAccessToken) {
    throw new Error('Bad request');
  }
  const supabase = await getSupabaseClientWithToken(supabaseAccessToken);
  const user = await GetUser(supabase, userId);
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }
  const subscriptions = await GetSubscriptions(supabase, userId);
  if (subscriptions.filter((s) => s.state === SubscriptionState.Active).length > 0) {
    throw new Error(`User already has an active subscription: ${userId}`);
  }
  const subId = event.data.object.subscription;
  const sub = await stripe.subscriptions.retrieve(subId);
  const priceId = sub.items.data[0].price.id;
  const startTime = moment.unix(sub.current_period_start).toDate();
  const endTime = moment.unix(sub.current_period_end).toDate();
  const email = event.data.object.customer_details.email;

  // Get plan entry that has the priceId.
  const plan = Object.values(PLANS).find((p) => p.priceId === priceId);
  if (!plan) {
    throw new Error(`No plan found for priceId: ${priceId}`);
  }

  const { error } = await supabase.from('Subscriptions').insert([
    {
      user: userId,
      plan: plan.id,
      state: SubscriptionState.Active,
      description: `Purchased by ${email}`,
      billingProviderId: subId,
      start_time: startTime,
      end_time: endTime,
    },
  ]);
  if (error) {
    throw error;
  }
  console.log(`Created subscription for user ${userId} for plan ${plan.id}`);
  return NextResponse.json({ ok: true });
}

async function handleSubscriptionUpdated(event: any) {
  // NOTE - This is a little dodgy as we are bypassing RLS here to update
  // the Subscriptions table on behalf of the user. The challenge is that we don't
  // have any direct way to get a Supabase access token here.
  //
  // The alternative would be to store a long-lived JWT in the subscription
  // metadata, howwver, that carries its own set of risks. For now we just access
  // the database here as the service role and hope that the code below does not
  // have any abuse vectors.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  );

  const newSub = event.data.object;
  const subId = newSub.id;
  const { data, error } = await supabase.from('Subscriptions').select('*').eq('billingProviderId', subId);
  if (error) {
    throw error;
  }
  if (!data || data.length === 0) {
    console.warn(`Subscription not found for billingProviderId: ${subId}`);
    return NextResponse.json({ ok: true });
  }
  const oldSub = data[0];

  const priceId = newSub.items.data[0].price.id;
  const plan = Object.values(PLANS).find((p) => p.priceId === priceId);
  if (!plan) {
    throw new Error(`No plan found for priceId: ${priceId}`);
  }
  if (newSub.cancel_at && newSub.cancel_at_period_end) {
    console.log(`Subscription ${subId} - cancelation requested`);
    oldSub.state = SubscriptionState.CancelPending;
  } else {
    if (oldSub.plan === plan.id) {
      console.log(`Renewing subscription ${subId} for plan ${plan.id}`);
    } else {
      console.log(`Changing subscription ${subId} to plan ${plan.id}`);
      oldSub.plan = plan.id;
    }
  }
  oldSub.start_time = moment.unix(newSub.current_period_start).toDate();
  oldSub.end_time = moment.unix(newSub.current_period_end).toDate();
  const { error: updateError } = await supabase.from('Subscriptions').update([oldSub]).eq('billingProviderId', subId);
  if (updateError) {
    throw updateError;
  }
  console.log(`Updated subscription ${subId}`);
  return NextResponse.json({ ok: true });
}

async function handleSubscriptionDeleted(event: any) {
  // NOTE - This is a little dodgy as we are bypassing RLS here to update
  // the Subscriptions table on behalf of the user. The challenge is that we don't
  // have any direct way to get a Supabase access token here.
  //
  // The alternative would be to store a long-lived JWT in the subscription
  // metadata, howwver, that carries its own set of risks. For now we just access
  // the database here as the service role and hope that the code below does not
  // have any abuse vectors.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  );

  const deletedSub = event.data.object;
  const subId = deletedSub.id;
  const { data, error } = await supabase.from('Subscriptions').select('*').eq('billingProviderId', subId);
  if (error) {
    throw error;
  }
  if (!data || data.length === 0) {
    console.warn(`Subscription not found for billingProviderId: ${subId}`);
    return NextResponse.json({ ok: true });
  }
  const oldSub = data[0];
  oldSub.state = SubscriptionState.Canceled;
  const { error: updateError } = await supabase.from('Subscriptions').update([oldSub]).eq('billingProviderId', subId);
  if (updateError) {
    throw updateError;
  }
  console.log(`Canceled subscription ${subId}`);
  return NextResponse.json({ ok: true });
}
