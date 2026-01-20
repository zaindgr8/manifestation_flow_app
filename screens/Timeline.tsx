import React from 'react';
import { useManifest } from '../context/ManifestContext';
import { Plus, GripHorizontal, CalendarDays } from 'lucide-react';

export const Timeline: React.FC = () => {
  const { goals, user, setScreen } = useManifest();

  // Helper to trigger haptic vibe (if on mobile) or subtle animation
  const feelIt = () => {
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
    // Could add visual feedback state here
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
    <div className="min-h-screen bg-void pb-24 px-4 pt-16">
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
          // Generate deterministic placeholder based on goal content for visual consistency
          // In a real app, this would come from Gemini or an image gen API
          const imageSeed = goal.id.slice(-3); 
          const imageUrl = `https://picsum.photos/seed/${imageSeed}/400/300`;

          return (
            <div key={goal.id} className="relative z-10 pl-16 animate-fade-in" style={{ animationDelay: `${index * 150}ms` }}>
               {/* Date Bubble */}
               <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-midnight border border-gold/30 flex flex-col items-center justify-center text-[10px] text-gold z-20 shadow-lg">
                  <span className="font-bold">{new Date(goal.targetDate).toLocaleString('default', { month: 'short' })}</span>
                  <span className="opacity-70">{new Date(goal.targetDate).getFullYear().toString().slice(-2)}</span>
               </div>

               {/* Card */}
               <div className="bg-surface/80 backdrop-blur-md rounded-2xl overflow-hidden border border-white/5 shadow-2xl group hover:border-gold/20 transition-all duration-500">
                  <div className="relative h-48 w-full overflow-hidden">
                    <img src={imageUrl} alt={goal.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-midnight to-transparent"></div>
                    
                    {/* Superimposed User Selfie (The Bridge) */}
                    {user.selfieUrl && (
                      <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full border-2 border-gold/50 overflow-hidden shadow-lg animate-float">
                        <img src={user.selfieUrl} alt="Me" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 border border-white/10 px-2 py-1 rounded">{goal.category}</span>
                    </div>
                    <h3 className="text-xl font-serif text-white mb-4">{goal.title}</h3>
                    
                    <button 
                      onClick={feelIt}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gold transition-colors flex items-center justify-center gap-2 active:scale-95"
                    >
                      <SparklesIcon /> Feel It
                    </button>
                  </div>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SparklesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
);
