/** This module performs audio->text transcription using Deepgram. */

import { createClient, AsyncPrerecordedResponse, CallbackUrl, SyncPrerecordedResponse } from '@deepgram/sdk';

/** Transcribe the given audio file and return the text of the transcript. */
export async function Transcribe(audioUrl: string): Promise<SyncPrerecordedResponse> {
  console.log(`Transcribe audio from ${audioUrl}`);
  const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';
  if (!DEEPGRAM_API_KEY) {
    throw new Error('Missing DEEPGRAM_API_KEY environment variable.');
  }
  const deepgram = createClient(DEEPGRAM_API_KEY);
  const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
    {
      url: audioUrl,
    },
    {
      model: 'nova-2',
      punctuate: true,
      diarize: true,
      paragraphs: true,
      speaker_labels: true,
      smart_format: true,
    }
  );
  if (error) {
    console.log('Error transcribing audio: ', error);
    throw new Error(`Error transcribing audio: ${error}`);
  }
  return result;
}

/** Transcribe the given audio file. The given callback URL will be invoked when complete. */
export async function TranscribeAsync(audioUrl: string, callbackUrl: string): Promise<AsyncPrerecordedResponse> {
  console.log(`Starting async audio transcription from ${audioUrl}`);
  console.log(`Callback URL is ${callbackUrl}`);
  const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';
  if (!DEEPGRAM_API_KEY) {
    throw new Error('Missing DEEPGRAM_API_KEY environment variable.');
  }
  const deepgram = createClient(DEEPGRAM_API_KEY);
  const { result, error } = await deepgram.listen.prerecorded.transcribeUrlCallback(
    {
      url: audioUrl,
    },
    new CallbackUrl(callbackUrl),
    {
      model: 'nova-2',
      punctuate: true,
      diarize: true,
      paragraphs: true,
      speaker_labels: true,
      smart_format: true,
    }
  );
  if (error) {
    console.log('Error transcribing audio: ', error);
    throw new Error(`Error transcribing audio: ${error}`);
  }
  return result;
}
