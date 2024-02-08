/** This module has client functions for accessing the podcast KV metadata store. */

import supabase from './supabase.js';
import { Episode, Podcast, PodcastWithEpisodes } from 'podverse-types';

/** Return metadata for the given podcast. */
export async function GetPodcast(slug: string): Promise<Podcast> {
  const { data, error } = await supabase.from('Podcasts').select('*').eq('slug', slug).limit(1);
  if (error) {
    console.log('error', error);
    throw error;
  }
  if (!data) {
    throw new Error(`Podcast with slug ${slug} not found.`);
  }
  return data[0];
}

export async function GetPodcastWithEpisodes(slug: string): Promise<PodcastWithEpisodes> {
  const { data, error } = await supabase.from('Podcasts').select('*, Episodes (*)').eq('slug', slug).limit(1);
  if (error) {
    console.log('error', error);
    throw error;
  }
  if (!data) {
    throw new Error(`Podcast with slug ${slug} not found.`);
  }
  return data[0];
}

/** Set metadata for the given podcast. */
export async function SetPodcast(podcast: Podcast): Promise<Podcast> {
  // Take podcast and remove the id and created_at fields.
  const { id, created_at, ...podcastData } = podcast;
  const { data, error } = await supabase.from('Podcasts').insert(podcastData).select('*');
  if (error) {
    console.log('Error setting podcast: ', error);
    throw error;
  }
  if (data === null) {
    console.log('Error setting podcast: no data returned');
    throw new Error('No data returned from SetPodcast');
  }
  return data[0];
}

export async function DeletePodcast(slug: string) {
  await supabase.from('Podcasts').delete().eq('slug', slug);
}

/** Return a list of all podcast slugs. */
export async function ListPodcasts(): Promise<string[]> {
  const { data, error } = await supabase.from('Podcasts').select('*');
  if (error) {
    console.log('error', error);
    throw error;
  }
  return data.map((p: Podcast) => p.slug);
}

// /** Return metadata for the given episode. */
// export async function GetEpisode(podcastSlug: string, episodeSlug: string): Promise<Episode | undefined> {
//   const podcast = await GetPodcast(podcastSlug);
//   return podcast.episodes?.find((e: Episode) => e.slug === episodeSlug);
// }

/** Set metadata for the given episode. */
export async function SetEpisode(episode: Episode): Promise<Episode> {
  const { id, created_at, ...episodeData } = episode;
  const { data, error } = await supabase.from('Episodes').insert(episodeData).select('*');
  if (error) {
    throw error;
  }
  if (data === null) {
    console.log('Error setting episode: no data returned');
    throw new Error('No data returned from SetEpisode');
  }
  return data[0];
}

export async function SetEpisodes(episodes: Episode[]) {
  const { error } = await supabase.from('Episodes').upsert(
    episodes.map((e) => {
      const { id, created_at, ...episodeData } = e;
      return episodeData;
    }),
  );
  if (error) {
    throw error;
  }
}

// export async function DeleteEpisode(episode: Episode) {
//   const podcast = await GetPodcast(episode.podcastSlug);
//   podcast.episodes = podcast.episodes?.filter((ep: Episode) => ep.slug !== episode.slug);
//   await SetPodcast(podcast);
// }

// /** Return a list of all episodes in this Podcast. */
// export async function ListEpisodes(podcastSlug: string): Promise<string[]> {
//   const podcast = await GetPodcast(podcastSlug);
//   return podcast.episodes?.map((e: Episode) => e.slug) ?? [];
// }
