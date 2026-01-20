import React, { createContext, useContext, useState, useEffect, ReactNode, PropsWithChildren } from 'react';
import { UserProfile, VisionGoal, DailyRitual, AppScreen, AffirmationState, LifestyleShift } from '../types';
import { generateDailyAffirmation, generateVisionBoardImage, generatePersonalizedGoalImage } from '../services/geminiService';

interface ManifestContextType {
  user: UserProfile;
  goals: VisionGoal[];
  rituals: DailyRitual[];
  lifestyleHistory: LifestyleShift[];
  currentScreen: AppScreen;
  affirmation: AffirmationState;
  updateUser: (updates: Partial<UserProfile>) => void;
  addGoalAndRitual: (goal: Omit<VisionGoal, 'id' | 'createdAt'>, ritualTitles: string[]) => void;
  addRitual: (title: string) => void;
  deleteRitual: (id: string) => void;
  updateRitualTitle: (id: string, title: string) => void;
  toggleRitual: (id: string) => void;
  setScreen: (screen: AppScreen) => void;
  refreshAffirmation: (forceType?: 'MORNING' | 'EVENING') => Promise<void>;
  acknowledgeAffirmation: () => void;
  regenerateGoalImage: (goalId: string) => Promise<void>;
  personalizeGoalImage: (goalId: string, selfieUrl: string) => Promise<void>;
  addToLifestyleHistory: (shift: Omit<LifestyleShift, 'id' | 'createdAt'>) => void;
  resetDay: () => void;
}

const ManifestContext = createContext<ManifestContextType | undefined>(undefined);

