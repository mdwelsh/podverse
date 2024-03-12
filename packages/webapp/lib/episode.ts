import { Episode, EpisodeStatus } from 'podverse-utils';

export function isPending(episode: Episode): boolean {
  const status = episode.status as EpisodeStatus;
  return !status || !status.startedAt;
}

export function isProcessing(episode: Episode): boolean {
  const status = episode.status as EpisodeStatus;
  return (status && status.startedAt && !status.completedAt) || false;
}

export function isError(episode: Episode): boolean {
  const status = episode.status as EpisodeStatus;
  return (status && status.message && status.message.startsWith('Error')) || false;
}

export function isReady(episode: Episode): boolean {
  const status = episode.status as EpisodeStatus;
  return (
    (!isPending(episode) && !isProcessing(episode) && !isError(episode) && status && status.completedAt !== null) ||
    false
  );
}
