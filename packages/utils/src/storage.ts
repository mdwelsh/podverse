/** This module has functions for accessing tables in Supabase. */

import {
  Podcast,
  Episode,
  EpisodeMetadata,
  EpisodeWithPodcast,
  PodcastWithEpisodes,
  Speakers,
  PodcastMetadata,
  Subscription,
  User,
} from './types.js';
import { PodcastStat, SubscriptionState } from './plans.js';
import { SupabaseClient } from '@supabase/supabase-js';
import { Upload as TusUpload } from 'tus-js-client';
import { Readable } from 'stream';

/** User ********************************************************************************/

/** Get the user with the given ID. */
export async function GetUser(supabase: SupabaseClient, userId: string): Promise<User> {
  const { data, error } = await supabase.from('Users').select('*').eq('id', userId).limit(1);
  if (error) {
    console.error('error', error);
    throw error;
  }
  return data[0];
}

/** Podcasts ********************************************************************************/

/** Return type of GetPodcasts. */
export type PodcastListEntry = Podcast & { newestEpisode: string };

/** Return list of Podcasts. */
export async function GetPodcasts(supabase: SupabaseClient, limit?: number): Promise<PodcastListEntry[]> {
  const { data, error } = await supabase.rpc('all_podcasts', { limit: limit || 100 });
  if (error) {
    console.error('error', error);
    throw error;
  }
  return data;
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
export async function SetPodcast(supabase: SupabaseClient, podcast: Podcast | PodcastMetadata): Promise<Podcast> {
  const { data, error } = await supabase.from('Podcasts').insert(podcast).select('*');
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
  console.log(`Deleting podcast: ${slug}`);

  // First, delete all storage objects associated with this podcast.
  const podcast = await GetPodcastWithEpisodes(supabase, slug);

  console.log('Deleting audio files...');
  await supabase.storage.from('audio').remove(
    podcast.Episodes.map((episode) => {
      if (episode.audioUrl) {
        const parts = episode.audioUrl.split('/');
        return parts.slice(parts.length - 3).join('/');
      } else {
        return '';
      }
    }).filter((x) => x !== ''),
  );

  console.log('Deleting transcript files...');
  await supabase.storage.from('transcripts').remove(
    podcast.Episodes.map((episode) => {
      if (episode.transcriptUrl) {
        const parts = episode.transcriptUrl.split('/');
        return parts.slice(parts.length - 3).join('/');
      } else {
        return '';
      }
    }).filter((x) => x !== ''),
  );

  console.log('Deleting raw transcript files...');
  await supabase.storage.from('transcripts').remove(
    podcast.Episodes.map((episode) => {
      if (episode.rawTranscriptUrl) {
        const parts = episode.rawTranscriptUrl.split('/');
        return parts.slice(parts.length - 3).join('/');
      } else {
        return '';
      }
    }).filter((x) => x !== ''),
  );

  console.log('Deleting summary files...');
  await supabase.storage.from('summaries').remove(
    podcast.Episodes.map((episode) => {
      if (episode.summaryUrl) {
        const parts = episode.summaryUrl.split('/');
        return parts.slice(parts.length - 3).join('/');
      } else {
        return '';
      }
    }).filter((x) => x !== ''),
  );

  // Finally delete the Podcast entry itself. This should lead to a cascading deletion
  // of all of its Episodes and other table entries.
  const { error } = await supabase.from('Podcasts').delete().eq('id', podcast.id);
  if (error) {
    console.error('Error deleting podcast: ', error);
    throw error;
  }
  console.log(`Finished deleting podcast: ${slug}`);
}

/** Return the given podcast with episodes. */
export async function GetPodcastWithEpisodes(supabase: SupabaseClient, slug: string): Promise<PodcastWithEpisodes> {
  const { data, error } = await supabase
    .from('Podcasts')
    .select('*, Episodes (*)')
    .eq('slug', slug)
    .order('pubDate', { referencedTable: 'Episodes', ascending: false })
    .limit(1);
  if (error) {
    console.error('error', error);
    throw error;
  }
  if (!data || data.length === 0) {
    throw new Error(`Podcast with slug ${slug} not found.`);
  }
  const podcast = data[0];
  return {
    ...podcast,
    suggestions: await GetPodcastSuggestions(supabase, podcast.id),
  };
}

/** Return podcasts with episodes by podcast ID. */
export async function GetPodcastWithEpisodesByID(
  supabase: SupabaseClient,
  podcastId: string,
): Promise<PodcastWithEpisodes> {
  const { data, error } = await supabase
    .from('Podcasts')
    .select('*, Episodes (*)')
    .eq('id', podcastId)
    .order('pubDate', { referencedTable: 'Episodes', ascending: false })
    .limit(1);
  if (error) {
    console.error('error', error);
    throw error;
  }
  if (!data || data.length === 0) {
    throw new Error(`Podcast with ID ${podcastId} not found.`);
  }
  const podcast = data[0];
  return {
    ...podcast,
    suggestions: await GetPodcastSuggestions(supabase, podcast.id),
  };
}

/** Episodes **************************************************************************/

/** This is the return value of GetLatestEpisodes. */
export type LatestEpisode = Omit<Episode, 'podcast'> & { podcast: { slug: string; title: string; imageUrl?: string } };

/** Return latest episodes. */
export async function GetLatestEpisodes({
  supabase,
  limit = 10,
}: {
  supabase: SupabaseClient;
  limit?: number;
}): Promise<LatestEpisode[]> {
  const { data, error } = await supabase.rpc('latest_episodes', { limit });
  if (error) {
    console.error('error', error);
    throw error;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((e: any) => {
    return {
      ...e,
      podcast: {
        slug: e.podcastSlug,
        title: e.podcastTitle,
        imageUrl: e.podcastImageUrl,
      },
    };
  });
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
    suggestions: await GetSuggestions(supabase, episodeId),
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
    suggestions: await GetSuggestions(supabase, data[0].id),
  };
}

/** Set metadata for the given episode. */
export async function SetEpisode(supabase: SupabaseClient, episode: Episode): Promise<Episode> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
export async function UpdateEpisode(supabase: SupabaseClient, episode: Episode | EpisodeWithPodcast): Promise<Episode> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { podcast, speakers, ...episodeData } = episode as EpisodeWithPodcast;
  const { data, error } = await supabase.from('Episodes').update(episodeData).eq('id', episode.id).select('*');
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
export async function SetEpisodes(supabase: SupabaseClient, episodes: Episode[] | EpisodeMetadata[]) {
  const { error } = await supabase.from('Episodes').upsert(
    episodes.map((e) => {
      const { id, created_at, ...episodeData } = e;
      return episodeData;
    }),
    { onConflict: 'guid', ignoreDuplicates: false },
  );
  if (error) {
    throw error;
  }
}

/** Suggestions ***************************************************************************/

/** Return suggested queries for the given episode. */
export async function GetSuggestions(supabase: SupabaseClient, episodeId: number): Promise<string[]> {
  const { data, error } = await supabase.from('Suggestions').select('suggestion').eq('episode', episodeId);
  if (error) {
    console.error('error', error);
    throw error;
  }
  const result = data.map((row) => row.suggestion);
  return result;
}

/** Return suggested queries for the given podcast. */
export async function GetPodcastSuggestions(supabase: SupabaseClient, podcastId: number): Promise<string[]> {
  const { data, error } = await supabase
    .from('Suggestions')
    .select('suggestion, Episodes!inner(podcast)')
    .eq('Episodes.podcast', podcastId);
  if (error) {
    console.error('error', error);
    throw error;
  }
  const result = data.map((row) => row.suggestion);
  return result;
}

/** Delete all suggestions for the given episode. */
export async function DeleteSuggestions(supabase: SupabaseClient, episodeId: number) {
  const { error } = await supabase.from('Suggestions').delete().eq('episode', episodeId);
  if (error) {
    throw error;
  }
}

/** Add a suggestion. */
export async function AddSuggestion(supabase: SupabaseClient, episodeId: number, suggestion: string) {
  const entry = { episode: episodeId, suggestion };
  const { error } = await supabase.from('Suggestions').insert(entry).eq('episode', episodeId);
  if (error) {
    throw error;
  }
  return;
}

/** Speaker map **********************************************************************/

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

/** File storage ***************************************************************************/

/** Use to upload a small file. */
export async function Upload(
  supabase: SupabaseClient,
  data: string | Blob,
  bucket: string,
  fileName: string,
): Promise<string> {
  const toUpload = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  const { error } = await supabase.storage.from(bucket).upload(fileName, toUpload, { upsert: true });
  if (error) {
    console.error('error', error);
    throw new Error(`Error uploading ${fileName} to ${bucket}: ${JSON.stringify(error)}`);
  }
  const { data: publicUrlData } = await supabase.storage.from(bucket).getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}

/** Use to upload a large file. Calls the Supabase TUS endpoint directly. */
export async function UploadLargeFile(
  supabase: SupabaseClient,
  supabaseToken: string,
  data: Readable,
  contentType: string,
  bucket: string,
  fileName: string,
): Promise<string> {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL environment variable.');
  }
  return new Promise((resolve, reject) => {
    console.log(`Uploading ${fileName} to ${bucket}...`);
    const upload = new TusUpload(data, {
      endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${supabaseToken}`,
        'x-upsert': 'true',
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: bucket,
        objectName: fileName,
        contentType,
        cacheControl: '3600',
      },
      chunkSize: 6 * 1024 * 1024, // NOTE: it must be set to 6MB (for now) do not change it
      onError: function (error) {
        console.error('Error uploading file: ' + error);
        reject(error);
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
        console.log(`Uploaded ${bytesUploaded}/${bytesTotal} (${percentage}%)`);
      },
      onSuccess: function () {
        console.log(`Upload complete: ${upload.url}`);
        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
        console.log(`Public URL: ${publicUrlData.publicUrl}`);
        resolve(publicUrlData.publicUrl || '');
      },
    });

    // Check if there are any previous uploads to continue.
    return upload.findPreviousUploads().then(function (previousUploads) {
      // Found previous uploads so we select the first one.
      if (previousUploads.length) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }
      // Start the upload
      upload.start();
    });
  });
}

/** Subscriptions ***************************************************************************/

/** Get subscriptions for the given user. */
export async function GetSubscriptions(supabase: SupabaseClient, userId: string): Promise<Subscription[]> {
  const { data, error } = await supabase.from('Subscriptions').select('*').eq('user', userId);
  if (error) {
    console.error('error', error);
    throw error;
  }
  return data;
}

/** Return the active subscription for the given user, or null if they have no subscription. */
export async function GetCurrentSubscription(supabase: SupabaseClient, userId: string): Promise<Subscription | null> {
  const allsubs = await GetSubscriptions(supabase, userId);
  // First check for an active sub.
  const activeSubs = allsubs.filter((s) => s.state === SubscriptionState.Active);
  if (activeSubs.length > 0) {
    return activeSubs[0];
  }
  // Next check for a cancel pending sub.
  const canceledSubs = allsubs.filter((s) => s.state === SubscriptionState.CancelPending);
  if (canceledSubs.length > 0) {
    return canceledSubs[0];
  }
  // Otherwise the user is on the free plan.
  return null;
}

/** Return podcast stats. */
export async function GetPodcastStats(supabase: SupabaseClient): Promise<PodcastStat[]> {
  const { data, error } = await supabase.rpc('podcast_stats');
  if (error) {
    throw error;
  }
  return data;
};
