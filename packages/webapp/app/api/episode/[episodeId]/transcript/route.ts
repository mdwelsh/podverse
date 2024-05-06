import { getSupabaseClientWithToken } from '@/lib/supabase';
import { TranscribeEpisodeCallback } from '@/lib/process';
import { inngest } from '@/inngest/client';

/** Callback from Deepgram when transcript is ready. */
export async function POST(req: Request, { params }: { params: { episodeId: string } }) {
  console.log(`Got transcript callback for episode: ${params.episodeId}`);
  const data = await req.json();

  // @ts-expect-error
  const supabaseAccessToken = req.nextUrl.searchParams.get('supabaseAccessToken');
  if (!supabaseAccessToken) {
    // @ts-expect-error
    console.error('No access token provided', req.nextUrl);
    return Response.json({ message: 'Thank you for uploading your transcript.' });
  }

  // Check dg-token header.
  const DEEPGRAM_API_KEY_IDENTIFIER = process.env.DEEPGRAM_API_KEY_IDENTIFIER || '';
  if (!DEEPGRAM_API_KEY_IDENTIFIER) {
    console.error('Missing DEEPGRAM_API_KEY_IDENTIFIER environment variable.');
    return Response.json({ message: 'Thank you for uploading your transcript.' });
  }
  const deepgramToken = req.headers.get('dg-token');
  if (!deepgramToken || deepgramToken !== process.env.DEEPGRAM_API_KEY_IDENTIFIER) {
    console.error('dg-token header mismatch');
    return Response.json({ message: 'Thank you for uploading your transcript.' });
  }

  const supabase = await getSupabaseClientWithToken(supabaseAccessToken);
  const result = await TranscribeEpisodeCallback({ supabase, episodeId: parseInt(params.episodeId), result: data });
  console.log(`TranscribeEpisodeCallback result: ${result}`);

  // Send the transcription received event so we can continue processing.
  const retval = await inngest.send({
    name: 'process/transcript',
    data: {
      episodeId: params.episodeId,
    },
  });

  console.log(`Sent process/transcript event: ${JSON.stringify(retval, null, 2)}`);
  return Response.json({ message: 'Thank you for uploading your transcript.' });
}
