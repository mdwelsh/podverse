import { SupabaseClient } from '@supabase/supabase-js';
import { isReady } from '@/lib/episode';

export type Plan = {
  id: string;
  displayName: string;
  description: string;
  price: number;
  hidden?: boolean;
  features?: string[];
  maxPodcasts?: number;
  maxEpisodesPerPodcast?: number;
  maxChatSessions?: number;
  priceId?: string;
};

export const PLANS: Record<string, Plan> = {
  free: {
    id: 'free',
    displayName: 'Free',
    description: 'Get started for free',
    price: 0,
    maxPodcasts: 1,
    maxEpisodesPerPodcast: 10,
  },
  creator: {
    id: 'creator',
    displayName: 'Creator',
    description: 'Perfect for serious podcasters',
    price: 15.0,
    maxPodcasts: 3,
    maxEpisodesPerPodcast: 50,
    priceId: 'price_1OyzZQ1vQbZgOhBPFifGWxmL',
  },
  professional: {
    id: 'professional',
    displayName: 'Professional',
    description: 'Unlimited power',
    price: 50.0,
    priceId: 'price_1OyzZw1vQbZgOhBPeqVlY4a0',
  },
  unlimited: {
    id: 'unlimited',
    displayName: 'Unlimited',
    description: 'Unlimited everything',
    price: 300.0,
    hidden: true,
  },
};

export type Usage = {
  /** User's current plan. */
  plan: Plan;
  /** Mapping from podcast ID to number of processed episodes. */
  episodesProcessed: Record<string, number>;
  /** User's current chat session usage. */
  chatSessionCount: number;
};

/** Return the current usage record for the given user. */
export async function GetUsage(supabase: SupabaseClient, userId: string): Promise<Usage> {
  const { data, error } = await supabase.from('Podcasts').select('*, Episodes(*)').filter('owner', 'eq', userId);
  if (error) {
    console.log('error', error);
    throw error;
  }
  const episodesProcessed: Record<string, number> = {};
  for (const podcast of data || []) {
    const episodes = podcast.Episodes || [];
    episodesProcessed[podcast.id] = episodes.filter(isReady).length;
  }
  const { data: planName, error: error2 } = await supabase.from('Users').select('plan').eq('id', userId);
  if (error2) {
    console.log('error', error2);
    throw error2;
  }
  if (!planName || planName.length === 0) {
    throw new Error('No plan found for user: ' + userId);
  }

  // No plan means free plan.
  if (!planName[0].plan) {
    planName[0].plan = 'free';
  }

  // Test if planName is a key of PLANS.
  if (!(planName[0].plan in PLANS)) {
    throw new Error('Invalid plan name: ' + JSON.stringify(planName));
  }
  const plan = PLANS[planName[0].plan];

  return {
    plan,
    episodesProcessed,
    chatSessionCount: 0, // TODO: Count these.
  };
}
