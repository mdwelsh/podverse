import Cors from 'micro-cors';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';

const cors = Cors({
  allowMethods: ['POST', 'HEAD'],
});

/** Receives webhooks from Clerk when events of interest occur. */
export async function POST(req: Request) {
  const svix_id = req.headers.get('svix-id') ?? '';
  const svix_timestamp = req.headers.get('svix-timestamp') ?? '';
  const svix_signature = req.headers.get('svix-signature') ?? '';
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: 'Missing CLERK_WEBHOOK_SECRET' }, { status: 500 });
  }
  const wh = new Webhook(secret);
  const body = await req.text();
  const payload = wh.verify(body, {
    'svix-id': svix_id,
    'svix-timestamp': svix_timestamp,
    'svix-signature': svix_signature,
  });
  console.log(`Received Clerk webhook: ${JSON.stringify(payload, null, 2)}`);
  return NextResponse.json({ ok: true });
}
