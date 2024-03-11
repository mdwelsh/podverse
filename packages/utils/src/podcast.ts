import { SupabaseClient } from '@supabase/supabase-js';
import { Episode, PodcastWithEpisodes } from './types.js';
import { SetPodcast, SetEpisodes, GetPodcastWithEpisodes } from './storage.js';
import slug from 'slug';
import Parser from 'rss-parser';

/** Read the given RSS feed URL and return it as a PodcastWithEpisodes object. */
export async function ReadPodcastFeed(podcastUrl: string, podcastSlug?: string): Promise<PodcastWithEpisodes> {
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
      originalAudioUrl: entry.enclosure?.url || null,
      audioUrl: null,
      transcriptUrl: null,
      rawTranscriptUrl: null,
      summaryUrl: null,
      error: null,
      status: null,
      published: false,
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
  const newPodcast = await ReadPodcastFeed(podcastUrl);

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
