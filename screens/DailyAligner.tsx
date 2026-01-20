import React, { useState, useEffect } from 'react';
import { useManifest } from '../context/ManifestContext';
import { Check, RefreshCw } from 'lucide-react';

export const DailyAligner: React.FC = () => {
  const { user, rituals, affirmation, toggleRitual, refreshAffirmation } = useManifest();
  const [showConfetti, setShowConfetti] = useState(false);
  const [loadingAffirmation, setLoadingAffirmation] = useState(false);

  // Calculate progress
  const completedCount = rituals.filter(r => r.isCompleted).length;
  const progress = rituals.length > 0 ? (completedCount / rituals.length) * 100 : 0;
  const isAllComplete = rituals.length > 0 && completedCount === rituals.length;

  useEffect(() => {
    if (isAllComplete) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isAllComplete]);

  const handleRefreshAffirmation = async () => {
    setLoadingAffirmation(true);
    await refreshAffirmation();
    setLoadingAffirmation(false);
  };

  return (
    <div className="min-h-screen bg-void pb-24 px-6 pt-16 relative overflow-x-hidden">
      {/* Confetti Overlay (CSS implementation) */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-gold/10 animate-pulse"></div>
            <div className="bg-surface/90 backdrop-blur-xl p-8 rounded-2xl border border-gold text-center animate-fade-in shadow-[0_0_50px_rgba(244,224,185,0.2)]">
                <h2 className="text-2xl font-serif text-gold mb-2">Manifestation Strengthened</h2>
                <p className="text-white/70">Your actions are aligning with your reality.</p>
            </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
         <div className="w-12 h-12 rounded-full border border-gold/30 p-0.5">
            {user.selfieUrl ? (
                <img src={user.selfieUrl} className="w-full h-full rounded-full object-cover" alt="User" />
            ) : (
                <div className="w-full h-full rounded-full bg-surface" />
            )}
         </div>
         <div>
            <h1 className="text-2xl font-serif text-white">Good Morning, {user.name.split(' ')[0]}</h1>
            <p className="text-xs text-gray-400">Align your frequency.</p>
         </div>
      </div>

      {/* Affirmation Card */}
      <div className="relative bg-gradient-to-br from-[#1A1A2E] to-midnight p-6 rounded-2xl border border-white/5 mb-8 overflow-hidden group">
         <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold/10 rounded-full blur-3xl group-hover:bg-gold/20 transition-all"></div>
         
         <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] tracking-[0.2em] text-gold uppercase">Subconscious Programming</span>
            <button onClick={handleRefreshAffirmation} className={`text-white/30 hover:text-gold transition-colors ${loadingAffirmation ? 'animate-spin' : ''}`}>
                <RefreshCw size={14} />
            </button>
         </div>
         
         <p className="text-xl font-serif leading-relaxed text-white/90 italic">
            "{affirmation.text}"
         </p>
      </div>

      {/* Daily Rituals */}
      <div>
        <div className="flex justify-between items-end mb-6">
            <h2 className="text-lg font-serif text-white">Required Actions</h2>
            <span className="text-xs text-gray-500">{completedCount}/{rituals.length} Completed</span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 w-full bg-surface rounded-full mb-6 overflow-hidden">
            <div 
                className="h-full bg-gold transition-all duration-1000 ease-out" 
                style={{ width: `${progress}%` }}
            ></div>
        </div>

        <div className="space-y-4">
            {rituals.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm bg-surface/30 rounded-xl border border-dashed border-white/5">
                    No rituals set. Go to Timeline to create goals.
                </div>
            ) : (
                rituals.map(ritual => (
                    <div 
                        key={ritual.id}
                        onClick={() => toggleRitual(ritual.id)}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                            ritual.isCompleted 
                            ? 'bg-gold/10 border-gold/30' 
                            : 'bg-surface/50 border-white/5 hover:border-white/10'
                        }`}
                    >
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                            ritual.isCompleted ? 'bg-gold border-gold' : 'border-gray-500'
                        }`}>
                            {ritual.isCompleted && <Check size={14} className="text-void" />}
                        </div>
                        <span className={`text-sm ${ritual.isCompleted ? 'text-gold line-through opacity-70' : 'text-gray-200'}`}>
                            {ritual.title}
                        </span>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};