import React, { useState, useEffect } from 'react';
import { useManifest } from '../context/ManifestContext';
import { Check, RefreshCw, Settings, Bell, Sun, Moon, X, Calendar as CalendarIcon, Flame, CheckCircle2, Plus, Edit2, Trash2, Save, Heart, Sparkles } from 'lucide-react';
import { Button } from '../components/Button';

export const DailyAligner: React.FC = () => {
  const { user, rituals, affirmation, toggleRitual, refreshAffirmation, updateUser, acknowledgeAffirmation, addRitual, deleteRitual, updateRitualTitle, gratitudeEntries, addGratitude } = useManifest();
  const [showConfetti, setShowConfetti] = useState(false);
  const [loadingAffirmation, setLoadingAffirmation] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Add Ritual State
  const [isAdding, setIsAdding] = useState(false);
  const [newRitualTitle, setNewRitualTitle] = useState('');

  // Edit Ritual State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Gratitude State
  const [gratitudeInput, setGratitudeInput] = useState('');

  // Settings State
  const [morningTime, setMorningTime] = useState(user.reminderTimes?.morning || '08:00');
  const [eveningTime, setEveningTime] = useState(user.reminderTimes?.evening || '20:00');

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

  // Check if we need to force a refresh based on time vs current affirmation type
  useEffect(() => {
     if (user.hasSetSchedule) {
        // Logic to verify if currently displayed affirmation matches the time of day
        // This is handled partly in Context, but we trigger a refresh on mount to ensure freshness
        refreshAffirmation();
     }
  }, [user.hasSetSchedule]);

  const handleRefreshAffirmation = async () => {
    setLoadingAffirmation(true);
    await refreshAffirmation(affirmation.type);
    setLoadingAffirmation(false);
  };

  const saveSettings = () => {
    updateUser({
        reminderTimes: { morning: morningTime, evening: eveningTime },
        hasSetSchedule: true
    });
    
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("ManifestFlow Calendar", {
            body: `Affirmations scheduled for ${morningTime} and ${eveningTime}.`,
          });
        }
      });
    }
    
    setShowSettings(false);
    refreshAffirmation(); // Refresh to match new schedule immediately
  };

  const handleAcknowledge = () => {
      acknowledgeAffirmation();
  };

  const handleAddRitual = () => {
    if (newRitualTitle.trim()) {
      addRitual(newRitualTitle.trim());
      setNewRitualTitle('');
      setIsAdding(false);
    }
  };

  const handleAddGratitude = () => {
    if (gratitudeInput.trim()) {
        addGratitude(gratitudeInput.trim());
        setGratitudeInput('');
    }
  };

  const startEditing = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const saveEditing = () => {
    if (editingId && editingTitle.trim()) {
      updateRitualTitle(editingId, editingTitle.trim());
      setEditingId(null);
      setEditingTitle('');
    }
  };

  // Filter todays gratitude
  const todaysGratitude = gratitudeEntries.filter(g => {
    const d = new Date(g.createdAt);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  return (
    <div className="min-h-screen bg-void pb-24 px-6 pt-16 relative overflow-x-hidden">
      {/* Confetti Overlay */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-gold/10 animate-pulse"></div>
            <div className="bg-surface/90 backdrop-blur-xl p-8 rounded-2xl border border-gold text-center animate-fade-in shadow-[0_0_50px_rgba(244,224,185,0.2)]">
                <h2 className="text-2xl font-serif text-gold mb-2">Manifestation Strengthened</h2>
                <p className="text-white/70">Your actions are aligning with your reality.</p>
            </div>
        </div>
      )}

      {/* Settings Modal (Also used for initial setup) */}
      {(showSettings || !user.hasSetSchedule) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
           <div className="bg-surface w-full max-w-sm rounded-2xl border border-white/10 p-6 shadow-2xl relative">
              {user.hasSetSchedule && (
                <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                    <X size={20} />
                </button>
              )}
              
              <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                <Bell size={18} className="text-gold" /> 
                {user.hasSetSchedule ? "Affirmation Schedule" : "Set Your Rhythm"}
              </h2>

              <div className="space-y-6">
                <div>
                   <label className="flex items-center gap-2 text-sm text-gold/80 mb-2">
                      <Sun size={14} /> Morning Intention
                   </label>
                   <input 
                     type="time" 
                     value={morningTime}
                     onChange={(e) => setMorningTime(e.target.value)}
                     className="w-full bg-void border border-white/10 rounded-xl p-3 text-white focus:border-gold/50 outline-none"
                   />
                </div>
                <div>
                   <label className="flex items-center gap-2 text-sm text-gold/80 mb-2">
                      <Moon size={14} /> Evening Gratitude
                   </label>
                   <input 
                     type="time" 
                     value={eveningTime}
                     onChange={(e) => setEveningTime(e.target.value)}
                     className="w-full bg-void border border-white/10 rounded-xl p-3 text-white focus:border-gold/50 outline-none"
                   />
                </div>
                
                <div className="p-3 bg-white/5 rounded-lg flex items-start gap-3">
                   <CalendarIcon size={16} className="text-gold mt-1" />
                   <p className="text-xs text-gray-400">
                     Affirmations will appear based on these times. {user.hasSetSchedule ? '' : 'Please define when you wake and sleep.'}
                   </p>
                </div>

                <Button onClick={saveSettings}>Confirm Rhythm</Button>
              </div>
           </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border border-gold/30 p-0.5">
                {user.selfieUrl ? (
                    <img src={user.selfieUrl} className="w-full h-full rounded-full object-cover" alt="User" />
                ) : (
                    <div className="w-full h-full rounded-full bg-surface" />
                )}
            </div>
            <div>
                <h1 className="text-2xl font-serif text-white">Good {new Date().getHours() < 12 ? 'Morning' : 'Evening'}, {user.name.split(' ')[0]}</h1>
                <div className="flex items-center gap-2">
                   <p className="text-xs text-gray-400">Align your frequency.</p>
                   {user.affirmationStreak > 0 && (
                       <div className="flex items-center gap-1 bg-gold/10 px-1.5 py-0.5 rounded-full border border-gold/20">
                          <Flame size={10} className="text-gold" fill="currentColor" />
                          <span className="text-[10px] text-gold font-bold">{user.affirmationStreak} Day Streak</span>
                       </div>
                   )}
                </div>
            </div>
         </div>
         <button 
           onClick={() => setShowSettings(true)}
           className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-gold transition-colors"
         >
            <Settings size={20} />
         </button>
      </div>

      {/* Gratitude Frequency Tuner */}
      <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
             <Heart size={16} className="text-gold" />
             <h2 className="text-sm font-serif text-white">Frequency Tuner</h2>
          </div>
          <div className="bg-surface/50 border border-white/5 rounded-2xl p-4">
             {todaysGratitude.length < 3 ? (
                <div className="flex gap-2">
                    <input 
                       type="text"
                       value={gratitudeInput}
                       onChange={(e) => setGratitudeInput(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleAddGratitude()}
                       placeholder={`I am grateful for... (${3 - todaysGratitude.length} remaining)`}
                       className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none"
                    />
                    <button onClick={handleAddGratitude} disabled={!gratitudeInput.trim()} className="text-gold disabled:opacity-30">
                        <Plus size={18} />
                    </button>
                </div>
             ) : (
                <div className="text-center py-1">
                    <p className="text-xs text-gold tracking-widest uppercase flex items-center justify-center gap-2">
                        <Sparkles size={12} /> Frequency Raised
                    </p>
                </div>
             )}
             
             {todaysGratitude.length > 0 && (
                 <div className="mt-3 space-y-2">
                     {todaysGratitude.map((g) => (
                         <div key={g.id} className="text-xs text-gray-400 flex items-center gap-2 animate-fade-in">
                             <div className="w-1 h-1 rounded-full bg-gold"></div>
                             {g.text}
                         </div>
                     ))}
                 </div>
             )}
          </div>
      </div>

      {/* Affirmation Card */}
      <div className="relative bg-gradient-to-br from-[#1A1A2E] to-midnight p-6 rounded-2xl border border-white/5 mb-8 overflow-hidden group">
         <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold/10 rounded-full blur-3xl group-hover:bg-gold/20 transition-all"></div>
         
         <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
                {affirmation.type === 'MORNING' ? <Sun size={12} className="text-gold" /> : <Moon size={12} className="text-gold" />}
                <span className="text-[10px] tracking-[0.2em] text-gold uppercase">
                    {affirmation.type} Programming
                </span>
            </div>
            <button 
                onClick={handleRefreshAffirmation} 
                className={`text-white/30 hover:text-gold transition-colors ${loadingAffirmation ? 'animate-spin' : ''}`}
                title="Regenerate Affirmation"
            >
                <RefreshCw size={14} />
            </button>
         </div>
         
         <p className="text-xl font-serif leading-relaxed text-white/90 italic min-h-[3.5rem] mb-6">
            {loadingAffirmation ? (
                <span className="opacity-50 text-base not-italic font-sans">Receiving download...</span>
            ) : (
                `"${affirmation.text}"`
            )}
         </p>
         
         {/* Acknowledgement Action */}
         <div className="flex justify-end items-center gap-4 border-t border-white/5 pt-4">
             {affirmation.isAcknowledged ? (
                 <div className="flex items-center gap-2 text-gold text-xs uppercase tracking-widest animate-fade-in">
                     <CheckCircle2 size={14} /> Frequency Locked
                 </div>
             ) : (
                 <button 
                   onClick={handleAcknowledge}
                   className="flex items-center gap-2 px-4 py-2 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-full text-gold text-xs uppercase tracking-widest transition-all active:scale-95"
                 >
                     <Check size={14} /> I Affirm This
                 </button>
             )}
         </div>
      </div>

      {/* Daily Rituals */}
      <div>
        <div className="flex justify-between items-end mb-6">
            <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif text-white">Required Actions</h2>
                <button 
                    onClick={() => setIsAdding(true)} 
                    className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-gold transition-colors"
                >
                    <Plus size={16} />
                </button>
            </div>
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
            {/* Add New Ritual Input */}
            {isAdding && (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-gold/30 bg-surface/50 animate-fade-in">
                    <input 
                        type="text" 
                        value={newRitualTitle}
                        onChange={(e) => setNewRitualTitle(e.target.value)}
                        placeholder="What is your new daily ritual?"
                        className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/20"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleAddRitual()}
                    />
                    <button onClick={handleAddRitual} className="text-gold hover:text-white transition-colors">
                        <Check size={16} />
                    </button>
                    <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-red-400 transition-colors">
                        <X size={16} />
                    </button>
                </div>
            )}

            {rituals.length === 0 && !isAdding ? (
                <div className="text-center py-8 text-gray-500 text-sm bg-surface/30 rounded-xl border border-dashed border-white/5">
                    No rituals set. Create a goal or add a custom action.
                </div>
            ) : (
                rituals.map(ritual => (
                    <div 
                        key={ritual.id}
                        className={`group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                            ritual.isCompleted 
                            ? 'bg-gold/10 border-gold/30' 
                            : 'bg-surface/50 border-white/5 hover:border-white/10'
                        }`}
                    >
                        {editingId === ritual.id ? (
                            <div className="flex-1 flex items-center gap-3">
                                <input 
                                    type="text" 
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    className="flex-1 bg-transparent text-white text-sm outline-none border-b border-gold/50 pb-1"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && saveEditing()}
                                />
                                <button onClick={saveEditing} className="text-gold">
                                    <Save size={14} />
                                </button>
                                <button onClick={() => setEditingId(null)} className="text-gray-500">
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <div 
                                    onClick={() => toggleRitual(ritual.id)}
                                    className={`cursor-pointer w-6 h-6 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${
                                    ritual.isCompleted ? 'bg-gold border-gold' : 'border-gray-500'
                                }`}>
                                    {ritual.isCompleted && <Check size={14} className="text-void" />}
                                </div>
                                
                                <span 
                                    onClick={() => toggleRitual(ritual.id)}
                                    className={`flex-1 text-sm cursor-pointer ${ritual.isCompleted ? 'text-gold line-through opacity-70' : 'text-gray-200'}`}
                                >
                                    {ritual.title}
                                </span>

                                {/* Action Buttons (Visible on hover/group-hover) */}
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => startEditing(ritual.id, ritual.title)}
                                        className="text-gray-500 hover:text-gold p-1"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button 
                                        onClick={() => deleteRitual(ritual.id)}
                                        className="text-gray-500 hover:text-red-400 p-1"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};