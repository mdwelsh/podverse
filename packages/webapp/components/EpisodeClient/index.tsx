'use client';

import { EpisodeWithPodcast } from 'podverse-utils';
import { AudioPlayer, AudioPlayerProvider, useAudioPlayer } from '@/components/AudioPlayer';
import { EpisodeTranscript } from '@/components/EpisodeTranscript';
import { EpisodeChat } from '@/components/EpisodeChat';

/**
 * This is the client side of the EpisodeDetail page.
 * It includes the audio player, which allows us to pass context to allow
 * the audio player, transcript, and chat window to stay in sync.
 */
export function EpisodeClient({
  episode,
  chatAvailable,
  suggestedQueries,
}: {
  episode: EpisodeWithPodcast;
  chatAvailable: boolean;
  suggestedQueries: string[];
}) {
  return (
    <>
      <AudioPlayerProvider>
        <AudioPlayer episode={episode} />
        <div className="flex flex-row gap-4">
          <EpisodeTranscript episode={episode} />
          <EpisodeChat episode={episode} suggestedQueries={suggestedQueries} chatAvailable={chatAvailable} />
        </div>
      </AudioPlayerProvider>
    </>
  );
}
