import { Plan, PLANS } from '@/lib/plans';

export default async function Page() {
  return (
    <div className="mx-auto mt-8 w-11/12 md:w-4/5 flex flex-col gap-4">
      <div className="font-mono text-primary text-lg">Pricing and Plans</div>
      <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
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
    <div className="flex flex-col gap-0">
      <div className="bg-secondary flex flex-col gap-2 p-4 border border-primary">
        <div className="font-mono">{plan.displayName}</div>
      </div>
      <div className="bg-muted flex flex-col gap-2 p-4 rounded">
        <div className="text-primary font-bold">{plan.maxPodcasts}</div>
      </div>
    </div>
  );
}
