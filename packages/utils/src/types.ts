import { Tables } from './database-generated.types.js';

export type Podcast = Tables<'Podcasts'>;
export type Episode = Tables<'Episodes'>;
export type User = Tables<'Users'>;

// An Episode where the podcast field is replaced with the Podcast object itself.
export type EpisodeWithPodcast = Omit<Episode, 'podcast'> & { podcast: Podcast };

// A Podcast with a list of episodes.
export type PodcastWithEpisodes = Podcast & { Episodes: Episode[] };
