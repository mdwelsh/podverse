import { Dashboard } from '@/components/Dashboard';

export default async function Page({ searchParams }: { searchParams: { [key: string]: string } }) {
  const assigned = searchParams['assigned'];
  return <Dashboard assignedPodcast={assigned} />;
}
