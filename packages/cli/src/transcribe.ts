/** This module performs audio->text transcription using Deepgram. */

import ora from 'ora';
import { config } from 'dotenv';
config();

import pkg from '@deepgram/sdk';
const { Deepgram } = pkg;

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';
if (!DEEPGRAM_API_KEY) throw new Error('Missing DEEPGRAM_API_KEY environment variable.');

/** Transcribe the given audio file and return the text of the transcript. */
export async function Transcribe(audioUrl: string): Promise<string> {
  const spinner = ora(`Transcribing: ${audioUrl}...`).start();
  const deepgram = new Deepgram(DEEPGRAM_API_KEY);
  const source = {
    url: audioUrl,
  };
  const result = await deepgram.transcription.preRecorded(source, {
    smart_format: true,
    model: 'nova',
    punctuate: true,
    diarize: true,
    paragraphs: true,
    speaker_labels: true,
  });
  const transcript =
    result.results?.channels[0].alternatives[0].paragraphs?.transcript ||
    result.results?.channels[0].alternatives[0].transcript ||
    '';
  spinner.succeed(`Transcribed: ${audioUrl}`);
  return transcript;
}
