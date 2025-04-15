var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { NextResponse } from 'next/server';
function processCSVData(data) {
    const headers = data[0].split(',').map((h) => h.trim());
    const rows = data.slice(1);
    const processedData = {};
    rows.forEach((row) => {
        const values = row.split(',');
        const volume = Number(values[headers.indexOf('volume')]);
        const date = values[headers.indexOf('date')];
        const keyword = values[headers.indexOf('keyword')];
        if (!processedData[keyword]) {
            processedData[keyword] = [];
        }
        processedData[keyword].push({ date, volume });
    });
    return processedData;
}
export function POST(request) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { csvData } = (yield request.json());
            let trendData = [];
            if (csvData) {
                const processedData = processCSVData(csvData);
                const dates = [
                    ...new Set(csvData.slice(1).map((row) => row.split(',')[2])),
                ].sort();
                trendData = dates.map((date) => {
                    const dataPoint = {
                        name: date,
                    };
                    Object.keys(processedData).forEach((keyword) => {
                        const entry = processedData[keyword].find((e) => e.date === date);
                        dataPoint[keyword] = entry ? entry.volume : 0;
                    });
                    return dataPoint;
                });
            }
            else {
                throw new Error('Please provide CSV data for keyword trend analysis');
            }
            return NextResponse.json(trendData);
        }
        catch (error) {
            console.error('Error processing keyword trends:', error);
            return NextResponse.json({
                error: error instanceof Error
                    ? error.message
                    : 'Failed to process keyword trends',
            }, { status: 500 });
        }
    });
}
