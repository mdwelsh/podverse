/** This module has functions for accessing tables in Supabase. */

import { User, Podcast, Episode, EpisodeWithPodcast, PodcastWithEpisodes, Speakers } from './types.js';
import { SupabaseClient } from '@supabase/supabase-js';

/** Return the User with the given ID. */
export async function GetUser(supabase: SupabaseClient, userId: string): Promise<User> {
  const { data, error } = await supabase.from('Users').select('*').eq('id', userId).limit(1);
  if (error) {
    console.error('error', error);
    throw error;
  }
  return data[0];
}

/** Return list of Podcasts. */
export async function GetPodcasts(supabase: SupabaseClient): Promise<Podcast[]> {
  const { data, error } = await supabase.from('Podcasts').select('*');
  if (error) {
    console.error('error', error);
    throw error;
  }
  return data;
}

/** Return podcasts with episodes. */
export async function GetPodcastWithEpisodes(supabase: SupabaseClient, slug: string): Promise<PodcastWithEpisodes> {
  const { data, error } = await supabase.from('Podcasts').select('*, Episodes (*)').eq('slug', slug).limit(1);
  if (error) {
    console.error('error', error);
    throw error;
  }
  if (!data || data.length === 0) {
    throw new Error(`Podcast with slug ${slug} not found.`);
  }
  const podcast = data[0];
  // Sort the podcast.Episodes list by pubDate.
  podcast.Episodes?.sort((a: Episode, b: Episode) => ((a.pubDate || 0) > (b.pubDate || 0) ? -1 : 1));
  return podcast;
}

/** This is the return value of GetLatestEpisodes. */
export type LatestEpisode = Omit<Episode, 'podcast'> & { podcast: { slug: string; title: string } };

/** Return latest episodes. */
export async function GetLatestEpisodes(supabase: SupabaseClient, limit: number = 8): Promise<LatestEpisode[]> {
  const { data, error } = await supabase
    .from('Episodes')
    .select('*, podcast ( slug, title )')
    .order('pubDate', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('error', error);
    throw error;
  }
  return data;
}

/** Return list of Episodes with corresponding Podcast info. */
export async function GetEpisodesWithPodcast(supabase: SupabaseClient): Promise<EpisodeWithPodcast[]> {
  const { data, error } = await supabase.from('Episodes').select('*, podcast (*)');
  if (error) {
    console.error('error', error);
    throw error;
  }
  return data;
}

/** Return metadata for the given episode. */
export async function GetEpisode(supabase: SupabaseClient, episodeId: number): Promise<Episode> {
  const { data, error } = await supabase.from('Episodes').select('*').eq('id', episodeId).limit(1);
  if (error) {
    console.error('error', error);
    throw error;
  }
  if (!data || data.length === 0) {
    throw new Error(`Episode with ID ${episodeId} not found.`);
  }
  return data[0];
}

/** Return the speaker map for the given episode. */
export async function GetSpeakerMap(supabase: SupabaseClient, episodeId: number): Promise<Speakers> {
  const { data, error } = await supabase.from('SpeakerMap').select('*').eq('episode', episodeId);
  if (error) {
    console.error('error', error);
    throw error;
  }
  const speakers: Speakers = {};
  for (const row of data) {
    speakers[row.speakerId] = row.name;
  }
  return speakers;
}

/** Create or update the given speaker map entry. */
export async function UpdateSpeakerMap(
  supabase: SupabaseClient,
  episodeId: number,
  speakerId: string,
  speakerName: string,
  force: boolean = false,
) {
  const entry = { episode: episodeId, speakerId, name: speakerName };
  if (!force) {
    const { data: existing, error } = await supabase
      .from('SpeakerMap')
      .select('*')
      .eq('episode', episodeId)
      .eq('speakerId', speakerId);
    if (error) {
      console.error('error', error);
      throw error;
    }
    if (existing && existing.length > 0) {
      return;
    }
  }
  const { error } = await supabase
    .from('SpeakerMap')
    .upsert(entry, { onConflict: 'episode,speakerId', ignoreDuplicates: false })
    .eq('episode', episodeId);
  if (error) {
    throw error;
  }
  return;
}

