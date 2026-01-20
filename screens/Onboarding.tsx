import React, { useState, useRef } from 'react';
import { useManifest } from '../context/ManifestContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Camera, Upload, Sparkles } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { updateUser } = useManifest();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selfie, setSelfie] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setSelfie(url);
    }
  };

  const finishOnboarding = () => {
    updateUser({ name, selfieUrl: selfie, isOnboarded: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-fade-in relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-midnight to-void -z-10"></div>
      <div className="absolute top-10 right-10 w-64 h-64 bg-gold/5 rounded-full blur-[100px] animate-pulse-slow"></div>

      <div className="max-w-md w-full space-y-8 z-10">
        <div className="flex justify-center mb-6">
          <Sparkles className="w-12 h-12 text-gold animate-float" />
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-4xl font-serif text-white">Who is manifesting?</h1>
            <p className="text-gray-400 font-sans">Enter your name to begin the shift.</p>
            <Input 
              placeholder="Your Name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <Button disabled={!name} onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-3xl font-serif text-white">The Identity Shift</h1>
            <p className="text-gray-400 font-sans">Upload a photo of yourself. We will use this to bridge your reality with your dreams.</p>
            
            <div 
              className="relative w-48 h-48 mx-auto rounded-full border-2 border-dashed border-gold/30 flex items-center justify-center overflow-hidden bg-surface/30 cursor-pointer hover:border-gold/60 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {selfie ? (
                <img src={selfie} alt="Selfie" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-gold/50">
                  <Camera className="w-8 h-8 mb-2" />
                  <span className="text-xs uppercase tracking-widest">Upload</span>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            <Button disabled={!selfie} onClick={finishOnboarding}>
              Enter ManifestFlow
            </Button>
            <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gold transition-colors">
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};