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
    - Name: ${portfolioContext.personalContext.personalInfo.name}
    - Email: ${portfolioContext.personalContext.personalInfo.email}
    - Location: ${portfolioContext.personalContext.personalInfo.location}
    - Phone: ${portfolioContext.personalContext.personalInfo.phone}
    - Role: ${portfolioContext.personalContext.professionalProfile.title}
    - Expertise: ${portfolioContext.personalContext.professionalProfile.description}
    - Core Competencies: ${portfolioContext.personalContext.professionalProfile.coreCompetencies.join(', ')}
    
    Technical Skills:
    - Expert in: ${portfolioContext.personalContext.skills.technical.expert.join(', ')}
    - Advanced in: ${portfolioContext.personalContext.skills.technical.advanced.join(', ')}
    - Soft Skills: ${portfolioContext.personalContext.skills.soft.join(', ')}
    
    Amazon Expertise:
    - Certifications: ${portfolioContext.personalContext.amazonExpertise.certifications.map((c) => c.name).join(', ')}
    - Areas: ${portfolioContext.personalContext.amazonExpertise.areasOfExpertise.join(', ')}
    
    Web App Information:
    - Project: ${portfolioContext.webappContext.projectOverview.name}
    - Description: ${portfolioContext.webappContext.projectOverview.description}
    
    Additional Resources:
    - Blog: ${portfolioContext.personalContext.personalInfo.socialLinks.blog}
    - Amazon Tools Blog: ${portfolioContext.personalContext.personalInfo.socialLinks.amazonToolsBlog}
    - AI Implementation Blog: ${portfolioContext.personalContext.personalInfo.socialLinks.aiBlog}
    - E-commerce Tips Blog: ${portfolioContext.personalContext.personalInfo.socialLinks.ecommerceBlog}

    Please provide accurate, personalized responses based on this information. For contact inquiries, share the appropriate contact details from the portfolio data.
    
    Previous conversation context:
    ${history.map((msg: { role: string; content: string }) => `${msg.role}: ${msg.content}`).join('\n')}
    
    Current user message: ${message}`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-001',
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
