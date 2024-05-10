import { Podcast, Episode } from './types.js';
import { OpenAI } from 'openai';

const SUGGEST_QUERIES_PROMPT = `The following is a transcript of a conversation between
  multiple individuals. Your task is to suggest queries that could be used to search for
  interesting segments of the conversation. For example, a query might be "What did the
  Beatles say about their music?" or "What did the guest say about the economy?". Your job
  is only to suggest interesting or insightful queries about the provided content, not to
  provide answers. DO NOT suggest queries for portions of the conversation that are not
  about the main topic of the conversation. In particular, do not suggest queries related
  to advertising that may appear in the middle of the transcript. Your response should be a
  JSON array of strings, where each string is a query. For example, your response might be:
  ["What did the Beatles say about their music?", "What did the guest say about the economy?"]
  ONLY return a JSON formatted array response. DO NOT return any other information or context.
  DO NOT prefix your response with backquotes.`;

// Rough estimate.
const tokenLen = (text: string) => text.length / 4;

function makePrompt(text: string, podcast?: Podcast, episode?: Episode) {
  return (
    text +
    '\n' +
    (podcast?.title ? `The name of the podcast is: ${podcast.title}\n` : '') +
    (episode?.title ? `The title of the episode is: ${episode.title}\n` : '') +
    (episode?.description ? `The provided description of the episode is: ${episode.description}\n` : '')
  );
}

export async function SuggestQueries({
  text,
  podcast,
  episode,
  maxTokenLen = 100000,
}: {
  text: string;
  podcast?: Podcast;
  episode?: Episode;
  maxTokenLen?: number;
}): Promise<string[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable.');
  }
  console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY}`);
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const systemMessage = makePrompt(SUGGEST_QUERIES_PROMPT, podcast, episode);

  if (tokenLen(text) > maxTokenLen) {
    // Restrict to first maxTokenLen tokens.
    text = text.substring(0, maxTokenLen * 4);
  }

  const completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: text },
    ],
    model: 'gpt-4-turbo-preview',
  });

  const result = completion.choices[0].message.content || '{}';
  // Parse.
  const parsed = JSON.parse(result);
  if (typeof parsed !== 'object') {
    throw new Error(`Expected JSON object as response, got: ${result}`);
  }
  return parsed as string[];
}
