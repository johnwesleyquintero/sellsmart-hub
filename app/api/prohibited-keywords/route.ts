import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  const data = await request.json();
  const filePath = path.join(process.cwd(), 'data', 'prohibited-keywords.json');

  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true });
  } catch (_) {
    return NextResponse.json(
      { error: 'Failed to update keywords' },
      { status: 500 },
    );
  }
}
