import { Episode, EpisodeStatus, EpisodeWithPodcast } from 'podverse-utils';

export function isPublished(episode: Episode | EpisodeWithPodcast): boolean {
  return episode.published === true;
}

export function isPending(episode: Episode | EpisodeWithPodcast): boolean {
  const status = episode.status as EpisodeStatus;
  return !status || !status.startedAt;
}

export function isProcessing(episode: Episode | EpisodeWithPodcast): boolean {
  const status = episode.status as EpisodeStatus;
  return (status && status.startedAt && !status.completedAt) || false;
}

export function isError(episode: Episode | EpisodeWithPodcast): boolean {
  const status = episode.status as EpisodeStatus;
  return (status && status.message && status.message.startsWith('Error')) || false;
}

export function isReady(episode: Episode | EpisodeWithPodcast): boolean {
  const status = episode.status as EpisodeStatus;
  return (
    (!isPending(episode) && !isProcessing(episode) && !isError(episode) && status && status.completedAt !== null) ||
    false
  );
}
