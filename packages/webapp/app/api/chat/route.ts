/** This is the API endpoint used by the Chat component. */

import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse, CreateMessage } from 'ai';
import { Tool, ToolCallPayload } from 'ai';
import { VectorSearch, EpisodeWithPodcast, GetEpisode, GetEpisodeWithPodcast } from 'podverse-utils';
import { getSupabaseClient } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { reportIssue } from '@/lib/actions';

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

const PODCAST_ANSWER_PROMPT = {
  role: 'system',
  content: `You are an AI assistant that answers questions about a podcast. You should speak casually,
      and avoid formal speech. Your responses should be quite short - two or three
      short sentences at most. Use the provided context to answer the user's question. 

      The following context is provided to you to help you answer the user's question.
      If you use this information to reply to the user, you should include a
      Markdown link in your reply that contains a link to the podcast episode that corresponds
      to the context provided.

      Here is an example of context that you might receive:

      "Here is context entry 3. This is a chunk of text from the podcast episode that you should use
      as context when answering the user's question.

      BEGINNING OF TEXT:
      bears are very good at foraging for food in the wild. They have a keen
      sense of smell and can detect food from miles away. They are also very good at climbing trees
      END OF TEXT.

      AUDIO START TIME: 123.45
      EPISODE LINK: /podcast/amazing-podcast/episode/all-about-bears
      EPISODE TITLE: How come bears eat no food?"

      Given the example context above, your reply should include the following Markdown - note that
      the link target has no hostname, and is only a path:

      "According to the episode [How come bears eat no food?](/podcast/amazing-podcast/episode/all-about-bears?seek-123.45),
      bears are very good at foraging for food in the wild."

      Link URLs must ALWAYS be of the form "/podcast/<podcast-name>/episode/<episode-name>".

      NEVER include a hostname in the link URL. You should only include EPISODE LINKS provided
      by the context, not any other links that you may have. You are encouraged to reference
      multiple EPISODE LINKS in your reply.

      You may respond in Markdown format.`,
};

const EPISODE_ANSWER_PROMPT = {
  role: 'system',
  content: `You are an AI assistant that answers questions about a podcast. You should speak casually,
      and avoid formal speech. Your responses should be quite short - two or three
      short sentences at most. Use the provided context to answer the user's question. 

      The following context is provided to you to help you answer the user's question.
      If you use this information to reply to the user, you should include a
      Markdown link in your reply that contains the start time of the audio clip
      that corresponds to the context provided. For example, with the input

      AUDIO START TIME: 123.45

      your reply should include the following Markdown:

      [Listen](/?seek=123.45)

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
  if (chunk.meta) {
    message += `AUDIO START TIME: ${chunk.meta.startTime}\n\n`;
  }
  if (chunk.documentId) {
    // Look up the episode and podcast for the documentId.
    const { data, error } = await supabase.from('Documents').select('id, episode').eq('id', chunk.documentId);
    if (!error && data && data.length > 0) {
      const episodeId = data![0].episode as string;
      const episode = await GetEpisodeWithPodcast(supabase, parseInt(episodeId));
      const episodeLink = `/podcast/${episode.podcast.slug}/episode/${episode.slug}`;
      message += `EPISODE LINK: ${episodeLink}\n`;
      message += `EPISODE TITLE: ${episode.title}\n`;
    } else {
      console.error(`Error looking up episode for documentId=${chunk.documentId}: ${error}`);
      // Ignore.
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
              description: 'The query to search for in the knowledge base.',
            },
          },
          required: ['query'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'reportIssue',
        description:
          'Report an issue regarding the content or functionality of the site. Before calling this function, please ask for details on the issue from the user, and ask for their email address if they would like a follow up reply from us.',
        parameters: {
          type: 'object',
          properties: {
            issue: {
              type: 'string',
              description:
                'A detailed description of the issue reported by the user. If the user has not specified details, do not call this function, and request additional details instead.',
            },
            email: {
              type: 'string',
              description:
                'The email address of the user reporting the issue. This is optional, but you should encourage the user to provide this information so we can follow up with them if necessary.',
            },
          },
          required: ['issue'],
        },
      },
    },
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
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
              chunks.map(async (chunk, index) => await processChunk(chunk, index, supabase))
            );
            const newMessages = appendToolCallMessage({
              tool_call_id: toolCall.id,
              function_name: 'searchKnowledgeBase',
              tool_call_result: chunkResults,
            });
            console.log(`onToolCall: got ${newMessages.length} new messages`);
            const prompt = [
              episodeId !== undefined ? EPISODE_ANSWER_PROMPT : PODCAST_ANSWER_PROMPT,
              ...messages,
              ...newMessages,
            ];
            // console.log(`onToolCall: calling OpenAI with ${JSON.stringify(prompt, null, 2)}`);
            return openai.chat.completions.create({
              messages: prompt,
              model: 'gpt-4o',
              stream: true,
              tools,
              tool_choice: 'auto',
            });
          } else if (toolCall.func.name === 'reportIssue') {
            const args = JSON.parse(toolCall.func.arguments as unknown as string);
            console.log(`reportIssue: Reporting issue from ${args.email}: ${args.issue}`);
            await reportIssue(args.email, args.issue);
            const newMessages = appendToolCallMessage({
              tool_call_id: toolCall.id,
              function_name: 'reportIssue',
              tool_call_result: {
                role: 'system',
                content: 'Your issue has been reported. Thank you for your feedback!',
              },
            });
            return openai.chat.completions.create({
              messages: [...messages, ...newMessages],
              model: 'gpt-4o',
              stream: true,
              tools,
              tool_choice: 'none',
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
