
import { GoogleGenAI } from "@google/genai";

// Guideline: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMeetingAssistantAdvice = async (transcript: string) => {
  try {
    // Guideline: Use ai.models.generateContent directly
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an AI Meeting Assistant. Based on the following snippet of a video call conversation, provide a single, concise suggestion or follow-up question to keep the meeting productive. Be brief and professional. 
      
      Transcript: "${transcript}"`,
      config: {
        temperature: 0.7,
        // Guideline: Set maxOutputTokens and thinkingBudget together.
        maxOutputTokens: 100,
        thinkingConfig: { thinkingBudget: 50 },
      }
    });
    // Guideline: Use .text property to get the generated text
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm listening and ready to help when needed.";
  }
};
