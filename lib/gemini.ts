import { GoogleGenerativeAI } from "@google/generative-ai";

// Types for Gemini API responses
export type GeminiResponse = {
  result: string;
  error?: string;
};

export type GeminiRequestType = "blog" | "image" | "default";

// Initialize Gemini API with environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Get the appropriate model based on request type
const getModel = () => {
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

// Generate content using Gemini API
export async function generateContent(
  prompt: string,
  type: GeminiRequestType = "default"
): Promise<GeminiResponse> {
  try {
    const model = getModel();
    
    let result: string;
    switch (type) {
      case "blog":
        const blogResponse = await model.generateContent(prompt);
        result = await blogResponse.response.text();
        break;
      
      case "image":
        // Note: For image generation, we'll need to use a different model
        result = "Image generation coming soon";
        break;

      default:
        const defaultResponse = await model.generateContent(prompt);
        result = await defaultResponse.response.text();
    }

    return { result };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return {
      result: "",
      error: error.message || "Failed to generate content"
    };
  }
}