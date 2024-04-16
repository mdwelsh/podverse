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
  GetSubscriptions,
  GetEpisodeWithPodcastBySlug,
  Subscription,
  PodcastStat,
  GetPodcastStats,
  PLANS,
} from 'podverse-utils';
import { SubscriptionState } from 'podverse-utils/src/plans';
import { getSupabaseClient, getSupabaseClientWithToken } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { inngest } from '@/inngest/client';
import { ReportIssueTemplate } from '@/components/EmailTemplates';
import { Resend } from 'resend';
import { EpisodeLimit } from '@/lib//limits';

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
      episodeId,
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
export async function processPodcast(podcastId: string, force: boolean, episodeLimit?: number): Promise<string> {
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
      podcastId: podcast.id.toString(),
      force,
      supabaseAccessToken,
      episodeLimit,
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
      podcastId: podcast.id.toString(),
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

/** Return the list of subscriptions for the current user. */
export async function getSubscriptions(): Promise<Subscription[] | null> {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  const supabase = await getSupabaseClient();
  const allsubs = await GetSubscriptions(supabase);
  return allsubs;
}

/** Return the active subscription for the current user, or null if they have no subscription. */
export async function getCurrentSubscription(): Promise<Subscription | null> {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  const supabase = await getSupabaseClient();
  const allsubs = await GetSubscriptions(supabase);
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

/** Return podcast stats. */
export async function getPodcastStats(): Promise<PodcastStat[]> {
  const supabase = await getSupabaseClient();
  return await GetPodcastStats(supabase);
}

export async function getEpisodeLimit(podcastId: number): Promise<EpisodeLimit | null> {
  const { userId } = auth();
  if (!userId) {
    return null;
  }
  const stats = await getPodcastStats();
  const sub = await getCurrentSubscription();
  let plan = PLANS.free;
  if (sub) {
    plan = PLANS[sub.plan];
  }
  const stat = stats.find((p) => p.id === podcastId);
  if (!stat) {
    throw new Error(`No stats found for podcast ${podcastId}`);
  }
  if (stat.owner !== userId) {
    return null;
  }
  const total = stat?.allepisodes || 0;
  const processed = stat?.processed || 0;
  const unprocessed = total - processed;
  const leftOnPlan = plan.maxEpisodesPerPodcast ? Math.max(0, plan.maxEpisodesPerPodcast - processed) : Infinity;
  const numToProcess = Math.min(unprocessed, leftOnPlan);

  return {
    totalEpisodes: total,
    processedEpisodes: processed,
    unprocessedEpisodes: unprocessed,
    maxEpisodesPerPodcast: plan.maxEpisodesPerPodcast || Infinity,
    leftOnPlan,
    numToProcess,
  };
}
