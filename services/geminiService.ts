
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { UserProfile, VisionGoal } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.EXPO_PUBLIC_API_KEY as string });

// Relaxed safety settings to prevent false positives for benign requests.
// We use BLOCK_NONE where possible or BLOCK_ONLY_HIGH to maximize creative freedom.
const RELAXED_SAFETY_SETTINGS = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE },
];


/**
 * Proactively replaces "risky" keywords with safe, high-aesthetic alternatives
 * to prevent initial AI block or latent image generation blocks.
 */
const sanitizeText = (text: string): string => {
    const wordMap: Record<string, string> = {
        'sexy': 'elegant',
        'hot': 'radiant',
        'naked': 'artistic',
        'nude': 'sculptural',
        'porn': 'luxury',
        'sex': 'intimacy',
        'girlfriend': 'partner',
        'boyfriend': 'companion',
        'wife': 'partner',
        'husband': 'partner',
        'woman': 'subject',
        'women': 'subjects',
        'man': 'subject',
        'men': 'subjects',
        'girl': 'youthful subject',
        'boy': 'youthful subject',
        'bed': 'lifestyle',
        'lover': 'partner',
        'lust': 'passion',
        'erotic': 'aesthetic',
        'kiss': 'embrace',
        'touch': 'connection',
        'hold': 'support',
        'date': 'evening',
        'pakistan': 'vibrant nation',
        'india': 'vibrant nation',
        'president': 'statesman',
        'prime minister': 'leader',
        'politics': 'leadership',
        'election': 'transition',
        'government': 'authority',
        'war': 'conflict resolution',
        'gun': 'instrument',
        'weapon': 'artifact',
        'blood': 'crimson',
        'kill': 'overcome',
        'death': 'legacy',
        'suicide': 'renewal',
        'fight': 'strive'
    };

    let sanitized = text.toLowerCase();
    Object.keys(wordMap).forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        sanitized = sanitized.replace(regex, wordMap[word]);
    });
    return sanitized;
};

/**
 * Pre-processes user goals into safe, high-quality, cinematic image descriptions.
 * This acts as a "soft-filter" and enhancement layer.
 */
const refineImagePrompt = async (userPrompt: string, categories: string[]): Promise<string> => {
  // Pre-sanitize at word level to prevent the AI itself from being blocked
  const preSanitizedPrompt = sanitizeText(userPrompt);

  try {
    const prompt = `
      You are a specialized prompt architect for an AI manifestation vision board.
      User Goal: "${preSanitizedPrompt}"
      Categories: ${categories.join(', ')}

      TASK:
      Convert this user goal into a singular, highly-detailed, photorealistic, and cinematic image description.

      INSTRUCTIONS:
      1. TRANSLATION: If the goal involves people (e.g., "partner"), describe a warm, elegant, and safe emotional scene (e.g., a joyful embrace in a moonlit garden).
      2. NEUTRALIZATION: If the user input is potentially explicit, controversial, or "risky", COMPLETELY transmute it into a "Mystic Luxury" version that represents the UNDERLYING desire (wealth, success, intimacy) in a safe, high-fashion, and tasteful way. 
      3. AESTHETIC: Focus on "Mystic Luxury" style: Deep shadows, moody atmosphere, rich textures (velvet, marble, silk), and subtle gold light accents.
      4. COMPOSITION: Describe the lighting (volumetric, golden hour, or dim-lit elegance) and the perspective (close-up or medium shot).
      5. NEGATIVE CONSTRAINTS: Never use words like "sexy", "hot", "body", "bed", "naked", or any suggestive terms. Focus on elegance and success.
      6. SAFETY: Ensure the final description is safe-for-work and adheres to AI safety standards while remaining emotionally resonant.
      7. OUTPUT: Return ONLY the refined description. No explanation.
    `;

    const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            safetySettings: RELAXED_SAFETY_SETTINGS
        }
    });

    const refined = result.text?.trim();
    if (!refined || refined.length < 5) throw new Error("Empty AI result");
    
    return refined;
  } catch (e) {
    console.error("Prompt refinement failed, using fallback safe description:", e);
    // GUARANTEE: Never return the raw user prompt if it might be risky.
    // Return a safe "Generic Success" prompt instead.
    return `A cinematic, highly-aesthetic "Mystic Luxury" representation of ${categories[0] || 'Success'}. Elegant atmosphere, gold accents, professional composition, 8k resolution.`;
  }
};

