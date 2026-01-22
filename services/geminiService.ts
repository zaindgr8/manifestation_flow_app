
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

    // Combine all goals into the context
    let goalContext = "";
    if (goals.length > 0) {
        const goalDescriptions = goals.map(g => `"${g.title}" (Category: ${g.categories.join(', ')})`).join('; ');
        goalContext = `Integrate the energy of the following goals into one unified, powerful vision: ${goalDescriptions}.`;
    } else {
        goalContext = "Focus on general success, wealth, and high-performance living.";
    }

    const prompt = `
      The user's name is ${user.name}.
      ${goalContext}
      
      Generate a SINGLE, short, powerful, and concrete affirmation statement.
      It must unify the user's multiple goals into one cohesive sentence about their future reality.
      
      Structure it like this: "I will [unified achievement] by [specific action/trait]." or "I am [identity] who [achieves X and Y]."
      
      Examples:
      - "I am the CEO of my reality, closing million-dollar deals and maintaining perfect health daily."
      - "I will secure my dream home and travel the world by staying disciplined and focused on my business growth."
      
      Rules:
      1. Keep it under 25 words.
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

export const generateLifestyleSuggestions = async (user: UserProfile, goals: VisionGoal[]): Promise<string[]> => {
    try {
        if (!process.env.API_KEY) return [
            "Sitting in a private jet cabin reviewing contracts",
            "Yoga on a yacht deck in the Mediterranean",
            "Walking a tiger on a leash in Dubai"
        ];

        const age = getAge(user.dob);
        const gender = user.gender;
        const demographics = `${gender || 'person'} ${age ? `aged ${age}` : ''}`;
        
        let goalContext = "General Wealth and Freedom";
        if (goals.length > 0) {
            goalContext = goals.map(g => `Goal: ${g.title} (Area: ${g.categories.join(',')})`).join('; ');
        }

        const prompt = `
            Generate 4 distinct, ultra-luxurious, and vivid "reality shifting" fantasies/scenarios for a vision board app.
            
            User Profile: A ${demographics}.
            User's Specific Manifestation Goals: ${goalContext}.
            
            Instructions:
            1. Create specific scenarios that visualize the user HAVING ALREADY ACHIEVED these goals.
            2. Mix in sensory details (texture, location, feeling).
            3. Vary the settings (e.g., one home setting, one travel setting, one career moment).
            4. Make them "Mystic Luxury" style.
            
            Output format: Just the descriptions, separated by a pipe symbol "|". 
            Example: Signing the deed to the penthouse overlooking Central Park|Feeling the leather steering wheel of the new GT3 RS on the Autobahn
            Keep descriptions concise (under 15 words each).
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                temperature: 1.2, // High creativity/randomness
            }
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
