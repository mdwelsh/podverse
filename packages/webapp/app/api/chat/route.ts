/** This is the API endpoint used by the Chat component. */

import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse, CreateMessage } from 'ai';
import { Tool, ToolCallPayload } from 'ai';
import { VectorSearch, EpisodeWithPodcast, GetEpisode, GetEpisodeWithPodcast } from 'podverse-utils';
import { getSupabaseClient } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const INITIAL_QUERY_PROMPT = {
  role: 'system',
  content: `You are an AI assistant that answers questions about a podcast. You should speak casually,
      and avoid formal speech. Your responses should generally be quite short.
      When provided context to a question, you should use that context to inform your response.
      ALWAYS call the searchKnowledgeBase function when you receive a question.`,
};

const ANSWER_QUERY_PROMPT = {
  role: 'system',
  content: `You are an AI assistant that answers questions about a podcast. You should speak casually,
      and avoid formal speech. Your responses should be quite short - two or three
      short sentences at most. Use the provided context to answer the user's question. 

      The following context is provided to you to help you answer the user's question.
      PLEASE INCLUDE THE LINKS PROVIDED IN THE CONTEXT IN YOUR RESPONSE.
      DO NOT INCLUDE LINKS TO OTHER INFORMATION OTHER THAN THE LINKS PROVIDED BELOW.
      You may respond in Markdown format. Please remember to keep your answer short.`,
};

type Chunk = {
  content: string;
  chunkId?: string;
  documentId?: string;
  similarity?: number;
  meta?: {
    startTime: number;
    endTime: number;
  };
};

type MessagePiece = {
  role: string;
  content: string;
};

// Convert the Chunk into a message that we can pass as context to the LLM.
async function processChunk(chunk: Chunk, index: number, supabase: SupabaseClient): Promise<MessagePiece> {
  let message = `Here is context entry ${index + 1}. This is a chunk of text from the podcast
  episode that you should use as context when answering the user's question.`;
  message += '\n\nBEGINNING OF TEXT:\n"' + chunk.content + '"\nEND OF TEXT.\n\n';
  if (chunk.documentId) {
    // Look up the episode and podcast for the documentId.
    const { data, error } = await supabase.from('Documents').select('id, episode').eq('id', chunk.documentId);
    if (!error && data && data.length > 0) {
      const episodeId = data![0].episode as string;
      const episode = await GetEpisodeWithPodcast(supabase, parseInt(episodeId));
      const episodeLink = `https://podverse.ai/podcast/${episode.podcast.slug}/episode/${episode.slug}`;
      const podcastLink = `https://podverse.ai/podcast/${episode.podcast.slug}`;
      message += `The preceeding text is from the episode titled "${episode.title}" of the podcast "${episode.podcast.title}".
        Here is a link to the episode: ${episodeLink}.
        Here is a link to the podcast itself: ${podcastLink}.
        Feel free to use these links in your response to the user.\n`;
    } else {
      console.error(`Error looking up episode for documentId=${chunk.documentId}: ${error}`);
    }
  }
  return {
    role: 'system',
    content: message,
  };
}

export async function POST(req: Request) {
  // The `messages` array contains an array of user and assistant role messages.
  const { messages, episodeId, podcastId } = await req.json();

  const tools: Tool[] = [
    {
      type: 'function',
      function: {
        name: 'searchKnowledgeBase',
        description: 'Search the knowledge base for information pertaining to the given query.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
            },
          },
          required: ['query'],
        },
      },
    },
  ];

  console.log(`/api/chat POST: messages=${JSON.stringify(messages)}`);
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    stream: true,
    // Prepend system message to messages.
    messages: [INITIAL_QUERY_PROMPT, ...messages],
    tools,
    tool_choice: 'auto',
  });
  const stream = OpenAIStream(response, {
    experimental_onToolCall: async (call: ToolCallPayload, appendToolCallMessage) => {
      try {
        for (const toolCall of call.tools) {
          console.log(`onToolCall: tool=${JSON.stringify(toolCall)}`);
          if (toolCall.func.name === 'searchKnowledgeBase') {
            const supabase = await getSupabaseClient();
            const args = JSON.parse(toolCall.func.arguments as unknown as string);
            console.log(`searchKnowledgeBase: Calling Vector search: args=${JSON.stringify(args)}`);
            const pid = podcastId !== undefined ? parseInt(podcastId) : undefined;
            const eid = episodeId !== undefined ? parseInt(episodeId) : undefined;
            const chunks = (await VectorSearch({ supabase, input: args.query, podcastId: pid, episodeId: eid })) as {
              content: string;
            }[];
            const chunkResults = await Promise.all(
              chunks.map(async (chunk, index) => await processChunk(chunk, index, supabase)),
            );
            const newMessages = appendToolCallMessage({
              tool_call_id: toolCall.id,
              function_name: 'searchKnowledgeBase',
              tool_call_result: chunkResults,
            });
            console.log(`onToolCall: newMessages=${JSON.stringify(newMessages, null, 2)}`);
            return openai.chat.completions.create({
              messages: [ANSWER_QUERY_PROMPT, ...messages, ...newMessages],
              model: 'gpt-4-turbo-preview',
              stream: true,
              tools,
              tool_choice: 'auto',
            });
          }
        }
      } catch (error) {
        console.error('Error in onToolCall: ', error);
        return `I'm sorry, there was an error processing your request: ${JSON.stringify(error)}`;
      }
    },
  });
  return new StreamingTextResponse(stream);
}
