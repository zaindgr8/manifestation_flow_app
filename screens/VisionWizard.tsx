import React, { useState, useEffect } from 'react';
import { useManifest } from '../context/ManifestContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ArrowRight, Star, Calendar, Activity, Plus, Check, X, ArrowLeft, Loader2 } from 'lucide-react';

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

type CategoryData = {
  title: string;
  targetDate: string;
  rituals: string[];
};

export const VisionWizard: React.FC = () => {
  const { addGoalAndRitual, setScreen, goals } = useManifest();
  
  // Step 1: Selection Phase
  // Step 2: Definition Phase (Looping through categories)
  const [phase, setPhase] = useState<'SELECTION' | 'DEFINITION'>('SELECTION');
  
  // Category Selection State
  const [availableCategories, setAvailableCategories] = useState<string[]>([
    'Travel & Adventure', 
    'Business & Career', 
    'Love & Relation', 
    'Health & Beauty', 
    'Dream Car', 
    'Dream Home'
  ]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Definition Flow State
  // flowIndex maps to: 0->Cat1 Goal, 1->Cat1 Rituals, 2->Cat2 Goal, 3->Cat2 Rituals...
  const [flowIndex, setFlowIndex] = useState(0); 
  
  // Data Store
  const [formData, setFormData] = useState<Record<string, CategoryData>>({});
  const [currentRitualInput, setCurrentRitualInput] = useState(''); // Temp input for the ritual adder
  
  // Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helpers
  const currentCategoryIndex = Math.floor(flowIndex / 2);
  const currentCategory = selectedCategories[currentCategoryIndex];
  const isRitualStep = flowIndex % 2 === 1;

  // Identify active categories to disable them
  const activeCategories = new Set(goals.flatMap(g => g.categories));

  const toggleCategory = (cat: string) => {
    // Prevent toggling if already active in Timeline
    if (activeCategories.has(cat)) return;

    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleAddCustomCategory = () => {
    if (newCategoryName.trim()) {
      const name = newCategoryName.trim();
      setAvailableCategories(prev => [...prev, name]);
      setSelectedCategories(prev => [...prev, name]);
      setNewCategoryName('');
      setIsAddingCustom(false);
    }
  };

  const updateFormData = (field: keyof CategoryData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [currentCategory]: {
        ...(prev[currentCategory] || { title: '', targetDate: '', rituals: [] }),
        [field]: value
      }
    }));
  };

  const addRitualToCurrent = () => {
    if (currentRitualInput.trim()) {
      const currentRituals = formData[currentCategory]?.rituals || [];
      updateFormData('rituals', [...currentRituals, currentRitualInput.trim()]);
      setCurrentRitualInput('');
    }
  };

  const removeRitualFromCurrent = (index: number) => {
    const currentRituals = formData[currentCategory]?.rituals || [];
    updateFormData('rituals', currentRituals.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (phase === 'SELECTION') {
      // Auto-add custom category if user typed but didn't click check
      let finalSelected = [...selectedCategories];
      if (isAddingCustom && newCategoryName.trim()) {
          const name = newCategoryName.trim();
          if (!activeCategories.has(name)) { // Only add if not active
             // Ensure it's in available (visual only)
             setAvailableCategories(prev => prev.includes(name) ? prev : [...prev, name]);
             // Add to selected
             finalSelected = [...finalSelected, name];
          }
      }

      if (finalSelected.length === 0) return;
      
      setSelectedCategories(finalSelected); // Update state just in case
      
      // Initialize data structure for selected categories
      const initialData: Record<string, CategoryData> = {};
      finalSelected.forEach(cat => {
        initialData[cat] = { title: '', targetDate: '', rituals: [] };
      });
      setFormData(prev => ({ ...prev, ...initialData }));
      setPhase('DEFINITION');
      setFlowIndex(0);
    } else {
      // Definition Phase
      if (isRitualStep) {
        const currentData = formData[currentCategory];
        // Ensure at least one ritual exists (including potentially the one just in input)
        const effectiveRituals = [...(currentData?.rituals || [])];
        if (currentRitualInput.trim()) effectiveRituals.push(currentRitualInput.trim());

        if (effectiveRituals.length === 0) return; // Block if no rituals

        // Before moving on, ensure we saved the pending input if any
        if (currentRitualInput.trim()) {
             updateFormData('rituals', effectiveRituals);
             setCurrentRitualInput('');
        }

        // Check if this was the last step
        if (flowIndex === (selectedCategories.length * 2) - 1) {
          // Pass the updated data for this category explicitly to avoid stale state closure
          const finalDataOverride = {
             ...formData,
             [currentCategory]: {
                 ...formData[currentCategory],
                 rituals: effectiveRituals
             }
          };
          handleSubmitAll(finalDataOverride);
        } else {
          setFlowIndex(prev => prev + 1);
        }
      } else {
        // Goal Step validation
        const currentData = formData[currentCategory];
        if (!currentData?.title || !currentData?.targetDate) return;
        setFlowIndex(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (phase === 'SELECTION') {
      setScreen('TIMELINE'); 
    } else {
      if (flowIndex === 0) {
        setPhase('SELECTION');
      } else {
        setFlowIndex(prev => prev - 1);
      }
    }
  };

  const handleSubmitAll = async (overrideData?: Record<string, CategoryData>) => {
    if (isSubmitting) return; // Prevention
    setIsSubmitting(true);

    const dataToUse = overrideData || formData;

    try {
        // Process all categories
        for (const cat of selectedCategories) {
        const data = dataToUse[cat];
        if (data) {
            await addGoalAndRitual(
            { 
                categories: [cat], // Separate category for specific placeholder logic
                title: data.title, 
                targetDate: data.targetDate 
            },
            data.rituals
            );
        }
        }
        setScreen('TIMELINE');
    } catch (e) {
        console.error("Submission error", e);
        setIsSubmitting(false);
    }
  };

  const renderSelection = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-serif text-gold">Select Areas</h2>
      <p className="text-gray-400 text-sm">Choose the areas you want to manifest in this session.</p>
      
      <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
        {availableCategories.map(cat => {
          const isSelected = selectedCategories.includes(cat);
          const isActive = activeCategories.has(cat);
          
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              disabled={isActive}
              className={`p-4 rounded-xl border text-sm font-medium transition-all duration-300 relative overflow-hidden group text-left ${
                isActive 
                  ? 'border-gray-800 bg-gray-900/50 text-gray-600 cursor-not-allowed'
                  : isSelected 
                    ? 'border-gold bg-gold/10 text-white shadow-[0_0_10px_rgba(244,224,185,0.2)]' 
                    : 'border-white/10 bg-surface/50 text-gray-400 hover:border-gold/30'
              }`}
            >
              <span className="relative z-10">{cat}</span>
              {isActive && <span className="block text-[9px] uppercase tracking-widest mt-1">Active</span>}
              {isSelected && !isActive && (
                <div className="absolute top-2 right-2 text-gold opacity-50">
                   <Check size={12} />
                </div>
              )}
            </button>
          );
        })}

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
                   // Optional: keep it open if focused, or close if empty
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

      <div className="flex gap-4">
          <Button variant="secondary" onClick={() => setScreen('TIMELINE')}>Cancel</Button>
          <Button disabled={selectedCategories.length === 0 && !newCategoryName.trim()} onClick={handleNext}>
            Start Visioning <ArrowRight className="inline ml-2 w-4 h-4" />
          </Button>
      </div>
    </div>
  );

  const renderGoalDefinition = () => {
    const data = formData[currentCategory] || {};
    const placeholder = GOAL_PLACEHOLDERS[currentCategory] || "Define your specific dream...";

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase tracking-widest text-gray-500">Step {flowIndex + 1} of {selectedCategories.length * 2}</span>
        </div>
        
        <h2 className="text-2xl font-serif text-white">Define the Dream</h2>
        <div className="inline-block px-3 py-1 rounded border border-gold/30 bg-gold/10 text-gold text-xs uppercase tracking-widest mb-4">
           {currentCategory}
        </div>

        <p className="text-gray-400 text-sm">Be specific. What exactly do you desire in this area?</p>
        
        <Input 
          label="My Goal" 
          placeholder={placeholder} 
          value={data.title || ''}
          onChange={e => updateFormData('title', e.target.value)}
          autoFocus
        />
        
        <div className="pt-4">
           <label className="block text-sm text-gold/80 font-serif tracking-wide ml-1 mb-2">Manifestation Date</label>
           <input 
             type="date" 
             className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-gold/50 outline-none"
             value={data.targetDate || ''}
             onChange={e => updateFormData('targetDate', e.target.value)}
           />
        </div>

        <div className="flex gap-4 pt-4">
          <Button variant="secondary" onClick={handleBack} disabled={isSubmitting}>Back</Button>
          <Button disabled={!data.title || !data.targetDate || isSubmitting} onClick={handleNext}>
             Define Rituals <ArrowRight className="inline ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderRitualDefinition = () => {
    const data = formData[currentCategory] || {};
    const rituals = data.rituals || [];
    const placeholder = RITUAL_PLACEHOLDERS[currentCategory] || "Define a daily action...";
    const isLastStep = flowIndex === (selectedCategories.length * 2) - 1;

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase tracking-widest text-gray-500">Step {flowIndex + 1} of {selectedCategories.length * 2}</span>
        </div>

        <div className="flex items-center gap-2 text-gold mb-2">
           <Activity className="w-5 h-5" />
           <span className="text-sm font-semibold tracking-widest uppercase">The Bridge: {currentCategory}</span>
        </div>
        
        <p className="text-gray-400 text-sm">
          To achieve <span className="text-gold">{data.title}</span> by <span className="text-gold">{data.targetDate}</span>, 
          what daily rituals must you perform?
        </p>

        <div className="space-y-3">
             <div className="flex gap-2">
                <Input 
                    label="Add Daily Ritual" 
                    placeholder={placeholder}
                    value={currentRitualInput}
                    onChange={e => setCurrentRitualInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addRitualToCurrent()}
                    autoFocus
                    className="flex-1"
                    disabled={isSubmitting}
                />
                <button 
                    onClick={addRitualToCurrent}
                    disabled={!currentRitualInput.trim() || isSubmitting}
                    className="mt-8 p-4 bg-gold/10 border border-gold/30 rounded-xl text-gold hover:bg-gold/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <Plus size={20} />
                </button>
             </div>

             {/* List of Habits */}
             <div className="space-y-2 max-h-[30vh] overflow-y-auto custom-scrollbar pr-1">
                {rituals.map((h, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-surface/50 rounded-lg border border-white/5 animate-fade-in">
                        <span className="text-sm text-gray-200">{h}</span>
                        <button onClick={() => removeRitualFromCurrent(i)} disabled={isSubmitting} className="text-gray-500 hover:text-red-400 p-1">
                            <X size={14} />
                        </button>
                    </div>
                ))}
                {rituals.length === 0 && (
                    <p className="text-xs text-gray-600 text-center italic mt-2">Add at least one daily habit.</p>
                )}
             </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button variant="secondary" onClick={handleBack} disabled={isSubmitting}>Back</Button>
          <Button 
            disabled={(rituals.length === 0 && !currentRitualInput.trim()) || isSubmitting} 
            onClick={handleNext}
            className="flex items-center justify-center gap-2"
          >
             {isSubmitting ? (
                 <>
                   <Loader2 className="animate-spin w-4 h-4" /> Manifesting...
                 </>
             ) : (
                 <>
                    {isLastStep ? "Manifest All" : "Next Category"}
                    {!isLastStep && <ArrowRight className="w-4 h-4" />}
                 </>
             )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-void pt-20 px-6 pb-24">
       <div className="max-w-md mx-auto">
          {/* Progress Bar (Global) */}
          <div className="flex gap-1 mb-8">
             {/* If in definition phase, show segmented progress */}
             {phase === 'DEFINITION' ? (
                Array.from({ length: selectedCategories.length * 2 }).map((_, i) => (
                    <div 
                        key={i} 
                        className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= flowIndex ? 'bg-gold' : 'bg-white/10'}`} 
                    />
                ))
             ) : (
                <div className="h-1 w-full bg-gold/20 rounded-full"><div className="h-full w-1/3 bg-gold rounded-full"></div></div>
             )}
          </div>

          {phase === 'SELECTION' && renderSelection()}
          {phase === 'DEFINITION' && !isRitualStep && renderGoalDefinition()}
          {phase === 'DEFINITION' && isRitualStep && renderRitualDefinition()}
       </div>
    </div>
  );
};