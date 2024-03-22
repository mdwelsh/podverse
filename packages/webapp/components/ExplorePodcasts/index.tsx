import { PodcastList } from '@/components/PodcastList';

export async function ExplorePodcasts() {
  return (
    <div className="mx-auto mt-8 w-3/5 flex flex-col gap-4">
      <div className="w-full flex flex-row justify-between">
        <div className="font-mono text-primary text-lg">Explore podcasts</div>
      </div>
      <PodcastList />
    </div>
  );
}
