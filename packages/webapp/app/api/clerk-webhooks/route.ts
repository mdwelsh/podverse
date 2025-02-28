import Cors from 'micro-cors';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { sendEmail } from '@/lib/email';
import { clerkClient } from '@clerk/nextjs/server';
import { getUser, userPrimaryEmailAddress } from '@/lib/users';

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
  }) as any;
  console.log(`Received Clerk webhook: ${JSON.stringify(payload, null, 2)}`);

  if (payload.type === 'user.created') {
    const userEmailAddress = userPrimaryEmailAddress(payload.data);
    sendEmail({
      subject: 'New user created',
      text: `A new user was created: ${userEmailAddress}`,
    });
  } else if (payload.type === 'session.created') {
    const userId = payload.data.user_id;
    const user = await clerkClient.users.getUser(userId);
    console.log(`User logged in: ${JSON.stringify(user, null, 2)}`);
    try {
      const userEmailAddress = userPrimaryEmailAddress(user);
      console.log(`User ${userEmailAddress} logged in`);
      sendEmail({
        subject: 'User login',
        text: `User logged in: ${userEmailAddress}`,
      });
    } catch (error) {
      console.error(`Got error sending email: ${error}`);
      console.error(error);
    }
  }
  return NextResponse.json({ ok: true });
}
