export interface UserProfile {
  name: string;
  selfieUrl: string | null;
  isOnboarded: boolean;
}

export interface VisionGoal {
  id: string;
  category: 'Car' | 'Home' | 'Relationship' | 'Wealth' | 'Health' | 'Other';
  title: string;
  targetDate: string;
  createdAt: number;
}

export interface DailyRitual {
  id: string;
  goalId: string; // Links back to the vision
  title: string;
  isCompleted: boolean;
  lastCompletedDate: string | null;
}

export type AppScreen = 'ONBOARDING' | 'WIZARD' | 'TIMELINE' | 'ALIGNER';

export interface AffirmationState {
  text: string;
  lastGenerated: string | null;
}