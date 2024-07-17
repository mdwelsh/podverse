import { getSupabaseClient } from '@/lib/supabase';
import { EpisodeWithPodcast, GetEpisodeWithPodcastBySlug, isReady } from 'podverse-utils';
import { EpisodeClient } from '@/components/EpisodeClient';
import { PodcastLinkHeader } from '@/components/PodcastLinkHeader';
import { EpisodeHeader } from '@/components/EpisodeHeader';
import { PoweredBy } from '../PoweredBy';

export async function EpisodeSummary({ episode, embed }: { episode: EpisodeWithPodcast; embed?: boolean }) {
  if (episode.summaryUrl === null) {
    return embed ? (
      <div>Summary not available</div>
    ) : (
      <div className="flex w-full flex-col gap-2">
        <div>
          <h1>Summary</h1>
        </div>
        <div className="flex size-full flex-col gap-2 overflow-y-auto border p-4 text-xs">
          <div className="text-muted-foreground text-sm">Summary not available</div>
        </div>
      </div>
    );
  }

  const res = await fetch(episode.summaryUrl);
  const result = await res.text();
  return embed ? (
    <div className="p-4 flex flex-col gap-6">
      <div className="text-sm">{result}</div>
      <PoweredBy />
    </div>
  ) : (
    <div className="flex w-full flex-col gap-2">
      {!embed && (
        <div>
          <h1>Summary</h1>
        </div>
      )}
      <div className="w-full overflow-y-auto border p-4 font-[Inter] text-sm">{result}</div>
    </div>
  );
}

export async function EpisodeDetail({
  podcastSlug,
  episodeSlug,
  uuid,
  activationCode,
}: {
  podcastSlug: string;
  episodeSlug: string;
  uuid?: string;
  activationCode?: string;
}) {
  const supabase = await getSupabaseClient();
  const episode = await GetEpisodeWithPodcastBySlug(supabase, podcastSlug, episodeSlug);
  try {
    if (episode.podcast.private && episode.podcast.uuid) {
      if (uuid) {
        if (uuid !== episode.podcast.uuid.replace(/-/g, '')) {
          throw new Error('Podcast is private and UUID does not match');
        }
      } else if (activationCode) {
        if (activationCode !== episode.podcast.uuid.replace(/-/g, '')) {
          throw new Error('Podcast is private and activation code does not match');
        }
      } else {
        throw new Error('Podcast is private and no UUID or activation code provided');
      }
    }
  } catch (error) {
    console.error('Error checking private podcast:', error);
    return <div className="mx-auto mt-8 w-11/12 font-mono md:w-4/5">This podcast is private.</div>;
  }

  // Check if there are any Documents for this episode.
  const { data: documents, error } = await supabase.from('Documents').select('id').eq('episode', episode.id);
  if (error) {
    console.error('Error looking up documents for episode:', error);
  }
  const chatAvailable = (documents && documents.length > 0) || false;

  return (
    <>
      <PodcastLinkHeader podcast={episode.podcast} activationCode={activationCode} />
      <div className="mx-auto mt-8 w-full px-2 font-mono md:w-4/5">
        <EpisodeHeader episode={episode} uuid={uuid} showManage />
        {isReady(episode) ? (
          <>
            <EpisodeSummary episode={episode} />
            <EpisodeClient episode={episode} chatAvailable={chatAvailable} />
          </>
        ) : (
          <div className="mt-8">This episode has not yet been processed.</div>
        )}
      </div>
    </>
  );
}
