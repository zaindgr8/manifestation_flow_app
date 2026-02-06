
import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { UserProfile, VisionGoal, DailyRitual, AppScreen, AffirmationState, LifestyleShift, GratitudeEntry } from '../types';
import { generateDailyAffirmation, generateVisionBoardImage, generatePersonalizedGoalImage } from '../services/geminiService';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  getDoc
} from 'firebase/firestore';

interface ManifestContextType {
  user: UserProfile;
  goals: VisionGoal[];
  rituals: DailyRitual[];
  lifestyleHistory: LifestyleShift[];
  gratitudeEntries: GratitudeEntry[];
  currentScreen: AppScreen;
  affirmation: AffirmationState;
  loadingAffirmation: boolean;
  
  // Auth State
  authUser: User | null;
  authLoading: boolean;
  isGuestMode: boolean;
  enableGuestMode: () => void;

  updateUser: (updates: Partial<UserProfile>) => void;
  addGoalAndRitual: (goal: Omit<VisionGoal, 'id' | 'createdAt'>, ritualTitles: string[]) => void;
  addRitual: (title: string) => void;
  deleteRitual: (id: string) => void;
  updateRitualTitle: (id: string, title: string) => void;
  toggleRitual: (id: string) => void;
  addGratitude: (text: string) => void;
  setScreen: (screen: AppScreen) => void;
  refreshAffirmation: () => Promise<void>;
  acknowledgeAffirmation: () => Promise<void>;
  regenerateGoalImage: (goalId: string) => Promise<void>;
  personalizeGoalImage: (goalId: string, selfieUrl: string) => Promise<void>;
  addToLifestyleHistory: (shift: Omit<LifestyleShift, 'id' | 'createdAt'>) => void;
  logout: () => Promise<void>;
  resetDay: () => void;
  purchasePro: () => Promise<void>;
  purchaseCredits: (pack: '10' | '50') => Promise<void>;
  restorePurchases: () => Promise<void>;
}

const ManifestContext = createContext<ManifestContextType | undefined>(undefined);

