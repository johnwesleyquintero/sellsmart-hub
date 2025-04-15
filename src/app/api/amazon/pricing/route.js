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
            const { basePrice, competition, demandFactor } = yield request.json();
            if (!basePrice || !(competition === null || competition === void 0 ? void 0 : competition.length) || !demandFactor) {
                return NextResponse.json({ error: 'Missing required pricing parameters' }, { status: 400 });
            }
            const optimalPrice = AmazonAlgorithms.calculateOptimalPrice(Number(basePrice), Number(competition), [Number(demandFactor)], // Wrap in array to match number[] parameter type
            [...Array(30).fill(95)], 0.8, 1.2);
            return NextResponse.json({
                data: { optimalPrice },
                analysis: {
                    message: 'Dynamic pricing calculation completed',
                    timestamp: new Date().toISOString(),
                    algorithmVersion: '1.1.0',
                },
            });
        }
        catch (error) {
            return NextResponse.json({ error: 'Failed to process pricing strategy', details: error }, { status: 500 });
        }
    });
}
