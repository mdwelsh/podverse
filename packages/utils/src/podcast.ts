import { SupabaseClient } from '@supabase/supabase-js';
import { Episode, EpisodeMetadata, PodcastWithEpisodes, PodcastWithEpisodesMetadata } from './types.js';
import { SetPodcast, SetEpisodes, GetPodcastWithEpisodes } from './storage.js';
import slug from 'slug';
import Parser from 'rss-parser';

export type EpisodeMeta = Omit<Episode, 'id'>;

/** Merge the two episode entries. */
function UpdateEpisode(oldEpisode: Episode, newEpisode: EpisodeMetadata): Episode {
  return {
    ...oldEpisode,
    // Only the metadata here will be updated.
    ...newEpisode,
  };
}

/** Read the given RSS feed URL and return it as a PodcastWithEpisodes object. */
export async function ReadPodcastFeed(podcastUrl: string, podcastSlug?: string): Promise<PodcastWithEpisodesMetadata> {
  // First, chase redirects to get the real URL.
  console.log(`Reading RSS feed: ${podcastUrl}`);
  const response = await fetch(podcastUrl, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`Error fetching podcast: ${response.status} ${response.statusText}`);
  }
  const finalUrl = response.url;
  console.log(`Final URL: ${finalUrl}`);

  // Read the RSS feed metadata.
  const parser = new Parser();
  const feed = await parser.parseURL(finalUrl);
  if (!feed.title) {
    throw new Error('No title found for podcast.');
  }
  const titleSlug = podcastSlug ?? slug(feed.title!.trim().slice(0, 25));
  const episodes: EpisodeMetadata[] = feed.items.slice(0, 10).map((entry) => {
    return {
      // This field should be populated in RSS feeds used by Apple Podcasts,
      // at least, but we have a fallback in case it is not.
      guid: entry.guid || entry.link || entry.audioUrl || null,
      slug: slug(entry.title ?? 'Untitled'),
      title: entry.title ?? 'Untitled',
      description:
        (entry.itunes?.summary ??
          entry.itunes?.subtitle ??
          entry.contentSnippet ??
          entry.content ??
          entry.description) ||
        null,
      url: entry.link || null,
      imageUrl: entry.itunes?.image || null,
      pubDate: entry.pubDate || null,
      originalAudioUrl: entry.enclosure?.url || null,
    };
  });

  const newPodcast: PodcastWithEpisodesMetadata = {
    slug: titleSlug,
    title: feed.title,
    description: feed.description || null,
    url: feed.link || null,
    rssUrl: podcastUrl,
    imageUrl: feed.image?.url ?? feed.itunes?.image ?? null,
    author: feed.itunes?.author || null,
    copyright: feed.copyright || null,
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

  // If we're doing a refresh, we need to merge the newly-read RSS feed data
  // with the existing episodes, and update existing episodes in case the RSS
  // feed has changed.
  if (oldPodcast && refresh) {
    console.log(`Refreshing podcast: ${oldPodcast.slug}`);

    // Get set of new episodes not present in our database.
    const newEpisodes: EpisodeMetadata[] = newPodcast.Episodes.filter((episode) => {
      return !oldPodcast?.Episodes?.some((oldEpisode) => {
        return oldEpisode.guid === episode.guid;
      });
    });
    // Get set of episodes that we need to update.
    const updatedEpisodes: EpisodeMetadata[] = newPodcast.Episodes.filter((episode) => {
      return oldPodcast?.Episodes?.some((oldEpisode) => {
        return oldEpisode.guid === episode.guid;
      });
    });
    // Get set of episodes that we need to delete.
    const deletedEpisodes: Episode[] = oldPodcast?.Episodes?.filter((oldEpisode) => {
      return !newPodcast.Episodes.some((episode) => {
        return oldEpisode.guid === episode.guid;
      });
    });
    console.log(
      `Found ${newEpisodes.length} new episodes, ${updatedEpisodes.length} updated episodes, and ${deletedEpisodes.length} deleted episodes.`,
    );

    for (const episode of deletedEpisodes) {
      console.log(`Deleting episode ${episode.id}`);
      const { error } = await supabase.from('Episodes').delete().eq('id', episode.id);
      if (error) {
        console.error('Error deleting episode: ', error);
        throw error;
      }
    }

    // Insert new episodes.
    try {
      await SetEpisodes(
        supabase,
        newEpisodes.map((episode) => {
          return { ...episode, podcast: oldPodcast!.id };
        }),
      );
    } catch (err) {
      console.error('Error inserting new episodes:', err);
      throw err;
    }

    // Update existing episodes.
    for (const episode of updatedEpisodes) {
      const oldEpisode = oldPodcast?.Episodes?.find((oldEpisode) => {
        return oldEpisode.guid === episode.guid;
      });
      if (oldEpisode) {
        const mergedEpisode = UpdateEpisode(oldEpisode, episode);
        const { error } = await supabase.from('Episodes').upsert(mergedEpisode);
        if (error) {
          console.error('Error updating episode: ', error);
          throw error;
        }
      }
    }

    // Update podcast metadata.
    const { Episodes, ...podcastMetadata } = newPodcast;
    const { error } = await supabase.from('Podcasts').update(podcastMetadata).eq('id', oldPodcast.id);
    if (error) {
      console.error('Error updating podcast metadata: ', error);
      throw error;
    }

  } else {
    // The easy case is that we're just creating a new podcast.
    const { Episodes, ...podcastMetadata } = newPodcast;
    const podcast = await SetPodcast(supabase, podcastMetadata);
    const podcastId = podcast.id;
    console.log('Created podcast:', podcast);
    await SetEpisodes(
      supabase,
      newPodcast.Episodes.map((episode) => {
        return { ...episode, podcast: podcastId };
      }),
    );
  }
  console.log(`Ingested podcast ${newPodcast.slug} with ${newPodcast.Episodes.length} episodes`);
  return await GetPodcastWithEpisodes(supabase, slug || newPodcast.slug);
}
