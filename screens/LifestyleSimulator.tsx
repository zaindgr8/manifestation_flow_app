import React, { useState, useRef } from 'react';
import { useManifest } from '../context/ManifestContext';
import { Button } from '../components/Button';
import { generateLifestyleSimulation } from '../services/geminiService';
import { Wand2, Camera, Upload, Sparkles, Loader2, History, ArrowUpRight } from 'lucide-react';

export const LifestyleSimulator: React.FC = () => {
  const { user, lifestyleHistory, addToLifestyleHistory } = useManifest();
  const [description, setDescription] = useState('');
  const [currentImage, setCurrentImage] = useState<string | null>(user.selfieUrl);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setCurrentImage(url);
    }
  };

  const handleSimulate = async () => {
    if (!currentImage || !description) return;

    setIsLoading(true);
    setGeneratedResult(null);

    try {
      const result = await generateLifestyleSimulation(currentImage, description);
      if (result) {
        setGeneratedResult(result);
        addToLifestyleHistory({
          imageUrl: result,
          prompt: description
        });
        setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (e) {
      console.error(e);
      alert("The universe encountered a glitch. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistorySelect = (item: { imageUrl: string, prompt: string }) => {
    setGeneratedResult(item.imageUrl);
    setDescription(item.prompt);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div ref={topRef} className="min-h-screen bg-void pb-24 px-6 pt-16 overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-3 mb-6">
         <div className="p-2 bg-surface rounded-full border border-gold/20">
            <Wand2 className="text-gold w-6 h-6" />
         </div>
         <div>
            <h1 className="text-2xl font-serif text-white">Reality Shifter</h1>
            <p className="text-xs text-gray-400">Collapse the timeline.</p>
         </div>
      </div>

      <div className="space-y-8 animate-fade-in">
        
        {/* Result Area - Shows only when result exists */}
        {generatedResult && (
           <div className="space-y-4 animate-fade-in bg-gradient-to-b from-surface/80 to-transparent p-4 rounded-3xl border border-gold/20">
              <h3 className="text-xl font-serif text-white text-center">Your New Timeline</h3>
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(244,224,185,0.15)]">
                 <img src={generatedResult} alt="Manifestation" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-midnight/50 to-transparent pointer-events-none"></div>
              </div>
              <p className="text-center text-xs text-gray-400 font-sans italic">
                 "{description}"
              </p>
              <div className="flex justify-center">
                 <button 
                   onClick={() => setGeneratedResult(null)}
                   className="text-gold text-xs uppercase tracking-widest border-b border-gold/50 pb-0.5 hover:text-white transition-colors"
                 >
                   Create Another
                 </button>
              </div>
           </div>
        )}

        {/* Input Section - Hidden if result is shown to focus on result, or show below */}
        <div className={`space-y-8 transition-opacity duration-500 ${generatedResult ? 'opacity-50 hover:opacity-100' : 'opacity-100'}`}>
            
            {/* Identity Section */}
            <div className="bg-surface/30 p-4 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-4">
                <label className="text-sm text-gold/80 font-serif tracking-wide">Identity Anchor</label>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                >
                    <Upload size={12} /> Change Photo
                </button>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-white/10 relative group">
                    {currentImage ? (
                    <img src={currentImage} alt="Reference" className="w-full h-full object-cover" />
                    ) : (
                    <div className="w-full h-full bg-black flex items-center justify-center">
                        <Camera className="text-gray-600" />
                    </div>
                    )}
                </div>
                <p className="text-xs text-gray-500 flex-1">
                    We use this image to project your quantum identity into the new reality.
                </p>
            </div>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
            />
            </div>

            {/* Prompt Section */}
            <div className="space-y-4">
            <label className="block text-sm text-gold/80 font-serif tracking-wide">Describe The Reality</label>
            <textarea 
                className="w-full h-32 bg-surface/50 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all resize-none"
                placeholder="e.g., Sitting on the deck of a yacht in the Mediterranean at sunset, wearing a white linen suit, holding a glass of champagne..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
            
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-2">
                {['Luxury Penthouse', 'Driving Supercar', 'Tropical Villa', 'Red Carpet Event'].map(tag => (
                    <button 
                    key={tag}
                    onClick={() => setDescription(prev => prev ? `${prev}, ${tag}` : tag)}
                    className="text-[10px] uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1 rounded-full text-gray-400 transition-colors"
                    >
                    {tag}
                    </button>
                ))}
            </div>
            </div>

            <Button 
                disabled={!currentImage || !description || isLoading} 
                onClick={handleSimulate}
                className="relative overflow-hidden group"
            >
            {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" /> Shifting Reality...
                </div>
            ) : (
                <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" /> Visualize Reality
                </div>
            )}
            </Button>
        </div>

        {/* History Section */}
        {lifestyleHistory.length > 0 && (
            <div className="pt-8 border-t border-white/5">
                <h3 className="text-sm font-serif text-gray-400 mb-4 flex items-center gap-2">
                    <History size={14} /> Previous Shifts
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    {lifestyleHistory.map(shift => (
                        <button 
                            key={shift.id}
                            onClick={() => handleHistorySelect(shift)}
                            className="group relative aspect-square rounded-xl overflow-hidden border border-white/5 hover:border-gold/50 transition-all"
                        >
                            <img src={shift.imageUrl} alt="Past shift" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ArrowUpRight className="text-white w-6 h-6" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};