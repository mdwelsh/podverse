import { PodcastList } from '@/components/PodcastList';

export async function ExplorePodcasts() {
  return (
    <div className="mx-auto mt-8 flex w-full flex-col gap-4 px-4">
      <div className="flex w-full flex-row justify-between">
        <div className="text-primary font-mono text-lg">Featured podcasts</div>
      </div>
      <PodcastList />
    </div>
  );
}
