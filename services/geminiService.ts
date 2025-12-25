
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getMeetingAssistantAdvice = async (transcript: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an AI Meeting Assistant. Based on the following snippet of a video call conversation, provide a single, concise suggestion or follow-up question to keep the meeting productive. Be brief and professional. 
      
      Transcript: "${transcript}"`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 100,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm listening and ready to help when needed.";
  }
};
