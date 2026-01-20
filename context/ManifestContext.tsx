import React, { createContext, useContext, useState, useEffect, ReactNode, PropsWithChildren } from 'react';
import { UserProfile, VisionGoal, DailyRitual, AppScreen, AffirmationState } from '../types';
import { generateDailyAffirmation } from '../services/geminiService';

interface ManifestContextType {
  user: UserProfile;
  goals: VisionGoal[];
  rituals: DailyRitual[];
  currentScreen: AppScreen;
  affirmation: AffirmationState;
  updateUser: (updates: Partial<UserProfile>) => void;
  addGoalAndRitual: (goal: Omit<VisionGoal, 'id' | 'createdAt'>, ritualTitle: string) => void;
  toggleRitual: (id: string) => void;
  setScreen: (screen: AppScreen) => void;
  refreshAffirmation: () => Promise<void>;
  resetDay: () => void;
}

const ManifestContext = createContext<ManifestContextType | undefined>(undefined);

export const ManifestProvider = ({ children }: PropsWithChildren<{}>) => {
  // State Initialization
  const [user, setUser] = useState<UserProfile>({
    name: '',
    selfieUrl: null,
    isOnboarded: false,
  });

  const [goals, setGoals] = useState<VisionGoal[]>([]);
  const [rituals, setRituals] = useState<DailyRitual[]>([]);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('ONBOARDING');
  const [affirmation, setAffirmation] = useState<AffirmationState>({
    text: "Welcome to your new reality.",
    lastGenerated: null
  });

  // Load simplified persistence logic (In a real app, use localStorage/AsyncStorage properly)
  useEffect(() => {
    const today = new Date().toDateString();
    if (user.isOnboarded && affirmation.lastGenerated !== today) {
       refreshAffirmation();
    }
  }, [user.isOnboarded, goals]);

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

  const addGoalAndRitual = (goalData: Omit<VisionGoal, 'id' | 'createdAt'>, ritualTitle: string) => {
    const newGoalId = Date.now().toString();
    const newGoal: VisionGoal = {
      ...goalData,
      id: newGoalId,
      createdAt: Date.now(),
    };

    const newRitual: DailyRitual = {
      id: `ritual-${Date.now()}`,
      goalId: newGoalId,
      title: ritualTitle,
      isCompleted: false,
      lastCompletedDate: null
    };

    setGoals(prev => [...prev, newGoal]);
    setRituals(prev => [...prev, newRitual]);
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

  const refreshAffirmation = async () => {
    if (!user.name) return;
    const text = await generateDailyAffirmation(user, goals);
    setAffirmation({
        text,
        lastGenerated: new Date().toDateString()
    });
  };

  const resetDay = () => {
     // Logic to uncheck boxes on a new day
     setRituals(prev => prev.map(r => ({ ...r, isCompleted: false })));
  };

  return (
    <ManifestContext.Provider value={{
      user,
      goals,
      rituals,
      currentScreen,
      affirmation,
      updateUser,
      addGoalAndRitual,
      toggleRitual,
      setScreen,
      refreshAffirmation,
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