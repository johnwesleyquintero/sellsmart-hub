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
import { readFile } from 'fs/promises';
import path from 'path';
export function GET() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const filePath = path.join(process.cwd(), 'public', 'profile', 'Wesley Quintero - Resume.pdf');
            const fileBuffer = yield readFile(filePath);
            return new NextResponse(fileBuffer, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'attachment; filename="Wesley_Quintero_Resume.pdf"',
                },
            });
        }
        catch (error) {
            console.error('Error serving PDF:', error);
            return new NextResponse('File not found', { status: 404 });
        }
    });
}
