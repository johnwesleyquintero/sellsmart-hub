import { type NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json(
      {
        message:
          'Static files are now being used instead of dynamic generation',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error generating placeholder:', error);
    return NextResponse.json(
      { error: 'Error generating placeholder' },
      { status: 500 },
    );
  }
}
