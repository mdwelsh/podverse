import { GetEpisode, Upload, UpdateEpisode } from 'podverse-utils';

import supabase from '../lib/supabase';
import { Transcribe } from './transcribe';

export async function TranscribeEpisode(episodeId: number): Promise<string> {
  console.log(`Transcribing episode ${episodeId}`);
  const episode = await GetEpisode(supabase, episodeId);
  if (episode.transcriptUrl !== null) {
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

// import { config } from 'dotenv';
// config();
// import { Podcast, Episode } from 'podverse-types';
// import slug from 'slug';
// import { UploadToGCS } from './utils.js';
// import { Transcribe } from './transcribe.js';
// import { Summarize } from './summary.js';
// import terminal from 'terminal-kit';
// const { terminal: term } = terminal;

// export interface ProcessOptions {
//   force?: boolean;
//   transcribe?: boolean;
//   summarize?: boolean;
//   maxEpisodes?: number;
// }

// async function maybeTranscribe(episode: Episode, opts: ProcessOptions): Promise<Episode> {
//   const PODVERSE_GCS_BUCKET = process.env.PODVERSE_GCS_BUCKET || '';
//   if (!PODVERSE_GCS_BUCKET) throw new Error('Missing PODVERSE_GCS_BUCKET environment variable.');

//   if (episode.transcriptUrl && !opts.force) {
//     term('  Skipping transcription - already transcribed.\n');
//     return episode;
//   }
//   if (opts.transcribe === false) {
//     term('  Skipping transcription - transcription disabled.\n');
//     return episode;
//   }
//   if (!episode.audioUrl) throw new Error('Episode missing audioUrl field.');
//   const transcript = await Transcribe(episode.audioUrl);
//   const tslug = slug(episode.title);
//   const transcriptUrl = await UploadToGCS(
//     PODVERSE_GCS_BUCKET,
//     `${episode.podcastSlug}/transcript/${tslug}.txt`,
//     transcript
//   );
//   term(`Uploaded transcript: ${transcriptUrl}\n`);
//   episode.transcriptUrl = transcriptUrl;
//   return episode;
// }

// async function maybeSummarize(podcast: Podcast, episode: Episode, opts: ProcessOptions): Promise<Episode> {
//   const PODVERSE_GCS_BUCKET = process.env.PODVERSE_GCS_BUCKET || '';
//   if (!PODVERSE_GCS_BUCKET) throw new Error('Missing PODVERSE_GCS_BUCKET environment variable.');

//   if (episode.summaryUrl && episode.summary && !opts.force) {
//     term('  Skipping summarization - already summarized.\n');
//     return episode;
//   }
//   if (opts.summarize === false) {
//     term('  Skipping summarization - summarization disabled.\n');
//     return episode;
//   }
//   if (!episode.transcriptUrl) throw new Error('Episode missing transcriptUrl field.');
//   const res = await fetch(episode.transcriptUrl);
//   const transcript = await res.text();
//   const summary = await Summarize(transcript, podcast, episode);

//   const finalSummary = `
//     Podcast: ${podcast.title}
//     Episode: ${episode.title}
//     Published: ${episode.pubDate ?? 'unknown'}
//     URL: ${episode.url ?? 'unknown'}\n
//     Summary: ${summary}`;

//   term('\n\n  Summary: ').green(finalSummary).green('\n\n');
//   const tslug = slug(episode.title);
//   const summaryUrl = await UploadToGCS(
//     PODVERSE_GCS_BUCKET,
//     `${episode.podcastSlug}/summary/${tslug}.txt`,
//     finalSummary
//   );
//   term(`Uploaded summary: ${summaryUrl}\n`);
//   episode.summary = summary;
//   episode.summaryUrl = summaryUrl;
//   return episode;
// }

// /** Process the given episode, transcribing its audio, and creating a text transcript. */
// export async function ProcessEpisode(podcast: Podcast, episode: Episode, opts: ProcessOptions): Promise<Episode> {
//   term('  Processing episode: ').blue(`${episode.title}\n`);
//   let ep = await maybeTranscribe(episode, opts);
//   ep = await maybeSummarize(podcast, ep, opts);
//   return ep;
// }

// /** Process the given Podcast. */
// export async function ProcessPodcast(podcast: Podcast, opts: ProcessOptions): Promise<Podcast> {
//   if (!podcast.episodes) return podcast;
//   const newEpisodes: Episode[] = [];
//   for (const episode of podcast.episodes) {
//     newEpisodes.push(await ProcessEpisode(podcast, episode, opts));
//     if (opts.maxEpisodes && newEpisodes.length >= opts.maxEpisodes) break;
//   }
//   podcast.episodes = newEpisodes;
//   return podcast;
// }
