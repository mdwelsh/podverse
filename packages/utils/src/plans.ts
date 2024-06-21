/** Represents the state field of the Subscriptions table. */
export enum SubscriptionState {
  Active = 'active',
  Canceled = 'canceled',
  CancelPending = 'cancel_pending',
}

/** Represents a single plan. */
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
    priceId: 'price_1PQuwG1vQbZgOhBPTQxhsuha',
  },
  professional: {
    id: 'professional',
    displayName: 'Professional',
    description: 'Unlimited power',
    price: 50.0,
    priceId: 'price_1PQuwD1vQbZgOhBPdrBO0xOm',
  },
  unlimited: {
    id: 'unlimited',
    displayName: 'Unlimited',
    description: 'Unlimited everything',
    price: 300.0,
    hidden: true,
  },
};

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
  process: boolean;
  private: boolean;
  uuid: string;
};
