/** This is the API endpoint used by the Chat component. */

import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { Tool, ToolCallPayload } from 'ai';
import { VectorSearch } from 'podverse-utils';
import supabase from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

export async function POST(req: Request) {
  // The `messages` array contains an array of user and assistant role messages.
  const { messages } = await req.json();

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

  const systemMessage = {
    role: 'system',
    content:
      'You are an AI assistant that answers questions about a podcast. You should speak casually, and avoid formal speech. Your responses should generally be quite short. When provided context to a question, you should use that context to inform your response.',
  };

  console.log(`/api/chat POST: messages=${JSON.stringify(messages)}`);
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    stream: true,
    // Prepend system message to messages.
    messages: [systemMessage, ...messages],
    tools,
    tool_choice: 'auto',
  });
  const stream = OpenAIStream(response, {
    experimental_onToolCall: async (call: ToolCallPayload, appendToolCallMessage) => {
      try {
        for (const toolCall of call.tools) {
          console.log(`onToolCall: tool=${JSON.stringify(toolCall)}`);
          if (toolCall.func.name === 'searchKnowledgeBase') {
            const args = JSON.parse(toolCall.func.arguments as unknown as string);
            const chunks = await VectorSearch(supabase, args.query) as { content: string }[];
            const chunkResults = chunks.map((chunk, index) => {
              return {
                role: 'system',
                content: `Search result ${index + 1}: ${chunk.content}`,
              };
            });
            const newMessages = appendToolCallMessage({
              tool_call_id: toolCall.id,
              function_name: 'searchKnowledgeBase',
              tool_call_result: chunkResults,
            });
            console.log(`onToolCall: newMessages=${JSON.stringify(newMessages)}`);
            return openai.chat.completions.create({
              messages: [systemMessage, ...messages, ...newMessages],
              model: 'gpt-4-turbo-preview',
              stream: true,
              tools,
              tool_choice: 'auto',
            });
          }
        }
      } catch (error) {
        console.error(`Error in onToolCall: ${error}`);
        return `I'm sorry, there was an error processing your request: ${error}`;
      }
    },
  });
  return new StreamingTextResponse(stream);
}
