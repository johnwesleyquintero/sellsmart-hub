var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { AmazonAlgorithms } from '@/lib/calculations/amazon-algorithms';
import { NextResponse } from 'next/server';
export function POST(request) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const inventoryData = yield request.json();
            // Validate required fields
            if (!(inventoryData === null || inventoryData === void 0 ? void 0 : inventoryData.salesLast30Days) || !(inventoryData === null || inventoryData === void 0 ? void 0 : inventoryData.leadTime)) {
                return NextResponse.json({ error: 'Missing required inventory parameters' }, { status: 400 });
            }
            const recommendation = AmazonAlgorithms.calculateInventoryRecommendation(inventoryData.currentInventory, inventoryData.averageDailySales);
            return NextResponse.json({
                data: recommendation,
                analysis: {
                    message: 'Real-time inventory optimization calculated',
                    timestamp: new Date().toISOString(),
                    algorithmVersion: '1.0.0',
                },
            });
        }
        catch (error) {
            return NextResponse.json({ error: 'Failed to process inventory optimization', details: error }, { status: 500 });
        }
    });
}
