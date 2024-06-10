import Cors from 'micro-cors';
//import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

const cors = Cors({
  allowMethods: ['POST', 'HEAD'],
});

export async function POST(req: Request) {
  const body = await req.text();
  console.log(`Received Clerk webhook: ${body}`);
  return NextResponse.json({ ok: true });
}
