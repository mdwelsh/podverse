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
  Podcast,
  PodcastWithEpisodes,
  ReadPodcastFeed,
  PodcastWithEpisodesMetadata,
  Ingest,
  UpdateSpeakerMap,
  Search,
  SearchResult,
  GetPodcastSuggestions,
  GetPodcastWithEpisodes,
  GetEpisodeWithPodcastBySlug,
} from 'podverse-utils';
import { Usage } from '@/lib/plans';
import { getSupabaseClient, getSupabaseClientWithToken } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { inngest } from '@/inngest/client';
import { GetUsage } from '@/lib/plans';
import { ReportIssueTemplate } from '@/components/EmailTemplates';
import { Resend } from 'resend';

/** Get the given podcast. */
export async function getPodcast(podcastId: string): Promise<Podcast> {
  const supabase = await getSupabaseClient();
  return GetPodcastByID(supabase, podcastId);
}

/** Get the given podcast and episodes. */
export async function getPodcastWithEpisodes(slug: string): Promise<PodcastWithEpisodes> {
  const supabase = await getSupabaseClient();
  return GetPodcastWithEpisodes(supabase, slug);
}

/** Get the given episode and podcast metadata. */
export async function getEpisodeWithPodcast(podcastSlug: string, episodeSlug: string): Promise<EpisodeWithPodcast> {
  const supabase = await getSupabaseClient();
  return GetEpisodeWithPodcastBySlug(supabase, podcastSlug, episodeSlug);
}

/** Get suggested queries for the given podcast. */
export async function getPodcastSuggestions(podcastId: number): Promise<string[]> {
  const supabase = await getSupabaseClient();
  return await GetPodcastSuggestions(supabase, podcastId);
}

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

/** Update the speaker map for the given episode. */
export async function updateSpeaker(episodeId: number, speaker: string, name: string): Promise<void> {
  console.log(`Updating speaker map for episode ${episodeId}: speaker=${speaker}, name=${name}`);
  const { userId } = auth();
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

/** Perform a full-text search. */
export async function search(query: string): Promise<SearchResult[]> {
  const supabase = await getSupabaseClient();
  return Search({ supabase, input: query, includeVector: false });
}

/** Send a report issue email. */
export async function reportIssue(email: string, issue: string): Promise<string> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: 'Ziggy Labs Help <help@ziggylabs.ai>',
    to: ['matt@ziggylabs.ai'],
    subject: 'Issue reported by Podverse user',
    react: ReportIssueTemplate({ email, issue }),
  });
  if (error) {
    console.error('Error sending email', error);
    throw error;
  }
  return JSON.stringify(data);
}

export type PodcastStat = {
  id: number;
  title: string;
  description: string;
  slug: string;
  owner: string;
  imageUrl: string;
  newest: string;
  newestprocessed: string;
  allepisodes: number;
  processed: number;
  inprogress: number;
  errors: number;
};

export async function getPodcastStats(): Promise<PodcastStat[]> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.rpc("podcast_stats");
  if (error) {
    throw error;
  }
  return data;
}