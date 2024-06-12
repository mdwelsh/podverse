'use client';

import { Button } from '@/components/ui/button';
import { loadStripe } from '@stripe/stripe-js';
import { Plan, Subscription } from 'podverse-utils';

export function PurchaseButton({
  plan,
  existingPlan,
  existingSubscription,
  className,
}: {
  plan: Plan;
  existingPlan: Plan;
  existingSubscription?: Subscription;
  className?: string;
}) {
  const redirectUrl =
    (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000') + '/pricing';
  const isPurchase = !existingSubscription;
  const isExisting = plan.id === existingPlan.id;
  const isFree = isExisting && plan.id === 'free';
  const isUpgrade = plan.id !== existingPlan.id && plan.price > existingPlan.price;

  const onClick = async () => {
    if (isPurchase) {
      return redirectToCheckout();
    } else {
      return redirectToPortal();
    }
  };

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

  const redirectToPortal = async () => {
    if (!existingSubscription) {
      console.error('No existing subscription found.');
      return;
    }
    try {
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);
      if (!stripe) throw new Error('Stripe failed to initialize.');

      const portalResponse = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId: existingSubscription.billingProviderId, redirectUrl }),
      });
      const portalSession = await portalResponse.json();
      console.log(`Got portal session: ${JSON.stringify(portalSession, null, 2)}`);
      window.location.replace(portalSession.url);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Button variant={isUpgrade ? 'default' : 'secondary'} className="className" onClick={onClick} disabled={isFree}>
      {isFree ? 'Current' : isExisting ? 'Manage' : isUpgrade ? 'Upgrade' : 'Downgrade'}
    </Button>
  );
}
