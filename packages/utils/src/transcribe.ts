/** This module performs audio->text transcription using Deepgram. */

import { createClient } from '@deepgram/sdk';

/** Transcribe the given audio file and return the text of the transcript. */
export async function Transcribe(audioUrl: string): Promise<any> {
  console.log(`Transcribe audio from ${audioUrl}`);
  const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';
  if (!DEEPGRAM_API_KEY) {
    throw new Error('Missing DEEPGRAM_API_KEY environment variable.');
  }
  const deepgram = createClient(DEEPGRAM_API_KEY);

  // Follow redirects on audioUrl up to 10 redirects and return the final URL
  const MAX_REDIRECTS = 10;
  let finalUrl = audioUrl;
  for (let i = 0; i < MAX_REDIRECTS; i++) {
    const response = await fetch(finalUrl, { redirect: 'manual' });
    if (response.status >= 300 && response.status < 400) {
      finalUrl = response.headers.get('location') || finalUrl;
    } else {
      break;
    }
  }
  if (finalUrl !== audioUrl) {
    console.log(`Following redirects to ${finalUrl}`);
  }
  const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
    {
      url: finalUrl,
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
