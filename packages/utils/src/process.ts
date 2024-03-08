/* This module has functions for processing individual episodes. */

import { SupabaseClient } from '@supabase/supabase-js';
import { GetEpisode, Upload, UpdateEpisode, GetSpeakerMap, UpdateSpeakerMap, GetPodcastByID } from './storage.js';
import { Transcribe } from './transcribe.js';
import { Summarize } from './summarize.js';
import { SpeakerID } from './speakerid.js';
import { EmbedTranscript } from './embed.js';

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
  console.log(transcriptResult);
  const summarizeResult = await SummarizeEpisode({ supabase, episodeId, force });
  console.log(summarizeResult);
  const speakerIdResult = await SpeakerIDEpisode({ supabase, episodeId, force });
  console.log(speakerIdResult);
  const embedResult = await EmbedEpisode({ supabase, episodeId, force });
  console.log(embedResult);
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
  const rawTranscriptUrl = await Upload(supabase, JSON.stringify(result, null, 2), 'transcripts', `${episode.podcast}/${episodeId}/transcript.json`);

  // Extract just the transcript text.
  const transcript =
    result.results?.channels[0].alternatives[0].paragraphs?.transcript ||
    result.results?.channels[0].alternatives[0].transcript ||
    '';
  const transcriptUrl = await Upload(supabase, transcript, 'transcripts', `${episode.podcast}/${episodeId}/transcript.txt`);

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
  const filename = `${episode.podcast}/${episodeId}/summary.txt`;
  console.log(`Uploading summary for episode ${episodeId} to ${filename}`);
  const summaryUrl = await Upload(supabase, summary, 'summaries', filename);

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

  // Check for existing speaker map.
  const speakerMap = await GetSpeakerMap(supabase, episodeId);
  if (Object.keys(speakerMap).length > 0 && !force) {
    return `Episode ${episodeId} already has speaker map.`;
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
export async function EmbedEpisode({
  supabase,
  episodeId,
  force,
}: {
  supabase: SupabaseClient;
  episodeId: number;
  force: boolean;
}): Promise<string> {
  console.log(`Embed for episode ${episodeId}`);
  const episode = await GetEpisode(supabase, episodeId);
  if (episode.rawTranscriptUrl === null) {
    return `Episode ${episodeId} has no JSON transcript.`;
  }
  // Check for existing embeddings.
  const { data: existing, error } = await supabase.from('Documents').select('*').eq('episode', episodeId);
  if (error) {
    console.error('error', error);
    throw error;
  }
  if (existing && existing.length > 0) {
    if (!force) {
      return `Episode ${episodeId} already embedded.`;
    } else {
      console.log(`Deleting existing embeddings for episode ${episodeId}`);
      const { error } = await supabase.from('Documents').delete().eq('episode', episodeId);
      if (error) {
        console.error('error', error);
        throw error;
      }
    }
  }
  const docId = await EmbedTranscript(supabase, episode.rawTranscriptUrl, episodeId);
  console.log(`Done embedding episode ${episodeId} - page ${docId}`);
  return `Embed on episode ${episodeId} done - document ID ${docId}`;
}
