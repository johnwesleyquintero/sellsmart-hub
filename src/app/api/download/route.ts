export const dynamic = 'force-static';
import { rateLimiter } from '@/lib/rate-limiter';
import { readFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';

export async function GET() {
  // Apply rate limiting
  const rateLimitResult = await rateLimiter.limit();
  if (!rateLimitResult.success) {
    return new NextResponse('Rate limit exceeded', { status: 429 });
  }

  try {
    const filePath = path.join(
      process.cwd(),
      'public',
      'profile',
      'Wesley Quintero - Resume.pdf',
    );
    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          'attachment; filename="Wesley_Quintero_Resume.pdf"',
      },
    });
  } catch (error) {
    console.error('Error serving PDF:', error);
    return new NextResponse('File not found', { status: 404 });
  }
}
