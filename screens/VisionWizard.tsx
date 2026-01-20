import React, { useState } from 'react';
import { useManifest } from '../context/ManifestContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ArrowRight, Star, Calendar, Activity, Plus, Check, X } from 'lucide-react';
import { VisionGoal } from '../types';

const GOAL_PLACEHOLDERS: Record<string, string> = {
  'Travel & Adventure': 'e.g., Two weeks in Kyoto, Backpacking Europe, African Safari...',
  'Business & Career': 'e.g., Senior VP promotion, $100k/month revenue, Launching startup...',
  'Love & Relation': 'e.g., Meeting my soulmate, Harmonious marriage, Deep friendships...',
  'Health & Beauty': 'e.g., Run a marathon, 15% body fat, Glowing skin...',
  'Dream Car': 'e.g., Porsche 911 GT3 RS, Matte Black G-Wagon, Tesla Plaid...',
  'Dream Home': 'e.g., Minimalist loft in NYC, Beachfront villa in Tulum...',
};

const RITUAL_PLACEHOLDERS: Record<string, string> = {
  'Travel & Adventure': 'e.g., Save $50 daily, Learn 5 language words, Watch travel vlog...',
  'Business & Career': 'e.g., Call 5 leads before noon, Write 500 words, Networking event weekly...',
  'Love & Relation': 'e.g., Practice active listening, Weekly date night, Express gratitude...',
  'Health & Beauty': 'e.g., Drink 3L water, 30 min gym session, Skincare routine...',
  'Dream Car': 'e.g., Save $200/month, Visualize driving it for 5 mins, Work extra shift...',
  'Dream Home': 'e.g., Check listings daily, Save for downpayment, Declutter current room...',
};

