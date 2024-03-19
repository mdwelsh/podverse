'use client';

import { getSupabaseClient } from '@/lib/supabase';
import { EpisodeWithPodcast, GetEpisodeSuggestions } from 'podverse-utils';
import { Chat } from '@/components/Chat';
import { CreateMessage } from 'ai';

/** This is a wrapper for the Chat component that initializes the suggested queries for the episode. */
export function EpisodeChat({
  episode,
  suggestedQueries,
  chatAvailable,
}: {
  episode: EpisodeWithPodcast;
  suggestedQueries: string[];
  chatAvailable: boolean;
}) {
  const initialMessages: CreateMessage[] = [
    {
      content: `Hi there! I\'m the Podverse AI Bot. You can ask me questions about **${episode.title}** or the **${episode.podcast.title}** podcast.`,
      role: 'assistant',
    },
    {
      content: 'Here are some suggestions to get you started:\n' + suggestedQueries.map((s) => `[${s}](/?suggest)`).join(' '),
      role: 'assistant',
    },
  ];
  console.log('initialMessages:', initialMessages);

  return (
    <div className="mt-8 flex h-[600px] w-2/5 flex-col gap-2">
      <div>
        <h1>Chat</h1>
      </div>
      <div className="size-full overflow-y-auto border p-4 text-xs">
        {chatAvailable ? (
          <Chat episodeId={episode.id} initialMessages={initialMessages.map((m, i) => ({ ...m, id: i.toString() }))} />
        ) : (
          <div className="text-muted-foreground text-sm">Chat not available</div>
        )}
      </div>
    </div>
  );
}
