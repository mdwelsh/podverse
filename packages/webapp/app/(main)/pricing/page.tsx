import { PurchaseButton } from '@/components/PurchaseButton';
import { PurchaseConfirmation } from '@/components/PurchaseConfirmation';
import { Subscription, Plan, PLANS, SubscriptionState } from 'podverse-utils';
import { SignupOrLogin } from '@/components/SignupOrLogin';
import { auth } from '@clerk/nextjs/server';
import { getCurrentSubscription } from '@/lib/actions';
import { Metadata, ResolvingMetadata } from 'next';

export async function generateMetadata(props: any, parent: ResolvingMetadata): Promise<Metadata> {
  return {
    title: 'Pricing',
  };
}

export default async function Page() {
  const { userId } = auth();
  let existingSubscription = null;
  if (userId) {
    try {
      existingSubscription = await getCurrentSubscription();
    } catch (e) {
      console.error('Error getting current subscription:', e);
    }
  }
  let existingPlan: Plan | undefined = undefined;
  if (existingSubscription) {
    existingPlan = Object.values(PLANS).find((p) => p.id === existingSubscription?.plan) ?? PLANS.free;
  } else if (userId && existingSubscription === null) {
    existingPlan = PLANS.free;
  }

  return (
    <div className="mx-auto mt-8 flex w-3/5 flex-col gap-4 md:w-4/5 xl:w-3/5">
      <PurchaseConfirmation />
      <div className="text-primary font-mono text-lg">Pricing and Plans</div>
      <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-4">
        {Object.entries(PLANS)
          .filter(([key, plan]) => !plan.hidden)
          .map(([key, plan], index) => (
            <PlanCard key={index} plan={plan} existingPlan={existingPlan} existingSubscription={existingSubscription} />
          ))}
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  existingPlan,
  existingSubscription,
}: {
  plan: Plan;
  existingPlan?: Plan;
  existingSubscription?: Subscription | null;
}) {
  const isCurrent = existingPlan && existingPlan.id === plan.id;
  const endDate =
    existingSubscription && existingSubscription.end_time ? new Date(existingSubscription.end_time) : undefined;
  const cancelPending = existingSubscription && existingSubscription.state === SubscriptionState.CancelPending;

  return (
    <div className={`flex flex-col gap-1 ${isCurrent ? 'text-muted-foreground' : 'text-white'}`}>
      <div className="text-primary mt-2 h-4 text-xs">
        {isCurrent ? (
          <>
            Current plan
            {endDate && (
              <span className="text-muted-foreground text-xs">{` - ${
                cancelPending ? 'cancels' : 'renews on'
              } ${endDate.toLocaleDateString()}`}</span>
            )}
          </>
        ) : null}
      </div>
      <div className={`flex flex-col gap-1 border ${isCurrent ? 'border-primary' : 'border-muted'}`}>
        <div className="bg-secondary flex flex-col gap-0 p-4">
          <div className="font-mono text-2xl">{plan.displayName}</div>
          <div>
            <span className="text-muted-foreground text-xs italic lg:text-base">{plan.description}</span>
          </div>
        </div>
        <div className="bg-muted flex h-[400px] flex-col gap-2 p-4 lg:h-[300px]">
          <div>
            {plan.maxPodcasts && 'Up to '}
            <span className="text-primary font-bold">{plan.maxPodcasts ?? 'Unlimited'}</span> podcast
            {(plan.maxPodcasts ?? 100) > 1 ? 's' : ''}
          </div>
          <div>
            {plan.maxEpisodesPerPodcast && 'Up to '}
            <span className="text-primary font-bold">{plan.maxEpisodesPerPodcast ?? 'Unlimited'}</span> episodes per
            podcast
          </div>
          <div>
            {plan.maxChatSessions && 'Up to '}
            <span className="text-primary font-bold">{plan.maxChatSessions ?? 'Unlimited'}</span> AI chat sessions per
            month
          </div>
          <div className="grow"></div>
          <div className="border-primary mt-4 flex flex-col items-center justify-between gap-2 border-t pt-4 lg:flex-row lg:gap-0">
            <div className="font-mono text-lg">
              <span className="text-primary font-bold">${plan.price}</span> / month
            </div>
            {existingPlan ? (
              <PurchaseButton
                plan={plan}
                existingPlan={existingPlan}
                existingSubscription={existingSubscription || undefined}
              />
            ) : (
              <SignupOrLogin />
            )}
          </div>
          <div className="text-muted-foreground mx-auto h-3 py-2 text-xs lg:mx-0">
            {plan.price > 0 && 'Cancel any time'}
          </div>
        </div>
      </div>
    </div>
  );
}
