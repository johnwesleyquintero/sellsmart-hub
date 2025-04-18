import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const chat = model.startChat();
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();
    
    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}