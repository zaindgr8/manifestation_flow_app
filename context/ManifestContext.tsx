
import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { UserProfile, VisionGoal, DailyRitual, AppScreen, AffirmationState, LifestyleShift, GratitudeEntry } from '../types';
import { generateDailyAffirmation, generateVisionBoardImage, generatePersonalizedGoalImage } from '../services/geminiService';
import { auth, db, storage } from '../services/firebase';
import { scheduleAffirmationReminders } from '../services/notificationService';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ref, uploadString, uploadBytes, getDownloadURL } from 'firebase/storage';
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
  addRitual: (title: string, goalId?: string) => void;
  deleteRitual: (id: string) => void;
  updateRitualTitle: (id: string, title: string) => void;
  updateGoalWithRituals: (goalId: string, goalUpdates: Partial<VisionGoal>, ritualsToUpdate: {id?: string, title: string, deleted?: boolean}[]) => Promise<void>;
  toggleRitual: (id: string) => void;
  addGratitude: (text: string) => void;
  setScreen: (screen: AppScreen) => void;
  refreshAffirmation: () => Promise<void>;
  acknowledgeAffirmation: () => Promise<void>;
  regenerateGoalImage: (goalId: string) => Promise<void>;
  personalizeGoalImage: (goalId: string, selfieUrl: string) => Promise<void>;
  updateGoal: (id: string, updates: Partial<VisionGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addToLifestyleHistory: (shift: Omit<LifestyleShift, 'id' | 'createdAt'>) => void;
  simulateLifestyle: (image: string, prompt: string) => Promise<string | null>;
  logout: () => Promise<void>;
  resetDay: () => void;
  purchasePro: () => Promise<void>;
  purchaseCredits: (pack: '10' | '50') => Promise<void>;
  restorePurchases: () => Promise<void>;
  deductCredits: (amount: number) => Promise<boolean>;
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
        lifetimePurchased: 0,
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
        setGoals(prevGoals => {
            return snap.docs.map(d => {
                const data = d.data() as VisionGoal;
                // Sanitize legacy `async://` references from previous workaround
                if (data.imageUrl?.startsWith('async://')) {
                    data.imageUrl = undefined;
                }
                
                // CRITICAL FIX: Preserve local base64 images if Firestore sync hasn't caught up or failed
                const existingGoal = prevGoals.find(g => g.id === d.id);
                if (existingGoal && existingGoal.imageUrl?.startsWith('data:image') && !data.imageUrl) {
                    data.imageUrl = existingGoal.imageUrl;
                }
                
                return { id: d.id, ...data } as VisionGoal;
            });
        });
    });

    // C. Rituals Sync
    const ritualsQuery = query(collection(db, `users/${authUser.uid}/rituals`), orderBy('createdAt', 'desc')); 
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

  // 3. Weekly Credit Refill (Pro Users)
  useEffect(() => {
     if (user.subscription?.plan === 'PRO') {
         const now = new Date();
         const lastRefill = user.credits?.lastRefill ? new Date(user.credits.lastRefill) : null;
         
         // If no refill record or last refill was > 7 days ago
         if (!lastRefill || (now.getTime() - lastRefill.getTime()) > 7 * 24 * 60 * 60 * 1000) {
             console.log("Applying weekly credit refill for Pro user...");
             updateUser({
                 credits: {
                     ...user.credits!,
                     balance: (user.credits?.balance || 0) + 10,
                     lastRefill: now.toISOString()
                 }
             });
         }
     }
  }, [user.subscription?.plan]);

  // Handle automatic navigation from Onboarding to Home
  useEffect(() => {
    if (user.isOnboarded && currentScreen === 'ONBOARDING') {
        setCurrentScreen('TIMELINE');
    }
  }, [user.isOnboarded, currentScreen]);

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
        try {
            let finalUpdates = { ...updates };
            
            // Fix: Upload both base64 (data:image) and local file:// URIs (from ImagePicker)
            // to Firebase Storage so only a persistent HTTPS URL is stored in Firestore.
            const selfieUri = updates.selfieUrl;
            if (selfieUri && (selfieUri.startsWith('data:image') || selfieUri.startsWith('file://'))) {
                try {
                    console.log("Starting profile image upload to Storage...");
                    const storagePath = `users/${authUser.uid}/profile/selfie_${Date.now()}.jpg`;
                    const downloadUrl = await uploadImageToStorage(selfieUri, storagePath);
                    finalUpdates.selfieUrl = downloadUrl;
                    
                    // Update local state again with the persistent URL
                    setUser(prev => ({...prev, selfieUrl: downloadUrl}));
                    console.log("Profile image uploaded successfully:", downloadUrl);
                } catch (uploadError) {
                    console.error("Profile image upload failed:", uploadError);
                    // CRITICAL: Prevent saving local URI/Base64 to Firestore
                    delete finalUpdates.selfieUrl;
                    alert("Profile image upload failed. We saved your other info, but the image couldn't be stored.");
                }
            } else if (selfieUri && (selfieUri.startsWith('data:image') || selfieUri.startsWith('file://'))) {
                // Secondary guard for edge cases
                delete finalUpdates.selfieUrl;
            }
            
            // Sync with local push notifications if reminder times changed
            if (updates.reminderTimes) {
              scheduleAffirmationReminders(updates.reminderTimes.morning, updates.reminderTimes.evening);
            }
            
            const userRef = doc(db, 'users', authUser.uid);
            await updateDoc(userRef, finalUpdates);
            console.log("Profile data synced with Firestore successfully.");
        } catch (e) {
            console.error("General profile update error:", e);
            // Fallback: try to save whatever is NOT a local URI
            try {
                const userRef = doc(db, 'users', authUser.uid);
                const fallbackUpdates = { ...updates };
                if (fallbackUpdates.selfieUrl && (fallbackUpdates.selfieUrl.startsWith('data:image') || fallbackUpdates.selfieUrl.startsWith('file://'))) {
                    delete fallbackUpdates.selfieUrl;
                }
                await updateDoc(userRef, fallbackUpdates);
            } catch (fallbackError) {
                console.error("Fallback update also failed:", fallbackError);
            }
        }
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
            createdAt: timestamp,
            isLoadingImage: true
        });

        // 2. Add Rituals
        const ritualsRef = collection(db, `users/${authUser.uid}/rituals`);
        const batch = [];
        for (const title of ritualTitles) {
             await addDoc(ritualsRef, {
                goalId: goalDoc.id,
                title,
                isCompleted: false,
                lastCompletedDate: null,
                createdAt: timestamp
             });
        }
        
        // Trigger auto-generation on creation (Background Task)
        triggerInitialGoalImage(goalDoc.id, goalData.title, goalData.categories);

    } else {
        // Local Mode
        const newGoalId = timestamp.toString();
        const newGoal: VisionGoal = { ...goalData, id: newGoalId, createdAt: timestamp, isLoadingImage: true };
        const newRituals: DailyRitual[] = ritualTitles.map((title, i) => ({
            id: `ritual-${timestamp}-${i}`,
            goalId: newGoalId,
            title,
            isCompleted: false,
            lastCompletedDate: null,
            createdAt: timestamp
        }));
        setGoals(prev => [...prev, newGoal].sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()));
        setRituals(prev => [...prev, ...newRituals]);
        
        // Trigger auto-generation on creation (Background Task)
        triggerInitialGoalImage(newGoalId, goalData.title, goalData.categories);

    }
  };

  // Internal helper to generate the first image for a goal without user intervention
  const triggerInitialGoalImage = async (goalId: string, title: string, categories: string[]) => {
      try {
          // 1. Generate generic-faced image matching user demographics
          const img = await generateVisionBoardImage(title, categories, user);
          if (!img) {
              setGoals(prev => prev.map(g => g.id === goalId ? { ...g, isLoadingImage: false, imageError: 'Generation failed' } : g));
              if (authUser && db) await updateDoc(doc(db, `users/${authUser.uid}/goals`, goalId), { isLoadingImage: false, imageError: 'Generation failed' });
              return;
          }

          // 2. Update local state immediately with Base64
          setGoals(prev => prev.map(g => g.id === goalId ? { ...g, imageUrl: img, isLoadingImage: false, imageError: undefined } : g));

          if (authUser && db) {
              try {
                  // 3. Upload to Storage & Save to DB
                  const storagePath = `users/${authUser.uid}/goals/${goalId}_placeholder.jpg`;
                  const downloadUrl = await uploadImageToStorage(img, storagePath);
                  
                   // 4. Final update with persistent URL
                   setGoals(prev => prev.map(g => g.id === goalId ? { ...g, imageUrl: downloadUrl } : g));
                   await updateDoc(doc(db, `users/${authUser.uid}/goals`, goalId), { 
                       imageUrl: downloadUrl, 
                       isLoadingImage: false,
                       imageError: null
                   });
               } catch (storageError) {
                   console.log("Storage/upload failed:", storageError);
                   // CRITICAL FIX: DO NOT save base64 to Firestore. 
                   // Keep it in local state only.
                   await updateDoc(doc(db, `users/${authUser.uid}/goals`, goalId), { 
                       isLoadingImage: false,
                       imageError: 'Cloud storage failed. Vision saved locally.' 
                   });
               }
          }
      } catch (e: any) {
          console.log("Auto-image generation or storage failed:", e);
          const errorMessage = e?.message || (typeof e === 'string' ? e : 'Unknown error');
          
          setGoals(prev => prev.map(g => g.id === goalId ? { 
              ...g, 
              isLoadingImage: false, 
              imageError: errorMessage.includes('storage') ? 'Storage failure' : 'Safety filters or error' 
          } : g));
          
          if (authUser && db) await updateDoc(doc(db, `users/${authUser.uid}/goals`, goalId), { 
              isLoadingImage: false, 
              imageError: errorMessage.includes('storage') ? 'Storage failure' : 'Safety filters or error' 
          });
      }
  };

  const updateGoal = async (id: string, updates: Partial<VisionGoal>) => {
    if (authUser && db) {
        await updateDoc(doc(db, `users/${authUser.uid}/goals`, id), updates);
    } else {
        setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    }
  };

  const deleteGoal = async (id: string) => {
    if (authUser && db) {
        await deleteDoc(doc(db, `users/${authUser.uid}/goals`, id));
        // Also delete associated rituals
        const associatedRituals = rituals.filter(r => r.goalId === id);
        for (const r of associatedRituals) {
            await deleteDoc(doc(db, `users/${authUser.uid}/rituals`, r.id));
        }
    } else {
        setGoals(prev => prev.filter(g => g.id !== id));
        setRituals(prev => prev.filter(r => r.goalId !== id));
    }
  };

   const addRitual = async (title: string, goalId?: string) => {
      const targetGoalId = goalId || (goals.length > 0 ? goals[0].id : 'general');
      if (authUser && db) {
          await addDoc(collection(db, `users/${authUser.uid}/rituals`), {
              goalId: targetGoalId, title, isCompleted: false, lastCompletedDate: null, createdAt: Date.now()
          });
      } else {
          setRituals(prev => [{ id: Date.now().toString(), goalId: targetGoalId, title, isCompleted: false, lastCompletedDate: null, createdAt: Date.now() }, ...prev]);
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

  const updateGoalWithRituals = async (
    goalId: string, 
    goalUpdates: Partial<VisionGoal>, 
    ritualsToUpdate: {id?: string, title: string, deleted?: boolean}[]
  ) => {
    // 1. Update Goal
    await updateGoal(goalId, goalUpdates);

    // 2. Process Rituals
    for (const r of ritualsToUpdate) {
        if (r.deleted && r.id) {
            await deleteRitual(r.id);
        } else if (r.id) {
            // Update existing
            await updateRitualTitle(r.id, r.title);
        } else if (r.title.trim()) {
            // Add new
            await addRitual(r.title, goalId);
        }
    }
  };

    const uploadImageToStorage = async (base64DataUri: string, storagePath: string): Promise<string> => {
        const storageRef = ref(storage, storagePath);
        
        try {
            // Priority 1: uploadString for base64 (Most reliable in Expo Go)
            if (base64DataUri.startsWith('data:image')) {
                // Ensure correct format for data_url
                const uploadTask = await uploadString(storageRef, base64DataUri, 'data_url');
                console.log(`Successfully uploaded via uploadString: ${uploadTask.metadata.fullPath}`);
            } else {
                // Priority 2: Blob for file:// URIs
                const response = await fetch(base64DataUri);
                const blob = await response.blob();
                await uploadBytes(storageRef, blob);
                console.log(`Successfully uploaded via Blob: ${storagePath}`);
            }
        } catch (e) {
            console.error("Storage upload error:", e);
            throw e;
        }

        return await getDownloadURL(storageRef);
    };

    const regenerateGoalImage = async (goalId: string) => {
      // 1. Check & Deduct Credits (1)
      const success = await deductCredits(1);
      if (!success) {
          alert("You have run out of Cosmic Credits. Top up to generate more imagery.");
          return;
      }
      
      // Set Loading UI
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, isRegeneratingImage: true } : g));
      
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      try {
          const img = await generateVisionBoardImage(goal.title, goal.categories, user);
          if (img) {
              setGoals(prev => prev.map(g => g.id === goalId ? { ...g, imageUrl: img } : g));
              if (authUser && db) {
                  try {
                      const storagePath = `users/${authUser.uid}/goals/${goalId}_${Date.now()}.jpg`;
                      const downloadUrl = await uploadImageToStorage(img, storagePath);
                      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, imageUrl: downloadUrl } : g));
                      await updateDoc(doc(db, `users/${authUser.uid}/goals`, goalId), { imageUrl: downloadUrl });
                  } catch (uploadError) {
                      console.log("Non-fatal upload error:", uploadError);
                  }
              }
          }
      } finally {
          setGoals(prev => prev.map(g => g.id === goalId ? { ...g, isRegeneratingImage: false } : g));
      }
    };

  const personalizeGoalImage = async (goalId: string, selfieUrl: string) => {
      // 1. Check & Deduct Credits (3)
      const success = await deductCredits(3);
      if (!success) throw new Error("INSUFFICIENT_ENERGY");

      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, isRegeneratingImage: true } : g));
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      try {
          const img = await generatePersonalizedGoalImage(selfieUrl, goal.title, goal.categories);
          if (img) {
              setGoals(prev => prev.map(g => g.id === goalId ? { ...g, imageUrl: img } : g));
              if (authUser && db) {
                  try {
                      const storagePath = `users/${authUser.uid}/goals/${goalId}_personal_${Date.now()}.jpg`;
                      const downloadUrl = await uploadImageToStorage(img, storagePath);
                      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, imageUrl: downloadUrl } : g));
                      await updateDoc(doc(db, `users/${authUser.uid}/goals`, goalId), { imageUrl: downloadUrl });
                  } catch (uploadError) {
                      console.log("Non-fatal upload error:", uploadError);
                  }
              }
          }
      } finally {
          setGoals(prev => prev.map(g => g.id === goalId ? { ...g, isRegeneratingImage: false } : g));
      }
  };

  const simulateLifestyle = async (image: string, prompt: string): Promise<string | null> => {
      // 1. Check & Deduct Credits (5)
      const success = await deductCredits(5);
      if (!success) throw new Error("INSUFFICIENT_ENERGY");

      const { generateLifestyleSimulation } = require('../services/geminiService');
      const result = await generateLifestyleSimulation(image, prompt);
      
      if (result) {
          addToLifestyleHistory({ imageUrl: result, prompt });
      }
      return result;
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

   const deductCredits = async (amount: number): Promise<boolean> => {
       const currentBalance = user.credits?.balance || 0;
       if (currentBalance < amount) return false;

       updateUser({
           credits: {
               ...user.credits!,
               balance: currentBalance - amount,
               lifetimeUsed: (user.credits?.lifetimeUsed || 0) + amount
           }
       });
       return true;
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
      updateGoal,
      updateGoalWithRituals,
      deleteGoal,
      addToLifestyleHistory,
      simulateLifestyle,
      logout,
      resetDay,
      purchasePro,
      purchaseCredits,
      restorePurchases,
      deductCredits
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
