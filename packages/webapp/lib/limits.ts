import { useEffect, useState } from 'react';
import { PodcastStat, Plan, PLANS } from 'podverse-utils';
import { getCurrentSubscription, getPodcastStats } from '@/lib/actions';
import { useAuth } from '@clerk/nextjs';

export interface PodcastLimit {
  totalPodcasts: number;
  leftOnPlan: number;
}

export function usePodcastLimit(): PodcastLimit | null {
  const [stats, setStats] = useState<PodcastStat[] | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const { userId } = useAuth();

  useEffect(() => {
    if (stats === null) {
      getPodcastStats()
        .then((newStats) => {
          setStats(newStats.filter((p) => p.owner === userId));
        })
        .catch((e) => console.error(e));
    }
    if (plan === null) {
      getCurrentSubscription()
        .then((newSub) => {
          if (!newSub) {
            setPlan(PLANS.free);
          } else {
            setPlan(PLANS[newSub.plan]);
          }
        })
        .catch((e) => console.error(e));
    }
  }, [stats, plan, userId]);

  if (!stats || !plan) {
    return null;
  }

  const total = stats.length;
  const leftOnPlan = plan.maxPodcasts !== undefined ? Math.max(0, plan.maxPodcasts - total) : Infinity;

  return {
    totalPodcasts: total,
    leftOnPlan,
  };
}

/** The return value of useEpisodeLimit. */
export interface EpisodeLimit {
  plan: Plan;
  totalEpisodes: number;
  processedEpisodes: number;
  unprocessedEpisodes: number;
  maxEpisodesPerPodcast: number;
  leftOnPlan: number;
  numToProcess: number;
}

/** Returns the state of the user's ability to process episodes for the given podcast. */
export function useEpisodeLimit(podcastId: number): EpisodeLimit | null {
  const [stats, setStats] = useState<PodcastStat[] | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);

  useEffect(() => {
    if (!stats) {
      getPodcastStats()
        .then((newStats) => {
          setStats(newStats);
        })
        .catch((e) => console.error(e));
    }
    if (!plan) {
      getCurrentSubscription()
        .then((newSub) => {
          if (!newSub) {
            setPlan(PLANS.free);
          } else {
            setPlan(PLANS[newSub.plan]);
          }
        })
        .catch((e) => console.error(e));
    }
  }, [stats, plan]);

  if (!stats || !plan) {
    return null;
  }

  const stat = stats.find((p) => p.id === podcastId);
  if (!stat) {
    console.error('No stats found for podcast', podcastId);
    return null;
  }

  const total = stat?.allepisodes || 0;
  const processed = stat?.processed || 0;
  const unprocessed = total - processed;
  const leftOnPlan = plan.maxEpisodesPerPodcast ? Math.max(0, plan.maxEpisodesPerPodcast - processed) : Infinity;
  const numToProcess = Math.min(unprocessed, leftOnPlan);

  return {
    plan,
    totalEpisodes: total,
    processedEpisodes: processed,
    unprocessedEpisodes: unprocessed,
    maxEpisodesPerPodcast: plan.maxEpisodesPerPodcast || Infinity,
    leftOnPlan,
    numToProcess,
  };
}
