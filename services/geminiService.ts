import { GoogleGenAI } from "@google/genai";
import { UserProfile, VisionGoal } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Helper to convert blob/url to base64
const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // Remove data:image/...;base64, prefix if present
        const base64Content = base64data.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting URL to Base64:", error);
    throw error;
  }
};

export const generateDailyAffirmation = async (
  user: UserProfile,
  goals: VisionGoal[],
  timeOfDay: 'MORNING' | 'EVENING'
): Promise<string> => {
  try {
    if (!process.env.API_KEY) {
      return `I am ${user.name}, and I am worthy of my dreams.`;
    }

    const goalSummaries = goals.map(g => `[${g.categories.join(', ')}]: ${g.title}`).join("; ");
    
    let contextPrompt = "";
    if (timeOfDay === 'MORNING') {
      contextPrompt = "This is a Morning Affirmation. The tone should be energetic, setting a powerful intention for the day, and focused on taking action.";
    } else {
      contextPrompt = "This is an Evening Affirmation. The tone should be reflective, filled with gratitude, subconscious programming for sleep, and feeling that the wish is already fulfilled.";
    }

    const prompt = `
      The user's name is ${user.name}.
      They are manifesting the following desires: ${goalSummaries}.
      
      ${contextPrompt}
      
      Create a powerful, present-tense, "I am" affirmation.
      The overall aesthetic is "Mystic Luxury" - confident, serene, and abundant.
      Do not use quotation marks. Keep it under 25 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "I am aligning with the frequency of abundance.";
  } catch (error) {
    console.error("Gemini Affirmation Error:", error);
    return "I am aligning with the frequency of abundance.";
  }
};

export const generateVisionBoardImage = async (
  title: string,
  categories: string[]
): Promise<string | null> => {
  try {
    if (!process.env.API_KEY) return null;

    const prompt = `
      Generate a photorealistic, high-definition, cinematic image for a vision board.
      The goal is: "${title}".
      The context categories are: ${categories.join(', ')}.
      
      Aesthetic Style: "Mystic Luxury". Dark, moody, elegant, with subtle gold lighting accents. 
      The image should represent the successful achievement of this goal.
      
      CRITICAL: The image must be full bleed. Do NOT add any borders, frames, white margins, or text.
      Aspect Ratio: 16:9 (Landscape).
    `;

    // Using gemini-2.5-flash-image for image generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
    });

    // Extract image from response
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    return null;
  }
};

export const generatePersonalizedGoalImage = async (
  userSelfieUrl: string,
  goalTitle: string,
  categories: string[]
): Promise<string | null> => {
  try {
    if (!process.env.API_KEY) return null;

    const base64Image = await urlToBase64(userSelfieUrl);

    const prompt = `
      Use the provided image of the person as a reference for identity.
      Generate a high-quality, photorealistic image of this person achieving the following goal: "${goalTitle}".
      Context: ${categories.join(', ')}.
      
      Details:
      - Maintain the facial features and identity of the person in the input image.
      - The setting should be luxurious, cinematic, and represent the success of the goal.
      - Aesthetic: "Mystic Luxury", dark, moody, elegant with gold accents.
      - CRITICAL: Full bleed image. No borders, no frames, no polaroid style, no white edges.
      - Aspect Ratio: 16:9 (Landscape).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: 'image/png',
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Personalized Goal Image Image Error:", error);
    return null;
  }
};

export const generateLifestyleSimulation = async (
  userSelfieUrl: string,
  lifestyleDescription: string
): Promise<string | null> => {
  try {
    if (!process.env.API_KEY) return null;

    const base64Image = await urlToBase64(userSelfieUrl);

    const prompt = `
      Use the provided image of the person as a reference for identity.
      Generate a high-quality, photorealistic image of this person living the following lifestyle: ${lifestyleDescription}.
      
      Details:
      - Maintain the facial features and identity of the person in the input image.
      - The setting should be luxurious, cinematic, and match the description perfectly.
      - Lighting: Golden hour or cinematic mood lighting.
      - Quality: 4k, highly detailed.
      - CRITICAL: Full bleed image. No borders.
      - Aspect Ratio: 1:1 (Square).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: 'image/png', // Assuming png/jpeg, gemini handles standard types
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Lifestyle Simulation Error:", error);
    return null;
  }
};