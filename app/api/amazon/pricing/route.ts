import { NextResponse } from 'next/server';
import { AmazonAlgorithms } from '@/lib/amazon-algorithms';

export async function POST(request: Request) {
  try {
    const { basePrice, competition, demandFactor } = await request.json();
    
    if (!basePrice || !competition?.length || !demandFactor) {
      return NextResponse.json(
        { error: 'Missing required pricing parameters' },
        { status: 400 }
      );
    }

    const optimalPrice = AmazonAlgorithms.calculateOptimalPrice(
      basePrice,
      competition,
      demandFactor
    );

    return NextResponse.json({
      data: { optimalPrice },
      analysis: {
        message: 'Dynamic pricing calculation completed',
        timestamp: new Date().toISOString(),
        algorithmVersion: '1.1.0'
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process pricing strategy', details: error },
      { status: 500 }
    );
  }
}