const DEFAULT_USER_PROFILE: UserProfile = {
    name: '',
    selfieUrl: null,
    isOnboarded: false,
    hasSetSchedule: false,
    affirmationStreak: 0,
    lastAffirmationAck: null,
    reminderTimes: { morning: '08:00', evening: '20:00' },
    subscription: {
        plan: 'FREE',
        status: 'active',
        renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    credits: {
        balance: 3, // 3 Free credits for everyone
        lifetimeUsed: 0,
        lastRefill: new Date().toISOString()
    }
};

export const ManifestProvider = ({ children }: PropsWithChildren<{}>) => {
  // Auth State
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);

  // App Data State
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [goals, setGoals] = useState<VisionGoal[]>([]);
  const [rituals, setRituals] = useState<DailyRitual[]>([]);
  const [lifestyleHistory, setLifestyleHistory] = useState<LifestyleShift[]>([]);
  const [gratitudeEntries, setGratitudeEntries] = useState<GratitudeEntry[]>([]);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('ONBOARDING');
  const [affirmation, setAffirmation] = useState<AffirmationState>({
    text: "Welcome to your new reality.",
    type: 'MORNING', // Keeping for legacy/types but will move to general
    lastGenerated: null,
    isAcknowledged: false
  });
  const [loadingAffirmation, setLoadingAffirmation] = useState(false);

  // 1. Auth Listener
  useEffect(() => {
    if (!auth) {
        setAuthLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setAuthUser(firebaseUser);
        if (!firebaseUser) {
            // Reset to defaults on logout
            if (!isGuestMode) {
                setUser(DEFAULT_USER_PROFILE);
                setGoals([]);
                setRituals([]);
                setCurrentScreen('ONBOARDING');
            }
        }
        setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [isGuestMode]);

  // 2. Data Sync Listener (Firestore)
  useEffect(() => {
    if (!authUser || !db) return;

    // A. User Profile Sync
    const userRef = doc(db, 'users', authUser.uid);
    const unsubUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            setUser(docSnap.data() as UserProfile);
            // If already onboarded, ensure we aren't stuck on onboarding screen
            if (docSnap.data().isOnboarded && currentScreen === 'ONBOARDING') {
                setCurrentScreen('TIMELINE');
            }
        } else {
            // New user detection: Use Google Profile Data if available
            const initialProfile: UserProfile = {
                ...DEFAULT_USER_PROFILE,
                name: authUser.displayName || '',
                selfieUrl: authUser.photoURL || null,
                // We keep isOnboarded false so they can confirm their details/gender in the Wizard
            };
            setDoc(userRef, initialProfile, { merge: true });
        }
    });

    // B. Goals Sync
    const goalsQuery = query(collection(db, `users/${authUser.uid}/goals`), orderBy('targetDate', 'asc'));
    const unsubGoals = onSnapshot(goalsQuery, (snap) => {
        const loadedGoals = snap.docs.map(d => ({ id: d.id, ...d.data() } as VisionGoal));
        setGoals(loadedGoals);
    });

    // C. Rituals Sync
    const ritualsQuery = query(collection(db, `users/${authUser.uid}/rituals`)); // Ordering can be done client side if needed
    const unsubRituals = onSnapshot(ritualsQuery, (snap) => {
        const loadedRituals = snap.docs.map(d => ({ id: d.id, ...d.data() } as DailyRitual));
        setRituals(loadedRituals);
    });

    // D. Gratitude Sync
    const gratitudeQuery = query(collection(db, `users/${authUser.uid}/gratitude`), orderBy('createdAt', 'desc'));
    const unsubGratitude = onSnapshot(gratitudeQuery, (snap) => {
        const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() } as GratitudeEntry));
        setGratitudeEntries(loaded);
    });

    // E. Lifestyle History
    const lsQuery = query(collection(db, `users/${authUser.uid}/lifestyle`), orderBy('createdAt', 'desc'));
    const unsubLs = onSnapshot(lsQuery, (snap) => {
        const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() } as LifestyleShift));
        setLifestyleHistory(loaded);
    });

    return () => {
        unsubUser();
        unsubGoals();
        unsubRituals();
        unsubGratitude();
        unsubLs();
    };
  }, [authUser]);

  // 3. RevenueCat Subscription Listener
  useEffect(() => {
    const setupPurchases = async () => {
        try {
            const customerInfo = await Purchases.getCustomerInfo();
            handleCustomerInfoUpdate(customerInfo);
        } catch (e) {
            console.log("Error fetching customer info (RevenueCat disabled in Expo Go)", e);
        }
    };

    setupPurchases();

    let listener: any;
    try {
        listener = Purchases.addCustomerInfoUpdateListener((info) => {
            handleCustomerInfoUpdate(info);
        });
    } catch (e) {
        console.warn("RevenueCat listeners not available.");
    }

    return () => {
        if (listener && listener.remove) {
            listener.remove();
        }
    };
  }, [user.name]); // Re-run if user changes (mostly for initial sync)

  const handleCustomerInfoUpdate = (info: CustomerInfo) => {
      const isPro = typeof info.entitlements.active['pro_access'] !== 'undefined';
      
      if (isPro && user.subscription?.plan !== 'PRO') {
          updateUser({
              subscription: {
                  plan: 'PRO',
                  status: 'active',
                  renewsAt: info.entitlements.active['pro_access'].expirationDate || new Date().toISOString()
              }
          });
      } else if (!isPro && user.subscription?.plan === 'PRO') {
          // Expired
          updateUser({
              subscription: {
                  plan: 'FREE',
                  status: 'expired',
                  renewsAt: new Date().toISOString()
              }
          });
      }
  };

  // --- ACTIONS (Hybrid: Firestore or Local State) ---

  const enableGuestMode = () => setIsGuestMode(true);

  const updateUser = async (updates: Partial<UserProfile>) => {
    // Optimistic Update
    setUser(prev => {
        const next = { ...prev, ...updates };
        if (next.name && next.selfieUrl && !prev.isOnboarded && updates.isOnboarded) {
             setCurrentScreen('WIZARD');
        }
        return next;
    });

    if (authUser && db) {
        const userRef = doc(db, 'users', authUser.uid);
        await updateDoc(userRef, updates);
    }
  };

  const addGoalAndRitual = async (goalData: Omit<VisionGoal, 'id' | 'createdAt'>, ritualTitles: string[]) => {
    // 1. Check Goal Limits
    const isPro = user.subscription?.plan === 'PRO';
    if (!isPro && goals.length >= 3) {
        alert("You have reached the maximum of 3 goals on the Free plan. Upgrade to Manifestor Pro for unlimited goals.");
        return;
    }

    // Generate IDs locally for optimistic update (if complex, skip optimistic for add)
    // For Firestore, we let SDK generate ID or use a placeholder
    const timestamp = Date.now();
    
    if (authUser && db) {
        // 1. Add Goal
        const goalsRef = collection(db, `users/${authUser.uid}/goals`);
        const goalDoc = await addDoc(goalsRef, {
            ...goalData,
            createdAt: timestamp
        });

        // 2. Add Rituals
        const ritualsRef = collection(db, `users/${authUser.uid}/rituals`);
        const batch = [];
        for (const title of ritualTitles) {
             await addDoc(ritualsRef, {
                goalId: goalDoc.id,
                title,
                isCompleted: false,
                lastCompletedDate: null
             });
        }
        
        // Trigger Image Generation in Background
        generateVisionBoardImage(goalData.title, goalData.categories, user).then(img => {
            if (img) {
                updateDoc(doc(db, `users/${authUser.uid}/goals`, goalDoc.id), { imageUrl: img });
            }
        });

    } else {
        // Local Mode
        const newGoalId = timestamp.toString();
        const newGoal: VisionGoal = { ...goalData, id: newGoalId, createdAt: timestamp };
        const newRituals: DailyRitual[] = ritualTitles.map((title, i) => ({
            id: `ritual-${timestamp}-${i}`,
            goalId: newGoalId,
            title,
            isCompleted: false,
            lastCompletedDate: null
        }));
        setGoals(prev => [...prev, newGoal].sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()));
        setRituals(prev => [...prev, ...newRituals]);
        
        generateVisionBoardImage(newGoal.title, newGoal.categories, user).then(img => {
             if (img) setGoals(p => p.map(g => g.id === newGoalId ? { ...g, imageUrl: img } : g));
        });
    }
  };

  const addRitual = async (title: string) => {
     const goalId = goals.length > 0 ? goals[0].id : 'general';
     if (authUser && db) {
         await addDoc(collection(db, `users/${authUser.uid}/rituals`), {
             goalId, title, isCompleted: false, lastCompletedDate: null
         });
     } else {
         setRituals(prev => [...prev, { id: Date.now().toString(), goalId, title, isCompleted: false, lastCompletedDate: null }]);
     }
  };

  const deleteRitual = async (id: string) => {
    if (authUser && db) {
        await deleteDoc(doc(db, `users/${authUser.uid}/rituals`, id));
    } else {
        setRituals(prev => prev.filter(r => r.id !== id));
    }
  };

  const updateRitualTitle = async (id: string, title: string) => {
    if (authUser && db) {
        await updateDoc(doc(db, `users/${authUser.uid}/rituals`, id), { title });
    } else {
        setRituals(prev => prev.map(r => r.id === id ? { ...r, title } : r));
    }
  };

  const addGratitude = async (text: string) => {
    if (authUser && db) {
        await addDoc(collection(db, `users/${authUser.uid}/gratitude`), {
            text, createdAt: Date.now()
        });
    } else {
        setGratitudeEntries(prev => [{ id: Date.now().toString(), text, createdAt: Date.now() }, ...prev]);
    }
  };

  const toggleRitual = async (id: string) => {
    // Find ritual to toggle logic
    const ritual = rituals.find(r => r.id === id);
    if (!ritual) return;
    
    const updates = {
        isCompleted: !ritual.isCompleted,
        lastCompletedDate: !ritual.isCompleted ? new Date().toISOString() : ritual.lastCompletedDate
    };

    if (authUser && db) {
        await updateDoc(doc(db, `users/${authUser.uid}/rituals`, id), updates);
    } else {
        setRituals(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    }
  };

  const regenerateGoalImage = async (goalId: string) => {
      // 1. Check Credits
      if ((user.credits?.balance || 0) <= 0) {
          alert("You have run out of Cosmic Credits. Top up to generate more imagery.");
          return;
      }
      
      // Deduct Credit Optimistically
      updateUser({
          credits: {
              ...user.credits!,
              balance: (user.credits?.balance || 0) - 1,
              lifetimeUsed: (user.credits?.lifetimeUsed || 0) + 1
          }
      });

      // Set Loading UI
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, isRegeneratingImage: true } : g));
      
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      try {
          const img = await generateVisionBoardImage(goal.title, goal.categories, user);
          if (img) {
              if (authUser && db) {
                  await updateDoc(doc(db, `users/${authUser.uid}/goals`, goalId), { imageUrl: img });
              } else {
                  setGoals(prev => prev.map(g => g.id === goalId ? { ...g, imageUrl: img } : g));
              }
          }
      } finally {
          setGoals(prev => prev.map(g => g.id === goalId ? { ...g, isRegeneratingImage: false } : g));
      }
  };

  const personalizeGoalImage = async (goalId: string, selfieUrl: string) => {
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, isRegeneratingImage: true } : g));
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      try {
          const img = await generatePersonalizedGoalImage(selfieUrl, goal.title, goal.categories);
          if (img) {
              if (authUser && db) {
                  await updateDoc(doc(db, `users/${authUser.uid}/goals`, goalId), { imageUrl: img });
              } else {
                  setGoals(prev => prev.map(g => g.id === goalId ? { ...g, imageUrl: img } : g));
              }
          }
      } finally {
          setGoals(prev => prev.map(g => g.id === goalId ? { ...g, isRegeneratingImage: false } : g));
      }
  };

  const addToLifestyleHistory = async (shift: Omit<LifestyleShift, 'id' | 'createdAt'>) => {
      if (authUser && db) {
          await addDoc(collection(db, `users/${authUser.uid}/lifestyle`), {
              ...shift, createdAt: Date.now()
          });
      } else {
          setLifestyleHistory(prev => [{ ...shift, id: Date.now().toString(), createdAt: Date.now() }, ...prev]);
      }
  };

  // --- Non-DB Methods (UI Only) ---
  const setScreen = (screen: AppScreen) => setCurrentScreen(screen);

  const refreshAffirmation = async () => {
      if (!user.name) return;
      setLoadingAffirmation(true);
      try {
          const text = await generateDailyAffirmation(user, goals);
          setAffirmation({
              text,
              type: 'MORNING', // Neutralized
              lastGenerated: new Date().toDateString(),
              isAcknowledged: false
          });
      } finally {
          setLoadingAffirmation(false);
      }
  };

  const acknowledgeAffirmation = async () => {
      setAffirmation(prev => ({ ...prev, isAcknowledged: true }));
      const now = new Date();
      updateUser({ lastAffirmationAck: now.toISOString() });
      // Trigger new one immediately
      await refreshAffirmation();
  };

  // --- REVENUECAT ACTIONS ---

  const purchasePro = async () => {
      try {
          const offerings = await Purchases.getOfferings();
          if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
              const pack = offerings.current.availablePackages[0];
              const { customerInfo } = await Purchases.purchasePackage(pack);
              handleCustomerInfoUpdate(customerInfo);
          } else {
              alert("No offerings available.");
          }
      } catch (e: any) {
          if (e.code === 'PURCHASES_ARE_NOT_CONFIGURED') {
              alert("Payments disabled in Expo Go. Use a Development Build to test.");
              return;
          }
          if (!e.userCancelled) {
              alert("Purchase failed: " + e.message);
          }
      }
  };

  const purchaseCredits = async (amount: '10' | '50') => {
      try {
           const offerings = await Purchases.getOfferings();
           // ... rest of logic
           const creditPackage = offerings.all['credits']?.availablePackages.find(p => p.identifier.includes(amount));
           
           if (!creditPackage) {
                // FALLBACK MOCK for Expo Go / No Config
                updateUser({
                    credits: {
                        ...user.credits!,
                        balance: (user.credits?.balance || 0) + parseInt(amount),
                        lastRefill: new Date().toISOString()
                    }
                });
                alert(`(Mock) Added ${amount} credits!`);
                return;
           }

           await Purchases.purchasePackage(creditPackage);
           updateUser({
               credits: {
                   ...user.credits!,
                   balance: (user.credits?.balance || 0) + parseInt(amount),
                   lastRefill: new Date().toISOString()
               }
           });
           
      } catch (e: any) {
          if (e.code === 'PURCHASES_ARE_NOT_CONFIGURED') {
               // Fallback for Expo Go
                updateUser({
                    credits: {
                        ...user.credits!,
                        balance: (user.credits?.balance || 0) + parseInt(amount),
                        lastRefill: new Date().toISOString()
                    }
                });
                alert(`(Mock/Expo Go) Added ${amount} credits!`);
              return;
          }
          if (!e.userCancelled) {
               alert("Credit purchase failed.");
          }
      }
  };

  const restorePurchases = async () => {
      try {
          const info = await Purchases.restorePurchases();
          handleCustomerInfoUpdate(info);
          alert("Purchases restored successfully.");
      } catch (e) {
          alert("Restore failed.");
      }
  };

  const logout = async () => {
      if (authUser) {
          await auth.signOut();
      }
      
      // Reset all states
      setIsGuestMode(false);
      setUser(DEFAULT_USER_PROFILE);
      setGoals([]);
      setRituals([]);
      setLifestyleHistory([]);
      setGratitudeEntries([]);
      setAffirmation({
          text: "Welcome to your new reality.",
          type: 'MORNING',
          lastGenerated: null,
          isAcknowledged: false
      });
      setCurrentScreen('ONBOARDING');
  };

  const resetDay = async () => {
      // Reset all rituals to incomplete
      if (authUser && db) {
           // Firestore batch update for all rituals? Or just let them be?
           // Usually better to have a `dailyLog` collection, but for this simple app, we reset `isCompleted`.
           const batch = []; // Implementation depends on batch size limits
           // For now, simpler to not implement full batch reset on client login
      } else {
           setRituals(prev => prev.map(r => ({ ...r, isCompleted: false })));
      }
  };

  return (
    <ManifestContext.Provider value={{
      user,
      goals,
      rituals,
      lifestyleHistory,
      gratitudeEntries,
      currentScreen,
      affirmation,
      loadingAffirmation,
      authUser,
      authLoading,
      isGuestMode,
      enableGuestMode,
      updateUser,
      addGoalAndRitual,
      addRitual,
      deleteRitual,
      updateRitualTitle,
      addGratitude,
      toggleRitual,
      setScreen,
      refreshAffirmation,
      acknowledgeAffirmation,
      regenerateGoalImage,
      personalizeGoalImage,
      addToLifestyleHistory,
      logout,
      resetDay,
      purchasePro,
      purchaseCredits,
      restorePurchases
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
