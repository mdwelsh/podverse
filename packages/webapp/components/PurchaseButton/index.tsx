'use client';

import { Plan } from '@/lib/plans';
import { Button } from '@/components/ui/button';
import { loadStripe } from '@stripe/stripe-js';

export function PurchaseButton({ plan, className }: { plan: Plan; className?: string }) {
  const redirectUrl = (process.env.VERCEL_URL || 'http://localhost:3000') + '/pricing';

  const redirectToCheckout = async () => {
    try {
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);
      if (!stripe) throw new Error('Stripe failed to initialize.');

      const checkoutResponse = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId: plan.priceId, redirectUrl }),
      });
      const { sessionId } = await checkoutResponse.json();
      const stripeError = await stripe.redirectToCheckout({ sessionId });
      if (stripeError) {
        console.error(stripeError);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Button className="className" onClick={redirectToCheckout}>
      Upgrade
    </Button>
  );
}
