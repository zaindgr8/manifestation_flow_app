import { GoogleGenAI } from "@google/genai";
import { UserProfile, VisionGoal } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateDailyAffirmation = async (
  user: UserProfile,
  goals: VisionGoal[]
): Promise<string> => {
  try {
    if (!process.env.API_KEY) {
      console.warn("No API Key provided, returning fallback affirmation.");
      return `I am ${user.name}, and I am worthy of my dreams.`;
    }

    const goalSummaries = goals.map(g => `${g.category}: ${g.title}`).join(", ");
    
    const prompt = `
      The user's name is ${user.name}.
      They are manifesting the following desires: ${goalSummaries}.
      
      Create a powerful, present-tense, "I am" affirmation that combines these desires into a single sentence.
      The tone should be "Mystic Luxury" - confident, serene, and abundant.
      Do not use quotation marks. Keep it under 25 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "I am aligning with the frequency of abundance today.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I am aligning with the frequency of abundance today.";
  }
};