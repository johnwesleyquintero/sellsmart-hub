import { NextResponse } from 'next/server';
import { AmazonAlgorithms } from '@/lib/amazon-algorithms';
import type { InventoryData } from '@/lib/amazon-types';

export async function POST(request: Request) {
  try {
    const inventoryData: InventoryData = await request.json();
    
    // Validate required fields
    if (!inventoryData?.salesLast30Days || !inventoryData.leadTime) {
      return NextResponse.json(
        { error: 'Missing required inventory parameters' },
        { status: 400 }
      );
    }

    const recommendation = AmazonAlgorithms.calculateInventoryRecommendation(inventoryData);
    
    return NextResponse.json({
      data: recommendation,
      analysis: {
        message: 'Real-time inventory optimization calculated',
        timestamp: new Date().toISOString(),
        algorithmVersion: '1.0.0'
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process inventory optimization', details: error },
      { status: 500 }
    );
  }
}