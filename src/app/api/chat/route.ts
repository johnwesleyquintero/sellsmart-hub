import chatContext from '@/data/chat-context.json';
import { checkRedisConnection, rateLimiter, redis } from '@/lib/redis/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Redis connection check
checkRedisConnection().then((isConnected) => {
  if (!isConnected) {
    console.warn('Redis connection failed. Chat service may be degraded.');
  }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function checkRateLimit(request: NextRequest) {
  const identifier = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const { success } = await rateLimiter.limit(identifier);
  if (!success) {
    return new NextResponse('Too many requests', { status: 429 });
  }
  return null;
}

async function validateRequest(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }

  const body = await request.json();
  if (!body || !body.message?.trim()) {
    return new NextResponse('Message is required', { status: 400 });
  }
  return body;
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await checkRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await validateRequest(request);
    if (body instanceof NextResponse) return body;

    const { message, history = [] } = body;

    // Create a context-aware prompt that includes portfolio information
    const contextPrompt = `You are an AI assistant for Wesley Quintero's portfolio website. You have access to the following information about Wesley:

    Personal Information:
    - Name: ${chatContext.personalContext.personalInfo.name}
    - Email: ${chatContext.personalContext.personalInfo.email}
    - Location: ${chatContext.personalContext.personalInfo.location}
    - Phone: ${chatContext.personalContext.personalInfo.phone}
    - Role: ${chatContext.personalContext.professionalProfile.title}
    - Expertise: ${chatContext.personalContext.professionalProfile.description}
    - Core Competencies: ${chatContext.personalContext.professionalProfile.coreCompetencies.join(', ')}

    Technical Skills:
    - Expert in: ${chatContext.personalContext.skills.technical.expert.join(', ')}
    - Advanced in: ${chatContext.personalContext.skills.technical.advanced.join(', ')}
    - Soft Skills: ${chatContext.personalContext.skills.soft.join(', ')}

    Amazon Expertise:
    - Certifications: ${chatContext.personalContext.amazonExpertise.certifications.map((c) => c.name).join(', ')}
    - Areas: ${chatContext.personalContext.amazonExpertise.areasOfExpertise.join(', ')}

    Web App Information:
    - Project: ${chatContext.webappContext.projectOverview.name}
    - Description: ${chatContext.webappContext.projectOverview.description}

    Additional Resources:
    - Blog: ${chatContext.personalContext.personalInfo.socialLinks.blog}
    - Amazon Tools Blog: ${chatContext.personalContext.personalInfo.socialLinks.amazonToolsBlog}
    - AI Implementation Blog: ${chatContext.personalContext.personalInfo.socialLinks.aiBlog}
    - E-commerce Tips Blog: ${chatContext.personalContext.personalInfo.socialLinks.ecommerceBlog}

    Please provide accurate, personalized responses based on this information. For contact inquiries, share the appropriate contact details from the portfolio data. Do not mention that you are an AI assistant.

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

    const chat = model.startChat({ history: history });

    // Implement exponential backoff for API calls
    let retries = 0;
    let lastError;

    while (retries < MAX_RETRIES) {
      try {
        console.log('Sending message to Gemini:', contextPrompt);
        const result = await chat.sendMessage(contextPrompt);
        const response = result.response;
        console.log('Gemini response:', response);
        return NextResponse.json({
          response: response.text(),
        });
      } catch (error) {
        lastError = error;
        retries++;
        if (retries < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, retries - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  } catch (error: unknown) {
    console.error('Chat API Error:', error);

    // Determine specific error type and appropriate status code
    let statusCode = 500;
    let errorMessage =
      'Our chat service is temporarily unavailable. Please try again later.';
    let errorDetails = 'Unknown error';

    if (error instanceof Error) {
      errorDetails = error.message;

      if (
        'name' in error &&
        (error.name === 'AbortError' || error.name === 'TimeoutError')
      ) {
        statusCode = 504; // Gateway Timeout
        errorMessage = 'The request timed out. Please try again.';
      } else if (
        'message' in error &&
        error.message?.includes('GEMINI_API_KEY')
      ) {
        statusCode = 503; // Service Unavailable
        errorMessage =
          'Chat service configuration error. Please try again later.';
      } else if (
        'message' in error &&
        error.message?.toLowerCase().includes('rate limit')
      ) {
        statusCode = 429; // Too Many Requests
        errorMessage =
          'Too many requests. Please wait a moment before trying again.';
      }
    }

    // Enhanced error logging
    if (error instanceof Error) {
      console.error('Chat API Error Details:', {
        message: errorDetails,
        timestamp: new Date().toISOString(),
        statusCode,
        ...(body?.message ? { lastMessage: body.message } : {}),
        retryCount: MAX_RETRIES,
        retryStatus: 'Failed after all retries',
        redisAvailable: redis !== null,
        requestId: request.headers.get('x-request-id') || 'unknown',
      });
    }
    else {
      console.error('Chat API Error:', error);
    }

    return NextResponse.json(
      {
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && {
          details: errorDetails,
          code: statusCode,
        }),
      },
      { status: statusCode },
    );
  }
}
