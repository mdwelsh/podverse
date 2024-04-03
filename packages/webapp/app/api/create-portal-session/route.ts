import stripe from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/lib/supabase';

/** Called by the billing page to redirect user to the Stripe billing portal. */
export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const { subscriptionId, redirectUrl } = await req.json();
  if (!subscriptionId || !redirectUrl) {
    return Response.json({ error: 'Bad request' }, { status: 400 });
  }

  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.from('Subscriptions').select('*').eq('billingProviderId', subscriptionId);
  if (error) {
    throw error;
  }
  if (!data || data.length === 0) {
    console.warn(`Subscription not found for billingProviderId: ${subscriptionId}`);
    return NextResponse.json({ ok: true });
  }
  const existingSub = data[0];

  try {
    const subscription = await stripe.subscriptions.retrieve(existingSub.billingProviderId);
    const customerId = subscription.customer as string;
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: redirectUrl,
    });
    if (!portalSession || !portalSession.url) {
      throw new Error('Error creating checkout session');
    }
    return NextResponse.json({ portalSession });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: `Error creating portal session: ${JSON.stringify(err)}` }, { status: 500 });
  }
}
