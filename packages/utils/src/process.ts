/* This module has functions for processing individual episodes. */

import { SupabaseClient } from '@supabase/supabase-js';
import { GetEpisode, Upload, UpdateEpisode, UpdateSpeakerMap, GetPodcastByID } from './storage.js';
import { Transcribe } from './transcribe.js';
import { Summarize } from './summarize.js';
import { SpeakerID } from './speakerid.js';
import { EmbedText } from './embed.js';

/** Perform processing on the given episode. */
export async function ProcessEpisode({
  supabase,
  episodeId,
  force,
}: {
  supabase: SupabaseClient;
  episodeId: number;
  force: boolean;
}): Promise<string> {
  console.log(`Processing episode ${episodeId}`);
  const transcriptResult = await TranscribeEpisode({ supabase, episodeId, force });
  const summarizeResult = await SummarizeEpisode({ supabase, episodeId, force });
  const speakerIdResult = await SpeakerIDEpisode({ supabase, episodeId, force });
  const embedResult = await EmbedEpisode(supabase, episodeId);
  return JSON.stringify({ transcriptResult, summarizeResult, speakerIdResult, embedResult });
}

/** Transcribe the given episode. */
export async function TranscribeEpisode({
  supabase,
  episodeId,
  force,
}: {
  supabase: SupabaseClient;
  episodeId: number;
  force: boolean;
}): Promise<string> {
  console.log(`Transcribing episode ${episodeId}`);
  const episode = await GetEpisode(supabase, episodeId);
  if (episode.transcriptUrl !== null && !force) {
    return `Episode ${episodeId} already transcribed.`;
  }
  if (episode.audioUrl === null) {
    return `Episode ${episodeId} has no audio.`;
  }
  const result = await Transcribe(episode.audioUrl!);
  const rawTranscriptUrl = await Upload(supabase, JSON.stringify(result, null, 2), 'transcripts', `${episodeId}.json`);

  // Extract just the transcript text.
  const transcript =
    result.results?.channels[0].alternatives[0].paragraphs?.transcript ||
    result.results?.channels[0].alternatives[0].transcript ||
    '';
  const transcriptUrl = await Upload(supabase, transcript, 'transcripts', `${episodeId}.txt`);

  // Update Episode.
  episode.transcriptUrl = transcriptUrl;
  episode.rawTranscriptUrl = rawTranscriptUrl;
  await UpdateEpisode(supabase, episode);
  console.log(`Done transcribing episode ${episodeId} - ${transcript.length} bytes.`);
  return `Transcribed episode ${episodeId} (${transcript.length} bytes): ${transcriptUrl}`;
}

/** Summarize the given episode. */
export async function SummarizeEpisode({
  supabase,
  episodeId,
  force,
}: {
  supabase: SupabaseClient;
  episodeId: number;
  force: boolean;
}): Promise<string> {
  console.log(`Summarizing episode ${episodeId}`);
  const episode = await GetEpisode(supabase, episodeId);
  const podcast = await GetPodcastByID(supabase, episode.podcast.toString());
  if (episode.summaryUrl !== null && !force) {
    return `Episode ${episodeId} already summarized.`;
  }
  if (episode.transcriptUrl === null) {
    return `Episode ${episodeId} has no transcript.`;
  }
  const res = await fetch(episode.transcriptUrl);
  const text = await res.text();
  const summary = await Summarize({ text, episode, podcast });
  const summaryUrl = await Upload(supabase, summary, 'summaries', `${episodeId}.txt`);

  // Update Episode.
  episode.summaryUrl = summaryUrl;
  await UpdateEpisode(supabase, episode);
  console.log(`Done summarizing episode ${episodeId} - ${summary.length} bytes.`);
  return `Summarized episode ${episodeId} (${summary.length} bytes): ${summaryUrl}`;
}

/** Perform speaker identification on the given episode. */
export async function SpeakerIDEpisode({
  supabase,
  episodeId,
  force,
}: {
  supabase: SupabaseClient;
  episodeId: number;
  force: boolean;
}): Promise<string> {
  console.log(`Speaker ID for episode ${episodeId}`);
  const episode = await GetEpisode(supabase, episodeId);
  const podcast = await GetPodcastByID(supabase, episode.podcast.toString());
  if (episode.transcriptUrl === null) {
    return `Episode ${episodeId} has no transcript.`;
  }
  const res = await fetch(episode.transcriptUrl);
  const text = await res.text();
  const speakers = await SpeakerID({ text, episode, podcast });

  // Update SpeakerMap.
  for (const [speakerId, name] of Object.entries(speakers)) {
    console.log(`Updating speaker map for episode ${episodeId}: speaker=${speakerId}, name=${name}`);
    await UpdateSpeakerMap(supabase, episodeId, speakerId, name, force);
  }
  console.log(`Done speaker ID for episode ${episodeId}`);
  return `SpeakerID on episode ${episodeId} done`;
}

/** Embed the given episode. */
export async function EmbedEpisode(supabase: SupabaseClient, episodeId: number): Promise<string> {
  console.log(`Embed for episode ${episodeId}`);
  const episode = await GetEpisode(supabase, episodeId);
  const podcast = await GetPodcastByID(supabase, episode.podcast.toString());
  if (episode.transcriptUrl === null) {
    return `Episode ${episodeId} has no transcript.`;
  }
  // XXX Check for existing embeddings here.
  const pageId = await EmbedText(supabase, episode.transcriptUrl, {});

  console.log(`Done embedding episode ${episodeId}`);
  return `Embed on episode ${episodeId} done`;
}


