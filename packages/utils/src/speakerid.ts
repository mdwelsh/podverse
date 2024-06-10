import { Podcast, Episode } from './types.js';
import { OpenAI } from 'openai';

const SPEAKERID_PROMPT = `The following is a transcript of a conversation between multiple
  individuals, identified as "Speaker 0", "Speaker 1", and so forth. Please identify the
  speakers in the conversation, based on the contents of the transcript. Your response should
  be a JSON object, with the keys representing the original speaker identifications
  (e.g., "Speaker 0", "Speaker 1") and the values representing the identified speaker names
  (e.g., "John Smith", "Jane Doe"). For example, your response might be:

  { "Speaker 0": "John Smith", "Speaker 1": "Jane Doe" }

  ONLY return a JSON formatted response. DO NOT return any other information or context.
  DO NOT use backquotes in your reply.`;

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

export async function SpeakerID({
  text,
  podcast,
  episode,
  maxTokenLen = 100000,
}: {
  text: string;
  podcast?: Podcast;
  episode?: Episode;
  maxTokenLen?: number;
}): Promise<Record<string, string>> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable.');
  }
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const systemMessage = makePrompt(SPEAKERID_PROMPT, podcast, episode);

  if (tokenLen(text) > maxTokenLen) {
    // Restrict to first maxTokenLen tokens.
    text = text.substring(0, maxTokenLen * 4);
  }

  // We sometimes get a bad result from the LLM, so we try multiple times before
  // giving up.
  let parsed = null;
  let tries = 0;
  const MAX_TRIES = 3;
  while (tries < MAX_TRIES) {
    tries += 1;
    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: text },
      ],
      model: 'gpt-4o',
    });
    const result = completion.choices[0].message.content || '{}';
    console.log(`[Attempt ${tries}/${MAX_TRIES}] SpeakerID result: ${result}`);
    try {
      parsed = JSON.parse(result);
      if (typeof parsed !== 'object') {
        throw new Error(`Expected JSON object as response, got: ${result}`);
      }
      break;
    } catch (e) {
      console.error(`[Attempt ${tries}/${MAX_TRIES}] Failed to parse SpeakerID result: ${e}`);
    }
  }
  if (tries >= MAX_TRIES) {
    throw new Error(`Failed to get a valid response from the LLM after ${MAX_TRIES} attempts.`);
  }

  // For each of the keys, replace "Speaker X" with "X".
  const updated: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed as Record<string, string>)) {
    const newKey = key.replace('Speaker ', '');
    updated[newKey] = value;
  }
  return updated;
}
