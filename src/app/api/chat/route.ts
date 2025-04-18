import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Missing GEMINI_API_KEY environment variable');
    }
    
    const { message, history = [] } = await request.json();
    
    // Create a context-aware prompt that includes information about our webapp
    const contextPrompt = `You are an AI assistant for our portfolio webapp. You help users with:
    - Navigating the portfolio sections (About, Projects, Blog, etc)
    - Understanding technical project details
    - Providing relevant recommendations based on user interests
    - Answering questions about skills and experience
    Please provide helpful, context-aware responses.
    
    Previous conversation context:
    ${history.map((msg: { role: string; content: string }) => `${msg.role}: ${msg.content}`).join('\n')}
    
    Current user message: ${message}`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest",
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
        topP: 0.8,
        topK: 40
      }
    });
    
    const chat = model.startChat();
    const result = await chat.sendMessage(contextPrompt);
    const response = await result.response;
    
    return NextResponse.json({ 
      response: response.text() 
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process chat message',
        ...(process.env.NODE_ENV === 'development' && { stack: error instanceof Error ? error.stack : undefined })
      },
      { status: 500 }
    );
  }
}