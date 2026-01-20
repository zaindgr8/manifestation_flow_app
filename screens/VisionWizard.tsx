import React, { useState } from 'react';
import { useManifest } from '../context/ManifestContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ArrowRight, Star, Calendar, Activity } from 'lucide-react';
import { VisionGoal } from '../types';

export const VisionWizard: React.FC = () => {
  const { addGoalAndRitual, setScreen, goals } = useManifest();
  const [step, setStep] = useState(1);
  
  const [category, setCategory] = useState<VisionGoal['category']>('Wealth');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [habit, setHabit] = useState('');

  const categories: VisionGoal['category'][] = ['Car', 'Home', 'Wealth', 'Relationship', 'Health', 'Other'];

  const handleSubmit = () => {
    addGoalAndRitual(
      { category, title, targetDate: date },
      habit
    );
    // If it's the first goal, go to timeline, else go back to where they were (usually aligner or timeline)
    setScreen('TIMELINE');
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-serif text-gold">Select an Area</h2>
            <div className="grid grid-cols-2 gap-4">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`p-4 rounded-xl border transition-all duration-300 ${
                    category === cat 
                    ? 'border-gold bg-gold/10 text-white shadow-[0_0_10px_rgba(244,224,185,0.2)]' 
                    : 'border-white/10 bg-surface/50 text-gray-400 hover:border-gold/30'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <Button onClick={() => setStep(2)}>Next <ArrowRight className="inline ml-2 w-4 h-4" /></Button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-serif text-gold">Define the Dream</h2>
            <p className="text-gray-400 text-sm">Be specific. What exactly do you desire?</p>
            <Input 
              label="My Goal" 
              placeholder="e.g., $50k/month or Porsche 911" 
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
              <span className="text-sm font-semibold tracking-widest uppercase">The Bridge</span>
            </div>
            <h2 className="text-2xl font-serif text-white">Reverse Engineer</h2>
            <p className="text-gray-400">
              To have <span className="text-gold">{title}</span> by <span className="text-gold">{date}</span>, 
              what is the ONE daily habit you must commit to?
            </p>
            <Input 
              label="Daily Ritual" 
              placeholder="e.g., Call 10 new clients" 
              value={habit}
              onChange={e => setHabit(e.target.value)}
              autoFocus
            />
             <div className="flex gap-4">
              <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
              <Button disabled={!habit} onClick={handleSubmit}>Manifest It</Button>
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