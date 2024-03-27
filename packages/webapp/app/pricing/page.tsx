import { Plan, PLANS } from '@/lib/plans';
import { Button } from '@/components/ui/button';
import { PurchaseButton } from '@/components/PurchaseButton';
import { PurchaseConfirmation } from '@/components/PurchaseConfirmation';

export default async function Page() {
  return (
    <div className="mx-auto mt-8 w-2/5 md:w-4/5 xl:w-3/5 flex flex-col gap-4">
      <PurchaseConfirmation />
      <div className="font-mono text-primary text-lg">Pricing and Plans</div>
      <div className="grid md:grid-cols-3 grid-cols-1 gap-12 md:gap-4">
        {Object.entries(PLANS)
          .filter(([key, plan]) => !plan.hidden)
          .map(([key, plan], index) => (
            <PlanCard key={index} plan={plan} />
          ))}
      </div>
    </div>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-secondary flex flex-col gap-0 p-4 border border-primary h-[100px]">
        <div className="font-mono text-2xl">{plan.displayName}</div>
        <div>
          <span className="text-muted-foreground italic text-sm lg:text-base">{plan.description}</span>
        </div>
      </div>
      <div className="bg-muted flex flex-col gap-2 p-4 h-[300px]">
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
        <div className="flex flex-row items-center justify-between mt-4 pt-4 border-t border-primary">
          <div className="font-mono text-xl">
            <span className="text-primary font-bold">${plan.price}</span> / month
          </div>
          {plan.priceId ? (
            <PurchaseButton plan={plan} />
          ) : (
            <Button
              className={plan.price > 0 ? '' : 'border border-primary'}
              variant={plan.price > 0 ? 'default' : 'outline'}
            >
              Select
            </Button>
          )}
        </div>
        <div className="text-xs h-3 text-muted-foreground">{plan.price > 0 && 'Cancel any time'}</div>
      </div>
    </div>
  );
}
