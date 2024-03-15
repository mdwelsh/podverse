import { Tables } from './database-generated.types.js';

export { Json } from './database-generated.types.js';

export type Podcast = Tables<'Podcasts'>;
export type Episode = Tables<'Episodes'>;
export type User = Tables<'Users'>;

export type Speakers = Record<string, string>;

/** An Episode where the podcast field is replaced with the Podcast object itself. */
export type EpisodeWithPodcast = Omit<Episode, 'podcast'> & { podcast: Podcast; speakers?: Speakers };

/** Podcast metadata (that is, RSS feed data) only. */
export type PodcastMetadata = Omit<Podcast, 'id' | 'created_at' | 'modified_at' | 'owner' > & {
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
};

/** A Podcast with a list of episodes. */
export type PodcastWithEpisodes = Podcast & { Episodes: Episode[] };

/** Podcast metadata with a list of Episode metadata. */
export type PodcastWithEpisodesMetadata = PodcastMetadata & { Episodes: EpisodeMetadata[] };

/** Type of the Episodes.status field. */
export type EpisodeStatus = {
  message?: string;
  startedAt?: string;
  completedAt?: string;
};
