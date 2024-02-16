import { SupabaseClient } from '@supabase/supabase-js';
import { Episode, PodcastWithEpisodes, SetPodcast, SetEpisodes, GetPodcastWithEpisodes } from 'podverse-utils';
import slug from 'slug';
import Parser from 'rss-parser';

// /**
//  * Merge two podcasts. Metadata from newPodcast is preferred, but episodes present in oldPodcast
//  * are retained by keeping existing epiodes from oldPodcast.
//  */
// export function MergePodcasts(oldPodcast: Podcast, newPodcast: Podcast): Podcast {
//   // Retain old corpus ID if one was already set for this podcast, since this does not
//   // come from the RSS feed.
//   if (oldPodcast.corpusId) {
//     newPodcast.corpusId = oldPodcast.corpusId;
//   }
//   newPodcast.episodes = newPodcast.episodes?.map((newEpisode: Episode) => {
//     // If the episode exists in oldPodcast, use that.
//     const oldEpisode = oldPodcast.episodes?.find((episode: Episode) => {
//       return episode.url === newEpisode.url;
//     });
//     if (oldEpisode) {
//       return oldEpisode;
//     } else {
//       return newEpisode;
//     }
//   });
//   return newPodcast;
// }

/** Read the given RSS feed URL and return it as a Podcast object. */
async function readPodcastFeed(podcastUrl: string, podcastSlug?: string): Promise<PodcastWithEpisodes> {
  // Read the RSS feed metadata.
  const parser = new Parser();
  const feed = await parser.parseURL(podcastUrl);
  if (!feed.title) {
    throw new Error('No title found for podcast.');
  }
  const titleSlug = podcastSlug ?? slug(feed.title!.trim().slice(0, 25));
  const episodes: Episode[] = feed.items.map((entry) => {
    return {
      id: 0,
      created_at: '',
      podcast: 0,
      modified_at: null,
      // This field should be populated in RSS feeds used by Apple Podcasts,
      // at least, but we have a fallback in case it is not.
      guid: entry.guid || entry.link || entry.audioUrl || null,
      slug: slug(entry.title ?? 'Untitled'),
      title: entry.title ?? 'Untitled',
      description: entry.description ?? entry.itunes.subtitle,
      url: entry.link || null,
      imageUrl: entry.itunes?.image || null,
      pubDate: entry.pubDate || null,
      audioUrl: entry.enclosure?.url || null,
      transcriptUrl: null,
      rawTranscriptUrl: null,
      summaryUrl: null,
      error: null,
    };
  });

  const newPodcast: PodcastWithEpisodes = {
    id: 0,
    created_at: '',
    owner: null,
    slug: titleSlug,
    title: feed.title,
    description: feed.description || null,
    url: feed.link || null,
    rssUrl: podcastUrl,
    imageUrl: feed.image?.url ?? feed.itunes?.image ?? null,
    Episodes: episodes,
  };
  return newPodcast;
}

/** Ingest a single podcast. If 'refresh' is set, any new episodes will be added. */
export async function Ingest({
  slug,
  supabase,
  podcastUrl,
  refresh,
}: {
  slug?: string;
  supabase: SupabaseClient;
  podcastUrl: string;
  refresh?: boolean;
}): Promise<PodcastWithEpisodes> {
  const newPodcast = await readPodcastFeed(podcastUrl);

  let oldPodcast: PodcastWithEpisodes | undefined;
  try {
    oldPodcast = await GetPodcastWithEpisodes(supabase, slug || newPodcast.slug);
  } catch (err) {
    // Podcast does not exist. Which is fine.
  }
  if (oldPodcast && !refresh) {
    throw new Error('Podcast already exists: ' + oldPodcast.slug);
  }

  // Remove oldPodcast.episodes from allEpisodes if the guid field matches.
  const { Episodes: allEpisodes, ...podcastMeta } = newPodcast;
  const episodes = allEpisodes.filter((episode) => {
    return !oldPodcast?.Episodes?.some((oldEpisode) => {
      return oldEpisode.guid === episode.guid;
    });
  });

  let podcastId: number = 0;
  if (oldPodcast) {
    podcastId = oldPodcast.id;
  } else {
    // Create it and get the ID.
    const finalPodcast = await SetPodcast(supabase, podcastMeta);
    podcastId = finalPodcast.id;
  }
  await SetEpisodes(
    supabase,
    episodes.map((episode) => {
      return { ...episode, podcast: podcastId };
    })
  );
  return await GetPodcastWithEpisodes(supabase, slug || newPodcast.slug);
}