export const ManifestProvider = ({ children }: PropsWithChildren<{}>) => {
  // State Initialization
  const [user, setUser] = useState<UserProfile>({
    name: '',
    selfieUrl: null,
    isOnboarded: false,
    hasSetSchedule: false,
    affirmationStreak: 0,
    lastAffirmationAck: null,
    reminderTimes: { morning: '08:00', evening: '20:00' }
  });

  const [goals, setGoals] = useState<VisionGoal[]>([]);
  const [rituals, setRituals] = useState<DailyRitual[]>([]);
  const [lifestyleHistory, setLifestyleHistory] = useState<LifestyleShift[]>([]);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('ONBOARDING');
  const [affirmation, setAffirmation] = useState<AffirmationState>({
    text: "Welcome to your new reality.",
    type: 'MORNING',
    lastGenerated: null,
    isAcknowledged: false
  });

  // Load simplified persistence logic (In a real app, use localStorage/AsyncStorage properly)
  useEffect(() => {
    const today = new Date().toDateString();
    // Refresh affirmation if it's a new day or if goals change significantly
    if (user.isOnboarded && affirmation.lastGenerated !== today && goals.length > 0) {
       refreshAffirmation();
    }
  }, [user.isOnboarded, goals.length]); 

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser(prev => {
        const next = { ...prev, ...updates };
        if (next.name && next.selfieUrl && !prev.isOnboarded && updates.isOnboarded) {
             // Transition to wizard after onboarding
             setCurrentScreen('WIZARD');
        }
        return next;
    });
  };

  const addGoalAndRitual = async (goalData: Omit<VisionGoal, 'id' | 'createdAt'>, ritualTitles: string[]) => {
    const newGoalId = Date.now().toString();
    const newGoal: VisionGoal = {
      ...goalData,
      id: newGoalId,
      createdAt: Date.now(),
      imageUrl: undefined // Initially undefined
    };

    const newRituals: DailyRitual[] = ritualTitles.map((title, index) => ({
      id: `ritual-${Date.now()}-${index}`,
      goalId: newGoalId,
      title: title,
      isCompleted: false,
      lastCompletedDate: null
    }));

    // Optimistically update UI
    setGoals(prev => [...prev, newGoal]);
    setRituals(prev => [...prev, ...newRituals]);

    // Background Image Generation
    try {
        const generatedImage = await generateVisionBoardImage(newGoal.title, newGoal.categories);
        if (generatedImage) {
            setGoals(prev => prev.map(g => 
                g.id === newGoalId ? { ...g, imageUrl: generatedImage } : g
            ));
        }
    } catch (e) {
        console.error("Failed to generate image for goal", e);
    }
  };

  const addRitual = (title: string) => {
    // Assign to the first goal if available, otherwise generic
    const goalId = goals.length > 0 ? goals[0].id : 'general-tasks';
    const newRitual: DailyRitual = {
      id: `ritual-${Date.now()}`,
      goalId,
      title,
      isCompleted: false,
      lastCompletedDate: null
    };
    setRituals(prev => [...prev, newRitual]);
  };

  const deleteRitual = (id: string) => {
    setRituals(prev => prev.filter(r => r.id !== id));
  };

  const updateRitualTitle = (id: string, title: string) => {
    setRituals(prev => prev.map(r => r.id === id ? { ...r, title } : r));
  };

  const regenerateGoalImage = async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    // Set loading state
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, isRegeneratingImage: true } : g));

    try {
        const generatedImage = await generateVisionBoardImage(goal.title, goal.categories);
        if (generatedImage) {
            setGoals(prev => prev.map(g => 
                g.id === goalId ? { ...g, imageUrl: generatedImage, isRegeneratingImage: false } : g
            ));
        } else {
             setGoals(prev => prev.map(g => g.id === goalId ? { ...g, isRegeneratingImage: false } : g));
        }
    } catch (e) {
        console.error("Failed to regenerate image", e);
        setGoals(prev => prev.map(g => g.id === goalId ? { ...g, isRegeneratingImage: false } : g));
    }
  };

  const personalizeGoalImage = async (goalId: string, selfieUrl: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, isRegeneratingImage: true } : g));

    try {
        const generatedImage = await generatePersonalizedGoalImage(selfieUrl, goal.title, goal.categories);
        if (generatedImage) {
             setGoals(prev => prev.map(g => 
                g.id === goalId ? { ...g, imageUrl: generatedImage, isRegeneratingImage: false } : g
            ));
        } else {
             setGoals(prev => prev.map(g => g.id === goalId ? { ...g, isRegeneratingImage: false } : g));
        }
    } catch (e) {
        console.error("Failed to personalize", e);
        setGoals(prev => prev.map(g => g.id === goalId ? { ...g, isRegeneratingImage: false } : g));
    }
  };

  const toggleRitual = (id: string) => {
    setRituals(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          isCompleted: !r.isCompleted,
          lastCompletedDate: !r.isCompleted ? new Date().toISOString() : r.lastCompletedDate
        };
      }
      return r;
    }));
  };

  const setScreen = (screen: AppScreen) => {
    setCurrentScreen(screen);
  };

  const addToLifestyleHistory = (shift: Omit<LifestyleShift, 'id' | 'createdAt'>) => {
    setLifestyleHistory(prev => [
      { ...shift, id: Date.now().toString(), createdAt: Date.now() },
      ...prev
    ]);
  };

  const refreshAffirmation = async (forceType?: 'MORNING' | 'EVENING') => {
    if (!user.name) return;
    
    let type = forceType;
    if (!type) {
        // Auto-detect based on schedule
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeVal = currentHour * 60 + currentMinute;

        // Parse user settings
        const [eveningH, eveningM] = user.reminderTimes.evening.split(':').map(Number);
        const eveningTimeVal = eveningH * 60 + eveningM;

        // If it's past the evening scheduled time, show evening. Otherwise morning.
        type = currentTimeVal >= eveningTimeVal ? 'EVENING' : 'MORNING';
    }

    // Check if we already have one generated for today/this slot to avoid AI spam? 
    // For now, we allow regeneration but reset ack status if text changes
    
    const text = await generateDailyAffirmation(user, goals, type);
    
    setAffirmation(prev => ({
        text,
        type: type!,
        lastGenerated: new Date().toDateString(),
        isAcknowledged: false // Reset ack when new one generates
    }));
  };

  const acknowledgeAffirmation = () => {
    if (affirmation.isAcknowledged) return;

    setAffirmation(prev => ({ ...prev, isAcknowledged: true }));

    const now = new Date();
    const todayStr = now.toDateString();
    
    // Streak Logic
    let newStreak = user.affirmationStreak;
    let lastAckDateObj = user.lastAffirmationAck ? new Date(user.lastAffirmationAck) : null;
    
    if (!lastAckDateObj) {
        newStreak = 1;
    } else {
        const diffTime = Math.abs(now.getTime() - lastAckDateObj.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        // If acked yesterday (diffDays approx 1) or today (0), streak is safe.
        // Simplified check:
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastAckDateObj.toDateString() === todayStr) {
            // Already acked today, keep streak same
        } else if (lastAckDateObj.toDateString() === yesterday.toDateString()) {
            newStreak += 1;
        } else {
            // Missed a day
            newStreak = 1;
        }
    }

    updateUser({
        affirmationStreak: newStreak,
        lastAffirmationAck: now.toISOString()
    });
  };

  const resetDay = () => {
     setRituals(prev => prev.map(r => ({ ...r, isCompleted: false })));
  };

  return (
    <ManifestContext.Provider value={{
      user,
      goals,
      rituals,
      lifestyleHistory,
      currentScreen,
      affirmation,
      updateUser,
      addGoalAndRitual,
      addRitual,
      deleteRitual,
      updateRitualTitle,
      toggleRitual,
      setScreen,
      refreshAffirmation,
      acknowledgeAffirmation,
      regenerateGoalImage,
      personalizeGoalImage,
      addToLifestyleHistory,
      resetDay
    }}>
      {children}
    </ManifestContext.Provider>
  );
};

export const useManifest = () => {
  const context = useContext(ManifestContext);
  if (!context) throw new Error("useManifest must be used within ManifestProvider");
  return context;
};