/** Return metadata for the given episode. */
export async function GetEpisodeWithPodcast(supabase: SupabaseClient, episodeId: number): Promise<EpisodeWithPodcast> {
  const { data, error } = await supabase.from('Episodes').select('*, podcast (*)').eq('id', episodeId).limit(1);
  if (error) {
    console.error('error', error);
    throw error;
  }
  if (!data || data.length === 0) {
    throw new Error(`Episode with ID ${episodeId} not found.`);
  }
  return {
    ...data[0],
    speakers: await GetSpeakerMap(supabase, episodeId),
  };
}

/** Return metadata for the given episode. */
export async function GetEpisodeWithPodcastBySlug(
  supabase: SupabaseClient,
  podcastSlug: string,
  episodeSlug: string,
): Promise<EpisodeWithPodcast> {
  const { data, error } = await supabase
    .from('Episodes')
    .select('*, podcast (*)')
    .eq('podcast.slug', podcastSlug)
    .eq('slug', episodeSlug)
    .limit(1);
  if (error) {
    console.error('error', error);
    throw error;
  }
  if (!data || data.length === 0) {
    throw new Error(`Episode with slug ${podcastSlug}/${episodeSlug} not found.`);
  }
  return {
    ...data[0],
    speakers: await GetSpeakerMap(supabase, data[0].id),
  };
}

/** Return metadata for the given podcast. */
export async function GetPodcast(supabase: SupabaseClient, slug: string): Promise<Podcast> {
  const { data, error } = await supabase.from('Podcasts').select('*').eq('slug', slug).limit(1);
  if (error) {
    console.error('error', error);
    throw error;
  }
  if (!data || data.length === 0) {
    throw new Error(`Podcast with slug ${slug} not found.`);
  }
  return data[0];
}

/** Return metadata for the given podcast. */
export async function GetPodcastByID(supabase: SupabaseClient, podcastId: string): Promise<Podcast> {
  const { data, error } = await supabase.from('Podcasts').select('*').eq('id', podcastId).limit(1);
  if (error) {
    console.error('error', error);
    throw error;
  }
  if (!data || data.length === 0) {
    throw new Error(`Podcast with ID ${podcastId} not found.`);
  }
  return data[0];
}

/** Set metadata for the given podcast. */
export async function SetPodcast(supabase: SupabaseClient, podcast: Podcast): Promise<Podcast> {
  // Take podcast and remove the id and created_at fields.
  const { id, created_at, ...podcastData } = podcast;
  const { data, error } = await supabase.from('Podcasts').insert(podcastData).select('*');
  if (error) {
    console.error('Error setting podcast: ', error);
    throw error;
  }
  if (data === null) {
    console.error('Error setting podcast: no data returned');
    throw new Error('No data returned from SetPodcast');
  }
  return data[0];
}

/** Delete the given Podcast. */
export async function DeletePodcast(supabase: SupabaseClient, slug: string) {
  await supabase.from('Podcasts').delete().eq('slug', slug);
}

/** Set metadata for the given episode. */
export async function SetEpisode(supabase: SupabaseClient, episode: Episode): Promise<Episode> {
  const { id, created_at, ...episodeData } = episode;
  const { data, error } = await supabase.from('Episodes').insert(episodeData).select('*');
  if (error) {
    throw error;
  }
  if (data === null) {
    console.error('Error setting episode: no data returned');
    throw new Error('No data returned from SetEpisode');
  }
  return data[0];
}

/** Update the given Episode. */
export async function UpdateEpisode(supabase: SupabaseClient, episode: Episode): Promise<Episode> {
  const { data, error } = await supabase.from('Episodes').update(episode).eq('id', episode.id).select('*');
  if (error) {
    throw error;
  }
  if (data === null) {
    console.error('Error updating episode: no data returned');
    throw new Error('No data returned from UpdateEpisode');
  }
  return data[0];
}

/** Set metadata for a set of Episodes. */
export async function SetEpisodes(supabase: SupabaseClient, episodes: Episode[]) {
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

export async function Upload(
  supabase: SupabaseClient,
  data: string,
  bucket: string,
  fileName: string,
): Promise<string> {
  const buf = Buffer.from(data, 'utf8');
  const { error } = await supabase.storage.from(bucket).upload(fileName, buf, { upsert: true });
  if (error) {
    console.error('error', error);
    throw new Error(`Error uploading ${fileName} to ${bucket}: ${JSON.stringify(error)}`);
  }
  const { data: publicUrlData } = await supabase.storage.from(bucket).getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}
