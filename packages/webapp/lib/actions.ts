/** This module defines Server Actions. */

'use server';

import {
  Episode,
  EpisodeWithPodcast,
  GetEpisodeWithPodcast,
  UpdateEpisode,
  DeletePodcast,
  GetPodcast,
  GetPodcastByID,
  PodcastWithEpisodes,
  ReadPodcastFeed,
  PodcastWithEpisodesMetadata,
  Ingest,
  UpdateSpeakerMap,
} from 'podverse-utils';
import { Usage } from '@/lib/plans';
import { getSupabaseClient, getSupabaseClientWithToken } from '@/lib/supabase';
import { auth } from '@clerk/nextjs';
import { revalidatePath } from 'next/cache';
import { inngest } from '@/inngest/client';
import { GetUsage } from '@/lib/plans';
import { get } from 'http';

/** Update the given episode. */
export async function updateEpisode(episode: Episode | EpisodeWithPodcast): Promise<Episode> {
  console.log(`Updating episode: ${episode.id}`);
  const supabase = await getSupabaseClient();
  revalidatePath('/podcast/[podcastSlug]');
  revalidatePath('/podcast/[podcastSlug]/episode/[episodeSlug]');
  return UpdateEpisode(supabase, episode);
}

/** Kick off processing for the given episode. */
export async function processEpisode(episodeId: string, force: boolean): Promise<string> {
  console.log(`Kicking off processing for episode: ${episodeId}`);
  const { userId, getToken } = auth();

  // We need to get the token here since we're going to pass it to Inngest.
  const supabaseAccessToken = await getToken({ template: 'podverse-supabase' });
  if (!supabaseAccessToken) {
    throw new Error('Unauthorized');
  }

  // Check ownership of episode.
  const supabase = await getSupabaseClientWithToken(supabaseAccessToken);
  const episode = await GetEpisodeWithPodcast(supabase, parseInt(episodeId));
  if (episode.podcast.owner !== userId) {
    throw new Error(`You are not the owner of episode ${episodeId}`);
  }
  await inngest.send({
    name: 'process/episode',
    data: {
      episodeId: parseInt(episodeId),
      force,
      supabaseAccessToken,
    },
  });

  revalidatePath('/podcast/[podcastSlug]');
  revalidatePath('/podcast/[podcastSlug]/episode/[episodeSlug]');
  revalidatePath('/dashboard');
  return `Processing episode ${episodeId}`;
}

/** Kick off processing for the given podcast. */
export async function processPodcast(podcastId: string, force: boolean): Promise<string> {
  console.log(`Kicking off processing for podcast: ${podcastId}`);
  const { userId, getToken } = auth();

  // We need to get the token here since we're going to pass it to Inngest.
  const supabaseAccessToken = await getToken({ template: 'podverse-supabase' });
  if (!supabaseAccessToken) {
    throw new Error('Unauthorized');
  }
  // Check ownership of podcast.
  const supabase = await getSupabaseClientWithToken(supabaseAccessToken);
  const podcast = await GetPodcastByID(supabase, podcastId);
  if (podcast.owner !== userId) {
    throw new Error(`You are not the owner of podcast ${podcastId}`);
  }
  await inngest.send({
    name: 'process/podcast',
    data: {
      podcastId: podcast.id,
      force,
      supabaseAccessToken,
    },
  });
  revalidatePath('/podcast/[podcastSlug]', 'layout');
  revalidatePath('/dashboard');
  return `Processing podcast ${podcastId}`;
}

/** Kick off refresh for the given podcast. */
export async function refreshPodcast(podcastId: string): Promise<string> {
  console.log(`Kicking off refresh for podcast: ${podcastId}`);
  const { userId, getToken } = auth();

  // We need to get the token here since we're going to pass it to Inngest.
  const supabaseAccessToken = await getToken({ template: 'podverse-supabase' });
  if (!supabaseAccessToken) {
    throw new Error('Unauthorized');
  }
  // Check ownership of podcast.
  const supabase = await getSupabaseClientWithToken(supabaseAccessToken);
  const podcast = await GetPodcastByID(supabase, podcastId);
  if (podcast.owner !== userId) {
    throw new Error(`You are not the owner of podcast ${podcastId}`);
  }
  await inngest.send({
    name: 'ingest/podcast',
    data: {
      podcastId: podcast.id,
      supabaseAccessToken,
    },
  });
  revalidatePath('/podcast/[podcastSlug]', 'layout');
  return `Refreshing podcast ${podcastId}`;
}

/** Import the given podcast. */
export async function importPodcast(rssUrl: string): Promise<PodcastWithEpisodes> {
  console.log(`Importing podcast: ${rssUrl}`);
  const supabase = await getSupabaseClient();
  const podcast = await Ingest({ supabase, podcastUrl: rssUrl });
  revalidatePath('/', 'layout');
  revalidatePath('/dashboard');
  return podcast;
}

/** Return usage for the current user. */
export async function getUsage(): Promise<Usage> {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  const supabase = await getSupabaseClient();
  return GetUsage(supabase, userId);
}

/** Delete the given podcast. */
export async function deletePodcast(slug: string): Promise<void> {
  console.log(`Got DELETE for podcast ${slug}`);
  const { userId, getToken } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  const supabaseAccessToken = await getToken({ template: 'podverse-supabase' });
  if (!supabaseAccessToken) {
    throw new Error('Unauthorized');
  }
  const supabase = await getSupabaseClientWithToken(supabaseAccessToken);
  const podcast = await GetPodcast(supabase, slug);
  if (podcast.owner !== userId) {
    throw new Error('Unauthorized');
  }
  await DeletePodcast(supabase, slug);
  revalidatePath('/podcast/[podcastSlug]', 'layout'); // Pick up sub-pages.
  revalidatePath('/dashboard');
}

/** Return the given podcast feed metadata. */
export async function readPodcastFeed(rssUrl: string): Promise<PodcastWithEpisodesMetadata> {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return ReadPodcastFeed(rssUrl);
}

export async function updateSpeaker(episodeId: number, speaker: string, name: string): Promise<void> {
  console.log(`Updating speaker map for episode ${episodeId}: speaker=${speaker}, name=${name}`);
  const { userId, getToken } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  const supabase = await getSupabaseClient();
  const episode = await GetEpisodeWithPodcast(supabase, episodeId);
  if (episode.podcast.owner !== userId) {
    throw new Error('Unauthorized');
  }
  await UpdateSpeakerMap(supabase, episodeId, speaker, name, true);
  console.log(`Finished updating speaker map for episode ${episodeId}: speaker=${speaker}, name=${name}`);
  revalidatePath('/podcast/[podcastSlug]/episode/[episodeSlug]', 'page');
}
