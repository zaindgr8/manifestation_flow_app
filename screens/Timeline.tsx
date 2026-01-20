import React, { useState, useRef } from 'react';
import { useManifest } from '../context/ManifestContext';
import { Plus, GripHorizontal, CalendarDays, Loader2, RefreshCw, Upload, X, Camera, Sparkles } from 'lucide-react';
import { Button } from '../components/Button';

// Curated Category Placeholders (High Quality Unsplash)
const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  'Travel & Adventure': 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
  'Business & Career': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
  'Love & Relation': 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&q=80',
  'Health & Beauty': 'https://images.unsplash.com/photo-1544367563-12123d896889?w=800&q=80',
  'Dream Car': 'https://images.unsplash.com/photo-1503376763036-066120622c74?w=800&q=80',
  'Dream Home': 'https://images.unsplash.com/photo-1600596542815-2495db9dc2c3?w=800&q=80',
  'Default': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80' // Mystic Abstract
};

const getPlaceholderForGoal = (categories: string[]) => {
  for (const cat of categories) {
    if (CATEGORY_PLACEHOLDERS[cat]) return CATEGORY_PLACEHOLDERS[cat];
  }
  return CATEGORY_PLACEHOLDERS['Default'];
};

export const Timeline: React.FC = () => {
  const { goals, user, setScreen, regenerateGoalImage, personalizeGoalImage } = useManifest();
  
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [tempSelfie, setTempSelfie] = useState<string | null>(user.selfieUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFeelItClick = (goalId: string) => {
    setActiveGoalId(goalId);
    setTempSelfie(user.selfieUrl);
    setModalOpen(true);
    // Simple haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
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
          const displayImage = goal.imageUrl || getPlaceholderForGoal(goal.categories);
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

      {/* Feel It Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
             <div className="bg-surface w-full max-w-sm rounded-3xl border border-white/10 p-6 shadow-2xl relative overflow-hidden">
                {/* Close Button */}
                <button 
                    onClick={() => setModalOpen(false)} 
                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white z-10"
                >
                    <X size={20} />
                </button>

                <div className="text-center space-y-6 relative z-0">
                    <div>
                        <h2 className="text-2xl font-serif text-white mb-2">Step Into The Vision</h2>
                        <p className="text-xs text-gray-400">Use your quantum identity to bridge the gap.</p>
                    </div>

                    {/* Image Preview */}
                    <div className="relative w-32 h-32 mx-auto">
                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-gold/30 shadow-[0_0_20px_rgba(244,224,185,0.2)]">
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
                            <Upload size={14} />
                        </button>
                    </div>
                    
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                    />

                    <div className="space-y-3">
                        <p className="text-xs text-gold/80 italic border-t border-b border-white/5 py-3">
                            "I am seeing myself in the reality where this goal is already accomplished."
                        </p>
                        
                        <Button onClick={handleConfirmPersonalization} disabled={!tempSelfie}>
                            <div className="flex items-center justify-center gap-2">
                                <Sparkles size={16} /> Manifest This Reality
                            </div>
                        </Button>
                        <button 
                            onClick={() => setModalOpen(false)}
                            className="text-xs text-gray-500 hover:text-gray-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};