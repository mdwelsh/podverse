import { Tables } from './database-generated.types.js';

export { Json } from './database-generated.types.js';

export type Podcast = Tables<'Podcasts'>;
export type Episode = Tables<'Episodes'>;
export type User = Tables<'Users'>;
export type Subscription = Tables<'Subscriptions'>;

/** Mapping from speaker ID to name. */
export type Speakers = Record<string, string>;

/** Query suggestions for a given podcast or episode. */
export type Suggestions = string[];

/** An Episode where the podcast field is replaced with the Podcast object itself. */
export type EpisodeWithPodcast = Omit<Episode, 'podcast'> & {
  podcast: Podcast;
  speakers?: Speakers;
  suggestions?: Suggestions;
};

/** Podcast metadata (that is, RSS feed data) only. */
export type PodcastMetadata = Omit<Podcast, 'id' | 'created_at' | 'modified_at' | 'owner'> & {
  id?: number;
  created_at?: string;
  modified_at?: string;
};

/** Episode metadata (that is, RSS feed data) only. */
export type EpisodeMetadata = Omit<
  Episode,
  | 'id'
  | 'podcast'
  | 'created_at'
  | 'modified_at'
  | 'audioUrl'
  | 'transcriptUrl'
  | 'rawTranscriptUrl'
  | 'summaryUrl'
  | 'error'
  | 'status'
  | 'published'
> & {
  id?: number;
  podcast?: number;
  created_at?: string;
  modified_at?: string;
};

/** Episode metadata with podcast metadata. */
export type EpisodeWithPodcastMetadata = Omit<EpisodeMetadata, 'podcast'> & {
  podcast: PodcastMetadata;
  speakers?: Speakers;
  suggestions?: Suggestions;
};

/** A Podcast with a list of episodes. */
export type PodcastWithEpisodes = Podcast & { Episodes: Episode[]; suggestions?: Suggestions };

/** Podcast metadata with a list of Episode metadata. */
export type PodcastWithEpisodesMetadata = PodcastMetadata & { Episodes: EpisodeMetadata[]; suggestions?: Suggestions };

/** Type of the Episodes.status field. */
export type EpisodeStatus = {
  message?: string;
  startedAt?: string;
  completedAt?: string;
};