export const VisionWizard: React.FC = () => {
  const { addGoalAndRitual, setScreen, goals } = useManifest();
  const [step, setStep] = useState(1);
  
  // State for Categories
  const [availableCategories, setAvailableCategories] = useState<string[]>([
    'Travel & Adventure', 
    'Business & Career', 
    'Love & Relation', 
    'Health & Beauty', 
    'Dream Car', 
    'Dream Home'
  ]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Custom Category State
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Goal Details State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  
  // Rituals State (Multiple)
  const [habitInput, setHabitInput] = useState('');
  const [habitList, setHabitList] = useState<string[]>([]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleAddCustomCategory = () => {
    if (newCategoryName.trim()) {
      setAvailableCategories(prev => [...prev, newCategoryName.trim()]);
      setSelectedCategories(prev => [...prev, newCategoryName.trim()]); // Auto-select the new one
      setNewCategoryName('');
      setIsAddingCustom(false);
    }
  };

  const handleAddHabit = () => {
    if (habitInput.trim()) {
      setHabitList([...habitList, habitInput.trim()]);
      setHabitInput('');
    }
  };

  const removeHabit = (index: number) => {
    setHabitList(habitList.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const finalHabits = [...habitList];
    if (habitInput.trim()) {
        finalHabits.push(habitInput.trim());
    }
    
    if (finalHabits.length === 0) return;

    addGoalAndRitual(
      { categories: selectedCategories, title, targetDate: date },
      finalHabits
    );
    setScreen('TIMELINE');
  };

  const getPlaceholder = (type: 'GOAL' | 'RITUAL') => {
    if (selectedCategories.length === 0) return "Define your details";
    const category = selectedCategories[0];
    const map = type === 'GOAL' ? GOAL_PLACEHOLDERS : RITUAL_PLACEHOLDERS;
    return map[category] || (type === 'GOAL' ? "Define your custom goal" : "Define your daily action");
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-serif text-gold">Select an Area</h2>
            <p className="text-gray-400 text-sm">Choose one or multiple areas to focus your energy.</p>
            
            <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
              {availableCategories.map(cat => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`p-4 rounded-xl border text-sm font-medium transition-all duration-300 relative overflow-hidden group ${
                      isSelected 
                      ? 'border-gold bg-gold/10 text-white shadow-[0_0_10px_rgba(244,224,185,0.2)]' 
                      : 'border-white/10 bg-surface/50 text-gray-400 hover:border-gold/30'
                    }`}
                  >
                    <span className="relative z-10">{cat}</span>
                    {isSelected && (
                      <div className="absolute top-2 right-2 text-gold opacity-50">
                         <Check size={12} />
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Add Custom Slot Button/Input */}
              {isAddingCustom ? (
                <div className="col-span-1 p-1 rounded-xl border border-gold/50 bg-surface/80 flex items-center">
                   <input 
                      autoFocus
                      className="w-full bg-transparent text-white text-sm px-2 outline-none"
                      placeholder="Category Name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCustomCategory();
                      }}
                      onBlur={() => {
                        if (!newCategoryName) setIsAddingCustom(false);
                      }}
                   />
                   <button onClick={handleAddCustomCategory} className="p-2 text-gold hover:bg-white/10 rounded-full">
                      <Check size={16} />
                   </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingCustom(true)}
                  className="p-4 rounded-xl border border-dashed border-white/20 bg-transparent text-gray-500 hover:text-gold hover:border-gold/50 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  <span>Custom Slot</span>
                </button>
              )}
            </div>

            <Button disabled={selectedCategories.length === 0} onClick={() => setStep(2)}>
              Next <ArrowRight className="inline ml-2 w-4 h-4" />
            </Button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-serif text-gold">Define the Dream</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedCategories.map(c => (
                <span key={c} className="text-[10px] uppercase tracking-widest text-gold bg-gold/10 border border-gold/20 px-2 py-1 rounded">
                  {c}
                </span>
              ))}
            </div>
            <p className="text-gray-400 text-sm">Be specific. What exactly do you desire?</p>
            <Input 
              label="My Goal" 
              placeholder={getPlaceholder('GOAL')} 
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
            <div className="pt-4">
               <label className="block text-sm text-gold/80 font-serif tracking-wide ml-1 mb-2">Manifestation Date</label>
               <input 
                 type="date" 
                 className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-gold/50 outline-none"
                 value={date}
                 onChange={e => setDate(e.target.value)}
               />
            </div>
            <div className="flex gap-4">
              <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
              <Button disabled={!title || !date} onClick={() => setStep(3)}>Next</Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 text-gold mb-2">
              <Activity className="w-5 h-5" />
              <span className="text-sm font-semibold tracking-widest uppercase">Action Plan</span>
            </div>
            <h2 className="text-2xl font-serif text-white">The Bridge</h2>
            <p className="text-gray-400">
              To have <span className="text-gold">{title}</span> by <span className="text-gold">{date}</span>, 
              what are the daily rituals you must commit to?
            </p>
            
            <div className="space-y-3">
                 <div className="flex gap-2">
                    <Input 
                        label="Daily Rituals" 
                        placeholder={getPlaceholder('RITUAL')}
                        value={habitInput}
                        onChange={e => setHabitInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
                        autoFocus
                        className="flex-1"
                    />
                    <button 
                        onClick={handleAddHabit}
                        disabled={!habitInput.trim()}
                        className="mt-8 p-4 bg-gold/10 border border-gold/30 rounded-xl text-gold hover:bg-gold/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <Plus size={20} />
                    </button>
                 </div>

                 {/* List of Habits */}
                 <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
                    {habitList.map((h, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-surface/50 rounded-lg border border-white/5 animate-fade-in">
                            <span className="text-sm text-gray-200">{h}</span>
                            <button onClick={() => removeHabit(i)} className="text-gray-500 hover:text-red-400 p-1">
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                    {habitList.length === 0 && (
                        <p className="text-xs text-gray-600 text-center italic mt-2">Add at least one daily habit.</p>
                    )}
                 </div>
            </div>

             <div className="flex gap-4 pt-4">
              <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
              <Button disabled={habitList.length === 0 && !habitInput.trim()} onClick={handleSubmit}>Manifest It</Button>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-void pt-20 px-6 pb-24">
       <div className="max-w-md mx-auto">
          {/* Progress Bar */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-gold' : 'bg-white/10'}`} />
            ))}
          </div>
          {renderStep()}
       </div>
    </div>
  );
};