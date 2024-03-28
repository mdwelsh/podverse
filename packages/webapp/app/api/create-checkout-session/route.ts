import stripe from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/** Called by the billing page to redirect user to Stripe checkout. */
export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const { priceId, redirectUrl } = await req.json();
  if (!priceId || !redirectUrl) {
    return Response.json({ error: 'Bad request' }, { status: 400 });
  }
  const lineItems = [
    {
      price: priceId,
      quantity: 1,
    },
  ];

  try {
    console.log(`Creating checkout session for ${userId} with price ${priceId}`);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'subscription',
      client_reference_id: userId,
      success_url: redirectUrl + '?success=true',
      cancel_url: redirectUrl + '?canceled=true',
    });
    if (!session || !session.url) {
      throw new Error('Error creating checkout session');
    }
    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ error: `Error creating checkout session: ${JSON.stringify(err)}` }, { status: 500 });
  }
}
