'use client';

import React, { createContext, useEffect, useState } from 'react';
import { PodcastWithEpisodes, EpisodeWithPodcast } from 'podverse-utils';
import { getPodcastWithEpisodes, getEpisodeWithPodcast, search } from '@/lib/actions';
import { useParams, useSearchParams } from 'next/navigation';

interface ChatContextType {
  podcast?: PodcastWithEpisodes | null;
  episode?: EpisodeWithPodcast | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function useChatContext(): ChatContextType {
  const context = React.useContext(ChatContext);
  if (!context) {
    return {};
  } else {
    return context;
  }
}

/** A Context provider that provides the current podcast and episode, if designated by the path. */
export function ChatContextProvider({
  podcast,
  episode,
  children,
}: {
  podcast?: PodcastWithEpisodes;
  episode?: EpisodeWithPodcast;
  children: React.ReactNode;
}) {
  // Here, null means not yet checked, and undefined means we're not in a podcast or episode context.
  const [currentPodcast, setCurrentPodcast] = useState<PodcastWithEpisodes | null | undefined>(null);
  const [currentEpisode, setCurrentEpisode] = useState<EpisodeWithPodcast | null | undefined>(null);
  const { podcastSlug, episodeSlug } = useParams<{ podcastSlug: string; episodeSlug: string }>();
  const searchParams = useSearchParams();
  const uuid = searchParams.get('uuid') || searchParams.get('activationCode') || undefined;

  useEffect(() => {
    // Fetch podcast and/or episode if needed.
    if (podcastSlug) {
      getPodcastWithEpisodes(podcastSlug).then((podcast) => {
        // Bypass private check if correct UUID is provided.
        if (podcast.private && !uuid && podcast.uuid !== uuid) {
          console.error(`Podcast ${podcastSlug} is private`);
          setCurrentPodcast(undefined);
        } else {
          setCurrentPodcast(podcast);
          if (episodeSlug) {
            getEpisodeWithPodcast(podcastSlug, episodeSlug).then(setCurrentEpisode);
          } else {
            setCurrentEpisode(undefined);
          }
        }
      });
    }
  }, [podcast, episode, podcastSlug, episodeSlug, uuid]);

  const value: ChatContextType = {
    podcast: currentPodcast,
    episode: currentEpisode,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
