import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Missing GEMINI_API_KEY environment variable');
    }

    const { message, history = [] } = await request.json();

    // Load portfolio context
    const portfolioContext = await import('@/data/chat-context.json');

    // Create a context-aware prompt that includes portfolio information
    const contextPrompt = `You are an AI assistant for Wesley Quintero's portfolio website. You have access to the following information about Wesley:

    Personal Information:
    - Name: ${portfolioContext.chatContext.personalInfo.name}
    - Role: ${portfolioContext.chatContext.professionalProfile.title}
    - Expertise: ${portfolioContext.chatContext.professionalProfile.description}
    
    Technical Skills:
    - Expert in: ${portfolioContext.chatContext.skills.technicalExpert.join(', ')}
    - Advanced in: ${portfolioContext.chatContext.skills.technicalAdvanced.join(', ')}
    - Soft Skills: ${portfolioContext.chatContext.skills.softSkills.join(', ')}
    
    Amazon Expertise:
    - ${portfolioContext.chatContext.amazonExpertise.sellerCentral.role} for Amazon Seller Central
    - ${portfolioContext.chatContext.amazonExpertise.developerCentral.role}

    Please provide accurate, personalized responses based on this information. For contact inquiries, share the appropriate contact details from the portfolio data.
    
    Previous conversation context:
    ${history.map((msg: { role: string; content: string }) => `${msg.role}: ${msg.content}`).join('\n')}
    
    Current user message: ${message}`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-latest',
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
    });

    const chat = model.startChat();
    const result = await chat.sendMessage(contextPrompt);
    const response = await result.response;

    return NextResponse.json({
      response: response.text(),
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process chat message',
        ...(process.env.NODE_ENV === 'development' && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 },
    );
  }
}
