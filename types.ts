
export type Gender = 'Male' | 'Female' | 'Non-Binary' | 'Prefer not to say';

export interface UserProfile {
  name: string;
  gender?: Gender;
  dob?: string; // YYYY-MM-DD
  selfieUrl: string | null;
  isOnboarded: boolean;
  hasSetSchedule: boolean; // To track if user has defined their timing
  affirmationStreak: number;
  lastAffirmationAck: string | null; // ISO Date string of last ack
  reminderTimes: {
    morning: string;
    evening: string;
  };
  subscription?: {
    plan: 'FREE' | 'PRO';
    status: 'active' | 'canceled' | 'expired';
    renewsAt: string;
  };
  credits?: {
    balance: number;
    lifetimeUsed: number;
    lastRefill: string | null;
  };
}

export interface VisionGoal {
  id: string;
  categories: string[]; 
  title: string;
  targetDate: string;
  createdAt: number;
  imageUrl?: string; // Stores the AI generated image or null
  isRegeneratingImage?: boolean; // UI state for image generation
}

export interface DailyRitual {
  id: string;
  goalId: string; // Links back to the vision
  title: string;
  isCompleted: boolean;
  lastCompletedDate: string | null;
}

export interface LifestyleShift {
  id: string;
  imageUrl: string;
  prompt: string;
  createdAt: number;
}

export type AppScreen = 'ONBOARDING' | 'WIZARD' | 'TIMELINE' | 'ALIGNER' | 'SIMULATOR' | 'PROFILE';

export interface AffirmationState {
  text: string;
  type: 'MORNING' | 'EVENING';
  lastGenerated: string | null;
  isAcknowledged: boolean; // Specific to the current session/type
}

export interface GratitudeEntry {
  id: string;
  text: string;
  createdAt: number;
}
