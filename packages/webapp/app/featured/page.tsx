import { ExplorePodcasts } from '@/components/ExplorePodcasts';
import { Metadata, ResolvingMetadata } from 'next';

export async function generateMetadata(props: any, parent: ResolvingMetadata): Promise<Metadata> {
  return {
    title: 'Featured Podcasts',
  };
}

export default async function Page() {
  return <ExplorePodcasts />;
}
