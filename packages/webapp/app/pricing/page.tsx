import { Plan, PLANS, SubscriptionState } from '@/lib/plans';
import { PurchaseButton } from '@/components/PurchaseButton';
import { PurchaseConfirmation } from '@/components/PurchaseConfirmation';
import { getSupabaseClient } from '@/lib/supabase';
import { GetSubscriptions, Subscription } from 'podverse-utils';
import { auth } from '@clerk/nextjs/server';
import { SignupOrLogin } from '@/components/SignupOrLogin';

/** Returns the user's existing subscription, null if user is logged in but has no sub, and
 * undefined if the user is not logged in.
 */
async function currentSubscription(): Promise<Subscription | null | undefined> {
  const { userId } = auth();
  const supabase = await getSupabaseClient();
  if (!userId) {
    return undefined;
  }
  try {
    let existingSubscriptions = (await GetSubscriptions(supabase, userId)).filter(
      (s) => s.state === SubscriptionState.Active || s.state === SubscriptionState.CancelPending,
    );
    if (existingSubscriptions.length > 1) {
      // Not clear what to do if we have multiple subs. Seems like we could have a state where
      // the user bought a plan, canceled it, bought another plan, canceled it, etc. For now we
      // just return the first one.
      existingSubscriptions = existingSubscriptions.filter((s) => s.state === SubscriptionState.Active);
    }
    if (existingSubscriptions.length >= 1) {
      return existingSubscriptions[0];
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error determining existing sub:', error);
  }
}

export default async function Page() {
  const existingSubscription = await currentSubscription();
  let existingPlan: Plan | undefined = undefined;
  if (existingSubscription) {
    existingPlan = Object.values(PLANS).find((p) => p.id === existingSubscription?.plan) ?? PLANS.free;
  } else if (existingSubscription === null) {
    existingPlan = PLANS.free;
  }

  return (
    <div className="mx-auto mt-8 w-2/5 md:w-4/5 xl:w-3/5 flex flex-col gap-4">
      <PurchaseConfirmation />
      <div className="font-mono text-primary text-lg">Pricing and Plans</div>
      <div className="grid md:grid-cols-3 grid-cols-1 gap-12 md:gap-4">
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
  existingPlan: Plan;
  existingSubscription?: Subscription;
}) {
  const isCurrent = existingPlan && existingPlan.id === plan.id;
  const endDate =
    existingSubscription && existingSubscription.end_time ? new Date(existingSubscription.end_time) : undefined;
  const cancelPending = existingSubscription && existingSubscription.state === SubscriptionState.CancelPending;

  return (
    <div className={`flex flex-col gap-1 ${isCurrent ? 'text-muted-foreground' : 'text-white'}`}>
      <div className="text-primary text-xs mt-2 h-4">
        {isCurrent ? (
          <>
            Current plan
            {endDate && (
              <span className="text-muted-foreground text-xs">{` - ${cancelPending ? 'cancels' : 'renews on'} ${endDate.toLocaleDateString()}`}</span>
            )}
          </>
        ) : null}
      </div>
      <div className={`flex flex-col gap-1 border ${isCurrent ? 'border-primary' : 'border-muted'}`}>
        <div className="bg-secondary flex flex-col gap-0 p-4">
          <div className="font-mono text-2xl">{plan.displayName}</div>
          <div>
            <span className="text-muted-foreground italic text-xs lg:text-base">{plan.description}</span>
          </div>
        </div>
        <div className="bg-muted flex flex-col gap-2 p-4 h-[400px] lg:h-[300px]">
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
          <div className="flex-grow"></div>
          <div className="flex flex-col gap-2 lg:gap-0 lg:flex-row items-center justify-between mt-4 pt-4 border-t border-primary">
            <div className="font-mono text-lg">
              <span className="text-primary font-bold">${plan.price}</span> / month
            </div>
            {existingPlan ? (
              <PurchaseButton plan={plan} existingPlan={existingPlan} existingSubscription={existingSubscription} />
            ) : (
              <SignupOrLogin />
            )}
          </div>
          <div className="py-2 mx-auto lg:mx-0 text-xs h-3 text-muted-foreground">
            {plan.price > 0 && 'Cancel any time'}
          </div>
        </div>
      </div>
    </div>
  );
}
