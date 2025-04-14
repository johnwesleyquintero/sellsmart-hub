import { AmazonAlgorithms } from '@/lib/calculations/amazon-algorithms';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { basePrice, competition, demandFactor } = await request.json();

    if (!basePrice || !competition?.length || !demandFactor) {
      return NextResponse.json(
        { error: 'Missing required pricing parameters' },
        { status: 400 },
      );
    }

    const optimalPrice = AmazonAlgorithms.calculateOptimalPrice(
      Number(basePrice),
      Number(competition),
      [Number(demandFactor)], // Wrap in array to match number[] parameter type
      [...Array(30).fill(95)],
      0.8,
      1.2,
    );

    return NextResponse.json({
      data: { optimalPrice },
      analysis: {
        message: 'Dynamic pricing calculation completed',
        timestamp: new Date().toISOString(),
        algorithmVersion: '1.1.0',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process pricing strategy', details: error },
      { status: 500 },
    );
  }
}
