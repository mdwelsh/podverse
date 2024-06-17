import { Dashboard } from '@/components/Dashboard';
import { Metadata, ResolvingMetadata } from 'next';

export async function generateMetadata(props: any, parent: ResolvingMetadata): Promise<Metadata> {
  return {
    title: 'Dashboard',
  };
}

export default async function Page({ searchParams }: { searchParams: { [key: string]: string } }) {
  const assigned = searchParams['assigned'];
  return <Dashboard assignedPodcast={assigned} />;
}
