/* This module has functions for processing individual episodes. */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  GetEpisode,
  Upload,
  UploadLargeFile,
  UpdateEpisode,
  GetSpeakerMap,
  UpdateSpeakerMap,
  GetPodcastByID,
} from './storage.js';
import { Transcribe } from './transcribe.js';
import { Summarize } from './summarize.js';
import { SpeakerID } from './speakerid.js';
import { EmbedTranscript } from './embed.js';
import { Json, Episode, EpisodeStatus } from './types.js';

async function updateStatus({
  supabase,
  episode,
  message,
  completedAt,
}: {
  supabase: SupabaseClient;
  episode: Episode;
  message?: string;
  completedAt?: string;
}) {
  episode.status = {
    ...(episode.status as EpisodeStatus),
    message,
    completedAt,
  };
  await UpdateEpisode(supabase, episode);
}

/** Perform processing on the given episode. */
// export async function ProcessEpisode({
//   supabase,
//   episodeId,
//   force,
// }: {
//   supabase: SupabaseClient;
//   episodeId: number;
//   force: boolean;
// }): Promise<string> {
//   console.log(`Processing episode ${episodeId}`);

//   const episode = await GetEpisode(supabase, episodeId);
//   episode.status = {
//     ...(episode.status as EpisodeStatus),
//     startedAt: new Date().toISOString(),
//     completedAt: null,
//     message: 'Starting processing',
//   };
//   episode.error = null;
//   await UpdateEpisode(supabase, episode);

//   try {
//     const transcriptResult = await TranscribeEpisode({ supabase, episode, force });
//     console.log(transcriptResult);
//     const summarizeResult = await SummarizeEpisode({ supabase, episode, force });
//     console.log(summarizeResult);
//     const speakerIdResult = await SpeakerIDEpisode({ supabase, episode, force });
//     console.log(speakerIdResult);
//     const embedResult = await EmbedEpisode({ supabase, episode, force });
//     console.log(embedResult);
//     episode.status = {
//       ...(episode.status as EpisodeStatus),
//       message: 'Finished processing',
//       completedAt: new Date().toISOString(),
//     };
//     await UpdateEpisode(supabase, episode);
//     return JSON.stringify({ transcriptResult, summarizeResult, speakerIdResult, embedResult });
//   } catch (error) {
//     console.error(`Error processing episode ${episodeId}`, error);
//     episode.error = error as Json;
//     episode.status = {
//       ...(episode.status as EpisodeStatus),
//       message: `Error: ${JSON.stringify(error)}`,
//       completedAt: new Date().toISOString(),
//     };
//     await UpdateEpisode(supabase, episode);
//     throw error;
//   }
// }

/** Transcribe the given episode. */
export async function TranscribeEpisode({
  supabase,
  supabaseToken,
  episode,
  force,
}: {
  supabase: SupabaseClient;
  supabaseToken: string;
  episode: Episode;
  force: boolean;
}): Promise<string> {
  console.log(`Transcribing episode ${episode.id}`);
  updateStatus({ supabase, episode, message: 'Transcribing' });
  if (episode.transcriptUrl !== null && !force) {
    return `Episode ${episode.id} already transcribed.`;
  }
  if (episode.originalAudioUrl === null) {
    return `Episode ${episode.id} has no audio.`;
  }

  // First, download the audio file and stash it in our own bucket.
  const res = await fetch(episode.originalAudioUrl, {
    redirect: 'follow',
    headers: { 'User-Agent': 'Podverse' },
  });
  console.log(
    `Fetched audio for episode ${episode.id}: ${res.status} ${res.statusText} - size is ${res.headers.get('content-length')} bytes.`,
  );
  if (!res.ok) {
    throw new Error(`Error fetching audio: ${res.status} ${res.statusText}`);
  }
  const audioBlob = await res.blob();

  const audioUrl = await UploadLargeFile(
    supabaseToken,
    audioBlob,
    res.headers.get('content-type') || 'audio/mp3',
    'audio',
    `${episode.podcast}/${episode.id}/audio.mp3`,
  );

  console.log(`Saved audio for ${episode.id} to: ${audioUrl}`);

  const result = await Transcribe(audioUrl);
  const rawTranscriptUrl = await Upload(
    supabase,
    JSON.stringify(result, null, 2),
    'transcripts',
    `${episode.podcast}/${episode.id}/transcript.json`,
  );

  // Extract just the transcript text.
  const transcript =
    result.results?.channels[0].alternatives[0].paragraphs?.transcript ||
    result.results?.channels[0].alternatives[0].transcript ||
    '';
  const transcriptUrl = await Upload(
    supabase,
    transcript,
    'transcripts',
    `${episode.podcast}/${episode.id}/transcript.txt`,
  );

  // Update Episode.
  episode.audioUrl = audioUrl;
  episode.transcriptUrl = transcriptUrl;
  episode.rawTranscriptUrl = rawTranscriptUrl;
  await UpdateEpisode(supabase, episode);
  console.log(`Done transcribing episode ${episode.id} - ${transcript.length} bytes.`);
  return `Transcribed episode ${episode.id} (${transcript.length} bytes): ${transcriptUrl}`;
}

