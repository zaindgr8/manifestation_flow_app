import React, { useState, useRef, useEffect } from 'react';
import { useManifest } from '../context/ManifestContext';
import { Plus, GripHorizontal, CalendarDays, Loader2, RefreshCw, Upload, X, Camera, Sparkles, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '../components/Button';
import { Gender } from '../types';

// Gender-Specific Placeholders
// Fallback: Default/Abstract
const PLACEHOLDER_DB: Record<string, { Male: string; Female: string; Default: string }> = {
  'Travel & Adventure': {
      Male: 'https://images.unsplash.com/photo-1507038732509-8b1a9623223a?w=800&q=80', // Man traveller
      Female: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80', // Woman traveller
      Default: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80'
  },
  'Business & Career': {
      Male: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80', // Man business
      Female: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80', // Woman business
      Default: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80'
  },
  'Love & Relation': {
      Male: 'https://images.unsplash.com/photo-1621516223592-d6981881b212?w=800&q=80', // Couple
      Female: 'https://images.unsplash.com/photo-1529634806980-85c3dd6d62d0?w=800&q=80', // Couple
      Default: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&q=80'
  },
  'Health & Beauty': {
      Male: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80', // Gym male
      Female: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80', // Gym female
      Default: 'https://images.unsplash.com/photo-1544367563-12123d896889?w=800&q=80'
  },
  'Dream Car': {
      Male: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80', // Luxury car
      Female: 'https://images.unsplash.com/photo-1616423664033-02e071e62689?w=800&q=80', // Luxury car
      Default: 'https://images.unsplash.com/photo-1503376763036-066120622c74?w=800&q=80'
  },
  'Dream Home': {
      Male: 'https://images.unsplash.com/photo-1613545325278-f24b0cae1224?w=800&q=80',
      Female: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
      Default: 'https://images.unsplash.com/photo-1600596542815-2495db9dc2c3?w=800&q=80'
  },
  'Default': {
      Male: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80',
      Female: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
      Default: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80'
  }
};

const getPlaceholderForGoal = (categories: string[], gender?: Gender) => {
  const g = (gender === 'Male' || gender === 'Female') ? gender : 'Default';
  
  for (const cat of categories) {
    if (PLACEHOLDER_DB[cat]) {
        return PLACEHOLDER_DB[cat][g];
    }
  }
  return PLACEHOLDER_DB['Default'][g];
};

export const Timeline: React.FC = () => {
  const { goals, user, setScreen, regenerateGoalImage, personalizeGoalImage } = useManifest();
  
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [tempSelfie, setTempSelfie] = useState<string | null>(user.selfieUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Visualization Timer State
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [breathingPhase, setBreathingPhase] = useState('Breathe In'); // Breathe In, Hold, Breathe Out

  useEffect(() => {
    let interval: any;
    if (timerActive) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  useEffect(() => {
      // Breathing Guide Logic (4-4-4 Box Breathingish or simpler)
      if (timerActive) {
        const phase = seconds % 12; // 12 second cycle
        if (phase < 5) setBreathingPhase("Deep Inhale...");
        else if (phase < 7) setBreathingPhase("Hold...");
        else setBreathingPhase("Slow Exhale...");
      }
  }, [seconds, timerActive]);

  // Haptics at key psychology milestones
  useEffect(() => {
    if (seconds === 17) {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Ignition point
    }
    if (seconds === 68) {
        if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]); // Manifestation Lock
        setTimerActive(false); // Stop timer at 68s (optional, or let it run)
    }
  }, [seconds]);

  const handleFeelItClick = (goalId: string) => {
    setActiveGoalId(goalId);
    setTempSelfie(user.selfieUrl);
    setModalOpen(true);
    setIsVisualizing(false); // Reset visualization state
    setSeconds(0);
    setTimerActive(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setTempSelfie(url);
    }
  };

  const handleConfirmPersonalization = () => {
    if (activeGoalId && tempSelfie) {
        personalizeGoalImage(activeGoalId, tempSelfie);
        setModalOpen(false);
        setActiveGoalId(null);
        // Stronger haptic confirmation
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    }
  };

  const handleRegenerateImage = (e: React.MouseEvent, goalId: string) => {
    e.stopPropagation(); // Prevent triggering other card actions if any
    regenerateGoalImage(goalId);
  };

  const startVisualization = () => {
      // Trigger background personalization if we have a selfie and goal
      if (activeGoalId && tempSelfie) {
          personalizeGoalImage(activeGoalId, tempSelfie);
      }
      setIsVisualizing(true);
      setTimerActive(true);
  };

  const resetVisualization = () => {
      setSeconds(0);
      setTimerActive(false);
      setIsVisualizing(false);
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center border border-white/10">
        <GripHorizontal className="text-gray-600" />
      </div>
      <h3 className="text-xl font-serif text-white">Your timeline is empty</h3>
      <p className="text-gray-500 text-sm max-w-xs">The void is waiting for your vision. Create your first goal to begin.</p>
      <button 
        onClick={() => setScreen('WIZARD')}
        className="text-gold border-b border-gold pb-1 mt-4 hover:opacity-80 transition-opacity"
      >
        Create Vision
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-void pb-24 px-4 pt-16 relative">
      <div className="flex justify-between items-end mb-8 px-2">
        <div>
           <h1 className="text-3xl font-serif text-white">Timeline</h1>
           <p className="text-xs text-gold/60 uppercase tracking-widest mt-1">Future Memories</p>
        </div>
        <button 
          onClick={() => setScreen('WIZARD')}
          className="bg-surface hover:bg-surface/80 p-3 rounded-full border border-white/10 transition-all"
        >
          <Plus className="text-white w-5 h-5" />
        </button>
      </div>

      <div className="space-y-12 relative">
        {/* Vertical Line */}
        {goals.length > 0 && (
           <div className="absolute left-6 top-4 bottom-0 w-px bg-gradient-to-b from-gold/50 via-white/10 to-transparent z-0"></div>
        )}

        {goals.length === 0 ? <EmptyState /> : goals.map((goal, index) => {
          const hasAiImage = !!goal.imageUrl;
          const displayImage = goal.imageUrl || getPlaceholderForGoal(goal.categories, user.gender);
          const isRegenerating = goal.isRegeneratingImage;
          
          return (
            <div key={goal.id} className="relative z-10 pl-16 animate-fade-in" style={{ animationDelay: `${index * 150}ms` }}>
               {/* Date Bubble */}
               <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-midnight border border-gold/30 flex flex-col items-center justify-center text-[10px] text-gold z-20 shadow-lg">
                  <span className="font-bold">{new Date(goal.targetDate).toLocaleString('default', { month: 'short' })}</span>
                  <span className="opacity-70">{new Date(goal.targetDate).getFullYear().toString().slice(-2)}</span>
               </div>

               {/* Card */}
               <div className="bg-surface/80 backdrop-blur-md rounded-2xl overflow-hidden border border-white/5 shadow-2xl group hover:border-gold/20 transition-all duration-500">
                  <div className="relative h-48 w-full overflow-hidden bg-midnight">
                    <img 
                      src={displayImage} 
                      alt={goal.title} 
                      className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${hasAiImage ? 'opacity-100' : 'opacity-60 grayscale-[30%]'}`} 
                    />
                    
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-midnight to-transparent"></div>
                    
                    {/* Regenerate Button */}
                    <button 
                        onClick={(e) => handleRegenerateImage(e, goal.id)}
                        disabled={isRegenerating}
                        className={`absolute top-2 right-2 flex items-center gap-1 bg-black/40 hover:bg-black/60 backdrop-blur-md px-2 py-2 rounded-full border border-white/10 transition-colors z-30 ${isRegenerating ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                    >
                         {isRegenerating ? (
                            <Loader2 className="w-4 h-4 text-gold animate-spin" />
                         ) : (
                            <RefreshCw className="w-4 h-4 text-white/80 hover:text-gold" />
                         )}
                    </button>

                    {/* Loading Indicator for Initial Generation */}
                    {!hasAiImage && !isRegenerating && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
                            <span className="text-[9px] text-white/80">Placeholder</span>
                        </div>
                    )}

                    {/* Superimposed User Selfie (The Bridge) */}
                    {user.selfieUrl && (
                      <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full border-2 border-gold/50 overflow-hidden shadow-lg animate-float">
                        <img src={user.selfieUrl} alt="Me" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {goal.categories.map(cat => (
                         <span key={cat} className="text-[9px] uppercase tracking-widest text-gray-400 border border-white/10 px-2 py-0.5 rounded">
                           {cat}
                         </span>
                      ))}
                    </div>
                    <h3 className="text-xl font-serif text-white mb-4">{goal.title}</h3>
                    
                    <button 
                      onClick={() => handleFeelItClick(goal.id)}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gold transition-colors flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Sparkles className="w-4 h-4" /> Feel It
                    </button>
                  </div>
               </div>
            </div>
          );
        })}
      </div>

      {/* Feel It Modal (Visualizer) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-fade-in">
             <div className="w-full max-w-sm rounded-3xl relative overflow-hidden flex flex-col items-center">
                {/* Close Button */}
                <button 
                    onClick={() => {
                        setModalOpen(false);
                        resetVisualization();
                    }} 
                    className="absolute top-0 right-0 p-4 text-gray-500 hover:text-white z-50"
                >
                    <X size={24} />
                </button>

                {!isVisualizing ? (
                    // STEP 1: PREPARATION
                    <div className="text-center space-y-6 animate-fade-in w-full">
                        <div>
                            <h2 className="text-3xl font-serif text-white mb-2">Step Into The Vision</h2>
                            <p className="text-sm text-gray-400">Use your quantum identity to bridge the gap.</p>
                        </div>

                        {/* Image Preview */}
                        <div className="relative w-40 h-40 mx-auto">
                            <div className="w-full h-full rounded-full overflow-hidden border-2 border-gold/30 shadow-[0_0_30px_rgba(244,224,185,0.2)]">
                                {tempSelfie ? (
                                    <img src={tempSelfie} alt="Identity" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-black flex items-center justify-center">
                                        <Camera className="text-gray-600" />
                                    </div>
                                )}
                            </div>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 bg-gold text-void p-2 rounded-full hover:bg-white transition-colors shadow-lg"
                            >
                                <Upload size={16} />
                            </button>
                        </div>
                        
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileChange}
                        />

                        {/* Actions */}
                        <div className="space-y-3 w-full pt-4">
                            <Button onClick={startVisualization} disabled={!tempSelfie}>
                                <div className="flex items-center justify-center gap-2">
                                    <Play size={18} fill="currentColor" /> Begin 68s Visualization
                                </div>
                            </Button>
                            
                             <button 
                                onClick={handleConfirmPersonalization}
                                disabled={!tempSelfie}
                                className="text-xs text-gold/60 hover:text-gold w-full py-2"
                            >
                                (Just update my photo)
                            </button>
                        </div>
                    </div>
                ) : (
                    // STEP 2: 68-SECOND TIMER
                    <div className="flex flex-col items-center justify-center w-full h-[60vh] space-y-8 animate-fade-in relative">
                        {/* Timer Circle */}
                        <div className="relative w-64 h-64 flex items-center justify-center">
                            {/* Pulsing Background */}
                            <div 
                                className={`absolute inset-0 bg-gold/5 rounded-full blur-2xl transition-all duration-[4000ms] ease-in-out ${breathingPhase.includes('Inhale') ? 'scale-110 opacity-60' : 'scale-90 opacity-20'}`}
                            ></div>
                            
                            {/* Progress Ring */}
                            <svg className="w-full h-full transform -rotate-90">
                                <circle 
                                    cx="128" cy="128" r="120" 
                                    stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" 
                                />
                                <circle 
                                    cx="128" cy="128" r="120" 
                                    stroke="#F4E0B9" strokeWidth="4" fill="none"
                                    strokeDasharray={2 * Math.PI * 120}
                                    strokeDashoffset={2 * Math.PI * 120 * (1 - seconds / 68)}
                                    className="transition-all duration-1000 linear"
                                />
                            </svg>

                            {/* Content inside Circle */}
                            <div className="absolute flex flex-col items-center text-center">
                                <span className="text-5xl font-serif text-white font-bold tabular-nums">
                                    {seconds}s
                                </span>
                                <span className="text-xs text-gold uppercase tracking-widest mt-2">
                                    {seconds >= 68 ? "LOCKED" : seconds >= 17 ? "IGNITED" : "FOCUS"}
                                </span>
                            </div>
                        </div>

                        {/* Breathing Guide / Affirmation */}
                        <div className="text-center h-20">
                             {seconds >= 68 ? (
                                 <div className="animate-fade-in">
                                     <h3 className="text-2xl text-gold font-serif mb-2">Manifestation Anchored</h3>
                                     <p className="text-gray-400 text-sm">The universe is rearranging itself.</p>
                                 </div>
                             ) : (
                                 <div className="space-y-2">
                                     <h3 className={`text-xl font-light text-white/90 transition-opacity duration-1000 ${breathingPhase.includes('Hold') ? 'opacity-50' : 'opacity-100'}`}>
                                        {breathingPhase}
                                     </h3>
                                     <p className="text-xs text-gray-500 italic">
                                         Feel the reality of having it now.
                                     </p>
                                 </div>
                             )}
                        </div>

                        {/* Controls */}
                        <div className="flex gap-6">
                            {seconds < 68 && (
                                <button 
                                    onClick={() => setTimerActive(!timerActive)}
                                    className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                                >
                                    {timerActive ? <Pause size={24} /> : <Play size={24} fill="currentColor" />}
                                </button>
                            )}
                            <button 
                                onClick={resetVisualization}
                                className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                            >
                                <RotateCcw size={24} />
                            </button>
                        </div>
                    </div>
                )}
             </div>
        </div>
      )}
    </div>
  );
};