/**
 * Executes the actual image generation call with safety handling and fallback support.
 */
const executeImageGeneration = async (
    contents: any,
    isPersonalized: boolean = false
): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents,
            config: {
                responseModalities: ['IMAGE', 'TEXT'],
                safetySettings: RELAXED_SAFETY_SETTINGS,
            },
        });

        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        
        // If we get here but no image was in parts, it might have been blocked without error
        return null;
    } catch (error: any) {
        const errorStr = error?.message || String(error);
        console.error("Image Generation Attempt Failed:", errorStr);
        
        // If it's a safety error, we want the caller to know so they can try a fallback
        if (errorStr.toLowerCase().includes('safety') || errorStr.toLowerCase().includes('blocked') || errorStr.toLowerCase().includes('finish_reason_safety')) {
            throw new Error("SAFETY_BLOCK");
        }
        
        return null;
    }
};


// Helper to convert a file:// or http(s):// URL to base64.
// If a data: URI is passed (from picker with base64:true), extract the base64 directly.
// Uses ArrayBuffer + manual encoding so it works in React Native
// (FileReader and blob: URLs are Web-only and crash on iOS/Android).
const urlToBase64 = async (url: string): Promise<string> => {
  try {
    // Fast path: data: URI already contains base64 — just strip the prefix
    if (url.startsWith('data:')) {
      const base64Part = url.split(',')[1];
      if (base64Part) return base64Part;
    }

    // Guard: blob: URLs are Web-only and crash React Native's fetch
    if (url.startsWith('blob:')) {
      throw new Error(
        'blob: URLs are not supported in React Native. ' +
        'Please use the image picker with base64:true to get a data URI instead.'
      );
    }

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
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
  goals: VisionGoal[]
): Promise<string> => {
  try {
    if (!process.env.EXPO_PUBLIC_API_KEY) {
      return `I will achieve my dreams through discipline and focus.`;
    }

    // Combine all goals into the context
    let goalContext = "";
    if (goals.length > 0) {
        const goalDescriptions = goals.map(g => `"${g.title}" (Category: ${g.categories.join(', ')})`).join('; ');
        goalContext = `The user is currently manifesting the following specific goals: ${goalDescriptions}.`;
    } else {
        goalContext = "Focus on general abundance, purpose-driven success, and powerful manifestation.";
    }

    const prompt = `
      Name: ${user.name}
      Goal Context: ${goalContext}
      Create a simple, relatable, and easy-to-read daily affirmation.
      This affirmation should feel encouraging and personal, as if the user is already achieving their goals.
      
      Style:
      - Simple, clear, and natural language.
      - Relatable and warm (avoid complex jargon or overly dramatic "shifts").
      - Use "I am" or "I have" to signify current reality.
      - Make it sound like a supportive friend talking.
      
      Format:
      - Short (under 15 words).
      - No quotes.
      - Just the affirmation.

      Objective: Write it in plain English so it's easy to understand at a glance.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "I am currently living my highest potential.";
  } catch (error) {
    console.error("Gemini Affirmation Error:", error);
    return "I am currently living my highest potential.";
  }
};

export const generateVisionBoardImage = async (
  title: string,
  categories: string[],
  user?: UserProfile
): Promise<string | null> => {
  try {
    if (!process.env.EXPO_PUBLIC_API_KEY) return null;

    let demographics = "";
    if (user) {
        const age = getAge(user.dob);
        const gender = user.gender;
        if (age || gender) {
            demographics = `The subject in the image should appear to be a ${gender || ''} ${age ? `around ${age} years old` : ''}.`;
        }
    }

    const refinedPrompt = await refineImagePrompt(title, categories);

    const finalImagePrompt = `
      ${refinedPrompt}
      ${demographics}
      
      Technical Requirements:
      - Photorealistic, high-definition.
      - Full bleed (No borders, headers, or text).
      - Aspect Ratio: 16:9.
    `;

    let imageUrl: string | null = null;
    
    try {
        imageUrl = await executeImageGeneration(finalImagePrompt);
    } catch (e: any) {
        if (e.message === "SAFETY_BLOCK") {
            console.log("Primary prompt blocked by safety. Attempting neutral fallback...");
        } else {
            console.error("Primary image gen failed:", e);
        }
    }

    // SOFT-FAIL Fallback 1: Neutral Aesthetic Success
    if (!imageUrl) {
        try {
            imageUrl = await executeImageGeneration(`
                A stunning, cinematic, and abstract "Mystic Luxury" representation of ${categories[0] || 'Success'}. 
                Gold accents, deep moody lighting, high-end artistic composition. 
                Full bleed, no text. Aspect ratio 16:9.
            `);
        } catch (fallbackError) {
            console.log("Secondary fallback failed safety. Attempting absolute safe fallback...");
        }
    }

    // SOFT-FAIL Fallback 2: Absolute Safe Placeholder (Nature/Light)
    if (!imageUrl) {
        try {
            imageUrl = await executeImageGeneration(`
                A serene, high-definition "Mystic Luxury" scene of golden sunlight filtering through soft silk curtains 
                in a minimalist marble room. Calm, successful, and abundant atmosphere.
                Full bleed, no text. Aspect ratio 16:9.
            `);
        } catch (absoluteError) {
            console.error("All image generation layers failed.");
        }
    }

    return imageUrl;
  } catch (error) {
    console.error("Vision Board Image Error:", error);
    return null;
  }
};

/**
 * Detects the MIME type of an image from its URL/data URI extension.
 * Defaults to image/jpeg which covers most phone camera photos.
 */
const detectMimeType = (url: string): string => {
  if (url.startsWith('data:')) {
    const match = url.match(/^data:([^;]+);/);
    return match ? match[1] : 'image/jpeg';
  }
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif'
  };
  return (ext && map[ext]) || 'image/jpeg';
};

export const generatePersonalizedGoalImage = async (
  userSelfieUrl: string,
  goalTitle: string,
  categories: string[]
): Promise<string | null> => {
  try {
    if (!process.env.EXPO_PUBLIC_API_KEY) return null;

    const base64Image = await urlToBase64(userSelfieUrl);
    const mimeType = detectMimeType(userSelfieUrl);

    // Build a goal-scene description WITHOUT sanitizer stripping "person" references,
    // so the AI knows to put a human subject in the scene.
    const sanitizedGoal = sanitizeText(goalTitle);
    const categoryLabel = categories[0] || 'Success';

    // Craft a strong, face-forward cinematic prompt
    const finalImagePrompt = `
      REFERENCE IMAGE: The person in the attached photo is the SUBJECT of this image.
      
      TASK: Generate a stunning, photorealistic, cinematic image showing THIS EXACT PERSON actively living their achieved goal.
      
      GOAL: "${sanitizedGoal}" (Category: ${categoryLabel})
      
      COMPOSITION RULES — CRITICAL:
      1. FACE PROMINENT: The person's face must be the clear focal point — large, sharp, and recognizable. DO NOT obscure, blur, or minimize their face. Camera should be at eye-level or slightly above.
      2. IN SCENE: Place the person INSIDE the goal scenario as the hero. They are not a background element — they are the main character in this moment of triumph.
      3. FIRST-PERSON PRESENCE: Use a medium-shot (waist-up) or portrait framing that shows their face clearly alongside the environment. Example framings: "standing at the helm of...", "seated at their desk in...", "overlooking their empire from...".
      4. BODY LANGUAGE: Confident, calm, powerful. Arms resting, leaning forward with authority, or gazing into the horizon with certainty.
      
      SCENE CONTEXT (match to goal category "${categoryLabel}"):
      - Business & Career → Executive boardroom, glass-and-steel HQ, signing a contract, addressing a team
      - Wealth & Finance → Luxury penthouse, private jet interior, superyacht deck, sleek car showroom
      - Health & Fitness → Elite gym, scenic morning run route, athletic achievement podium
      - Relationships → Warm upscale home setting, celebratory dinner, joyful elegant gathering
      - Travel & Experience → World-class destination, private villa, iconic landmark in the background
      - Default → Aspirational, elevated lifestyle scene with golden-hour cinematic lighting
      
      AESTHETIC:
      - Photorealistic, 8K, cinematic quality
      - Moody gold and warm tones, volumetric light
      - Luxury "Mystic Elegance" atmosphere
      - No text, watermarks, or borders — full bleed
      - Aspect ratio: 16:9
    `;

    const inlineData = { data: base64Image, mimeType };
    
    let imageUrl: string | null = null;
    
    // Attempt 1: Full personalized scene
    try {
        imageUrl = await executeImageGeneration({
            parts: [
                { inlineData },
                { text: finalImagePrompt }
            ]
        }, true);
    } catch (e: any) {
        console.log("Personalized scene gen blocked. Trying confident portrait fallback...");
    }

    // Attempt 2: Confident portrait (safer, still face-forward)
    if (!imageUrl) {
        const portraitFallback = `
            REFERENCE IMAGE: The person in the attached photo is the SUBJECT.
            Create a cinematic, high-fashion portrait of this exact person.
            They look composed, powerful, and successful.
            Medium shot — face visible and sharp, warm gold-toned studio lighting.
            Background: blurred luxury setting (office, skyline, or elegant interior).
            Full bleed, no text. Aspect ratio 16:9. Photorealistic, 8K.
        `;
        try {
            imageUrl = await executeImageGeneration({
                parts: [{ inlineData }, { text: portraitFallback }]
            }, true);
        } catch (err) {
            console.log("Portrait fallback also blocked. Using minimal safe portrait...");
        }
    }

    // Attempt 3: Minimal safe portrait (last resort)
    if (!imageUrl) {
        const safeFinal = `
            Use the face in the reference image.
            A serene, close-up editorial portrait in soft warm lighting.
            Elegant, peaceful, abundant. Full bleed, no text. Aspect ratio 16:9.
        `;
        imageUrl = await executeImageGeneration({
            parts: [{ inlineData }, { text: safeFinal }]
        }, true).catch(() => null);
    }

    return imageUrl;
  } catch (error) {
    console.error("Personalized Goal Image Error:", error);
    return null;
  }
};

export const generateLifestyleSimulation = async (
  userSelfieUrl: string,
  lifestyleDescription: string
): Promise<string | null> => {
  try {
    if (!process.env.EXPO_PUBLIC_API_KEY) return null;

    const base64Image = await urlToBase64(userSelfieUrl);

    const refinedPrompt = await refineImagePrompt(lifestyleDescription, ['Lifestyle']);

    const finalImagePrompt = `
      Use the provided face for identity.
      ${refinedPrompt}

      Technical Requirements:
      - Maintain identity accurately.
      - Aspect Ratio: 1:1.
      - Full bleed (No borders).
    `;

    const parts = [
        { inlineData: { data: base64Image, mimeType: 'image/png' } },
        { text: finalImagePrompt }
    ];

    let imageUrl = await executeImageGeneration({ parts });

    // SOFT-FAIL Fallback: If blocked, try a very safe square portrait
    if (!imageUrl) {
        console.log("Lifestyle image gen failed. Attempting safe fallback with identity...");
        const safeFallbackPrompt = `
            Use the provided face for identity.
            A cinematic, highly-detailed square portrait of this person in a serene, luxurious setting. 
            Golden hour lighting, artistic composition. 
            Full bleed. Aspect ratio 1:1.
        `;
        imageUrl = await executeImageGeneration({ 
            parts: [
                { inlineData: { data: base64Image, mimeType: 'image/png' } },
                { text: safeFallbackPrompt }
            ] 
        });
    }

    return imageUrl;
  } catch (error) {
    console.error("Lifestyle Simulation Error:", error);
    return null;
  }
};

export const generateLifestyleSuggestions = async (user: UserProfile, goals: VisionGoal[]): Promise<string[]> => {
    try {
        if (!process.env.EXPO_PUBLIC_API_KEY) return [
            "Sitting in a private jet cabin reviewing contracts",
            "Yoga on a yacht deck in the Mediterranean",
            "Walking a tiger on a leash in Dubai"
        ];

        const age = getAge(user.dob);
        // Gender is explicitly excluded for unisex/generic output
        const demographics = `person ${age ? `aged ${age}` : ''}`;
        
        let goalContext = "General Wealth and Freedom";
        if (goals.length > 0) {
            goalContext = goals.map(g => `Goal: ${g.title} (Area: ${g.categories.join(',')})`).join('; ');
        }

        const prompt = `
            Generate 4 short, simple, and relatable scene ideas for a vision board app.
            
            User Profile: A ${demographics}.
            User's Goals: ${goalContext}.
            
            Instructions:
            1. Each scene should show the user LIVING their goal — already achieved.
            2. Keep language simple, natural, and easy to read. No complex or dramatic wording.
            3. Make it personal and grounded — like a real moment they can picture clearly.
            4. Vary settings: home, travel, work, lifestyle.
            5. CRITICAL: Use gender-neutral, first-person style. No he/him/she/her.
            
            Output format: Just the descriptions, separated by a pipe symbol "|". 
            Example: Waking up in a penthouse with a city view|Signing my first big deal at the office
            Keep each description under 12 words. Simple everyday English.
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