/** Summarize the given episode. */
export async function SummarizeEpisode({
  supabase,
  episode,
  force,
}: {
  supabase: SupabaseClient;
  episode: Episode;
  force: boolean;
}): Promise<string> {
  console.log(`Summarizing episode ${episode.id}`);
  updateStatus({ supabase, episode, message: 'Summarizing' });
  const podcast = await GetPodcastByID(supabase, episode.podcast.toString());
  if (episode.summaryUrl !== null && !force) {
    return `Episode ${episode.id} already summarized.`;
  }
  if (episode.transcriptUrl === null) {
    return `Episode ${episode.id} has no transcript.`;
  }
  const res = await fetch(episode.transcriptUrl);
  const text = await res.text();
  const summary = await Summarize({ text, episode, podcast });
  const filename = `${episode.podcast}/${episode.id}/summary.txt`;
  console.log(`Uploading summary for episode ${episode.id} to ${filename}`);
  const summaryUrl = await Upload(supabase, summary, 'summaries', filename);

  // Update Episode.
  episode.summaryUrl = summaryUrl;
  await UpdateEpisode(supabase, episode);
  console.log(`Done summarizing episode ${episode.id} - ${summary.length} bytes.`);
  return `Summarized episode ${episode.id} (${summary.length} bytes): ${summaryUrl}`;
}

/** Perform speaker identification on the given episode. */
export async function SpeakerIDEpisode({
  supabase,
  episode,
  force,
}: {
  supabase: SupabaseClient;
  episode: Episode;
  force: boolean;
}): Promise<string> {
  console.log(`Speaker ID for episode ${episode.id}`);
  updateStatus({ supabase, episode, message: 'Determining speaker IDs' });
  const podcast = await GetPodcastByID(supabase, episode.podcast.toString());
  if (episode.transcriptUrl === null) {
    return `Episode ${episode.id} has no transcript.`;
  }

  // Check for existing speaker map.
  const speakerMap = await GetSpeakerMap(supabase, episode.id);
  if (Object.keys(speakerMap).length > 0 && !force) {
    return `Episode ${episode.id} already has speaker map.`;
  }
  const res = await fetch(episode.transcriptUrl);
  const text = await res.text();
  const speakers = await SpeakerID({ text, episode, podcast });

  // Update SpeakerMap.
  for (const [speakerId, name] of Object.entries(speakers)) {
    console.log(`Updating speaker map for episode ${episode.id}: speaker=${speakerId}, name=${name}`);
    await UpdateSpeakerMap(supabase, episode.id, speakerId, name, force);
  }
  console.log(`Done speaker ID for episode ${episode.id}`);
  return `SpeakerID on episode ${episode.id} done`;
}

/** Embed the given episode. */
export async function EmbedEpisode({
  supabase,
  episode,
  force,
}: {
  supabase: SupabaseClient;
  episode: Episode;
  force: boolean;
}): Promise<string> {
  console.log(`Embed for episode ${episode.id}`);
  updateStatus({ supabase, episode, message: 'Generating embeddings' });
  if (episode.rawTranscriptUrl === null) {
    return `Episode ${episode.id} has no JSON transcript.`;
  }
  // Check for existing embeddings.
  const { data: existing, error } = await supabase.from('Documents').select('*').eq('episode', episode.id);
  if (error) {
    console.error('error', error);
    throw error;
  }
  if (existing && existing.length > 0) {
    if (!force) {
      return `Episode ${episode.id} already embedded.`;
    } else {
      console.log(`Deleting existing embeddings for episode ${episode.id}`);
      const { error } = await supabase.from('Documents').delete().eq('episode', episode.id);
      if (error) {
        console.error('error', error);
        throw error;
      }
    }
  }
  const docId = await EmbedTranscript(supabase, episode.rawTranscriptUrl, episode.id);
  console.log(`Done embedding episode ${episode.id} - page ${docId}`);
  return `Embed on episode ${episode.id} done - document ID ${docId}`;
}
