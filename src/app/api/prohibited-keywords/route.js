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
import fs from 'fs/promises';
import path from 'path';
export function POST(request) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield request.json();
        const filePath = path.join(process.cwd(), 'data', 'prohibited-keywords.json');
        try {
            yield fs.writeFile(filePath, JSON.stringify(data, null, 2));
            return NextResponse.json({ success: true });
        }
        catch (_a) {
            return NextResponse.json({ error: 'Failed to update keywords' }, { status: 500 });
        }
    });
}
