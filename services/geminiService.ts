
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

const getAge = (dob?: string) => {
  if (!dob) return '';
  const diff = Date.now() - new Date(dob).getTime();
  const age = new Date(diff).getUTCFullYear() - 1970;
  return age;
};

export const generateDailyAffirmation = async (
  user: UserProfile,
  goals: VisionGoal[],
  timeOfDay: 'MORNING' | 'EVENING'
): Promise<string> => {
  try {
    if (!process.env.API_KEY) {
      return `I will achieve my dreams through discipline and focus.`;
    }

    // Pick a random goal to focus on to keep it specific and simple
    const randomGoal = goals.length > 0 ? goals[Math.floor(Math.random() * goals.length)] : null;
    
    let goalContext = "";
    if (randomGoal) {
        goalContext = `Focus specifically on this goal: "${randomGoal.title}" which is due on ${randomGoal.targetDate}.`;
    } else {
        goalContext = "Focus on general success and wealth.";
    }

    const prompt = `
      The user's name is ${user.name}.
      ${goalContext}
      
      Generate a SINGLE, short, powerful, and concrete affirmation statement.
      Structure it like this: "I will [achieve specific goal] by [specific action/trait]."
      
      Examples:
      - "I will buy my Lamborghini by remaining disciplined and closing 5 deals today."
      - "I will sign the contract by radiating confidence and preparation."
      - "I will achieve perfect health by sticking to my workout routine."
      
      Rules:
      1. Keep it under 20 words.
      2. No "Mystic" or flowery language. Be direct, grounded, and practical.
      3. Use "I will" or "I am".
      4. Do not use quotation marks.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "I will manifest my goals through consistent daily action.";
  } catch (error) {
    console.error("Gemini Affirmation Error:", error);
    return "I will manifest my goals through consistent daily action.";
  }
};

export const generateVisionBoardImage = async (
  title: string,
  categories: string[],
  user?: UserProfile
): Promise<string | null> => {
  try {
    if (!process.env.API_KEY) return null;

    let demographics = "";
    if (user) {
        const age = getAge(user.dob);
        const gender = user.gender;
        if (age || gender) {
            demographics = `The subject in the image should appear to be a ${gender || ''} ${age ? `around ${age} years old` : ''}.`;
        }
    }

    const prompt = `
      Generate a photorealistic, high-definition, cinematic image for a vision board.
      The goal is: "${title}".
      The context categories are: ${categories.join(', ')}.
      ${demographics}
      
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

export const generateLifestyleSuggestions = async (user: UserProfile): Promise<string[]> => {
    try {
        if (!process.env.API_KEY) return [
            "Sitting in a private jet cabin reviewing contracts",
            "Yoga on a yacht deck in the Mediterranean",
            "Walking a tiger on a leash in Dubai"
        ];

        const age = getAge(user.dob);
        const gender = user.gender;
        const demographics = `${gender || 'person'} ${age ? `aged ${age}` : ''}`;

        const prompt = `
            Generate 4 distinct, ultra-luxurious, and visually stunning lifestyle scenarios for a vision board app.
            Target Audience: A ${demographics}.
            Theme: Wealth, Health, Freedom, and High Status.
            
            Output format: Just the descriptions, separated by a pipe symbol "|". 
            Example: Driving a vintage convertible along the Amalfi Coast|Hosting a gala in a modern glass mansion
            Keep descriptions concise (under 12 words each) but evocative.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        const text = response.text?.trim() || "";
        return text.split('|').map(s => s.trim()).filter(s => s.length > 0).slice(0, 4);
    } catch (e) {
        console.error("Suggestion Error", e);
        return [
            "Driving a hypercar through Tokyo neon streets",
            "Meditating in a floating glass pod above a rainforest",
            "Signing a major deal in a skyscraper boardroom",
            "Relaxing in a thermal infinity pool in Iceland"
        ];
    }
}
