import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

export async function GET() {
  return Response.json({ status: 'ok' });
}

export async function POST() {
  return Response.json({ status: 'ok' });
}
