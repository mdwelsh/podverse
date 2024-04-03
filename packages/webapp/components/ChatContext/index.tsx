'use client';

import React, { createContext, useEffect, useState } from 'react';
import { PodcastWithEpisodes, EpisodeWithPodcast } from 'podverse-utils';
import { getPodcastWithEpisodes, getEpisodeWithPodcast } from '@/lib/actions';
import { usePathname } from 'next/navigation';

interface ChatContextType {
  podcast?: PodcastWithEpisodes;
  episode?: EpisodeWithPodcast;
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

export function ChatContextProvider({
  podcast,
  episode,
  children,
}: {
  podcast?: PodcastWithEpisodes;
  episode?: EpisodeWithPodcast;
  children: React.ReactNode;
}) {
  const [currentPodcast, setCurrentPodcast] = useState<PodcastWithEpisodes | undefined>(undefined);
  const [currentEpisode, setCurrentEpisode] = useState<EpisodeWithPodcast | undefined>(undefined);
  const pathname = usePathname();

  useEffect(() => {
    // Fetch podcast and/or episode if needed.
    if (!podcast && !episode) {
      const path = pathname.split('/');
      if (path.length === 3 && path[1] === 'podcast') {
        const podcastSlug = path[2];
        getPodcastWithEpisodes(podcastSlug).then(setCurrentPodcast);
      } else if (path.length === 5 && path[1] === 'podcast' && path[3] === 'episode') {
        const podcastSlug = path[2];
        const episodeSlug = path[4];
        getEpisodeWithPodcast(podcastSlug, episodeSlug).then(setCurrentEpisode);
      } else {
        setCurrentPodcast(undefined);
        setCurrentEpisode(undefined);
      }
    }
  }, [podcast, episode, pathname]);

  const value: ChatContextType = {
    podcast: podcast ?? currentPodcast,
    episode: episode ?? currentEpisode,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
