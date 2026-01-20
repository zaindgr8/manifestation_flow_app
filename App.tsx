import React from 'react';
import { ManifestProvider, useManifest } from './context/ManifestContext';
import { Onboarding } from './screens/Onboarding';
import { VisionWizard } from './screens/VisionWizard';
import { Timeline } from './screens/Timeline';
import { DailyAligner } from './screens/DailyAligner';
import { LifestyleSimulator } from './screens/LifestyleSimulator';
import { LayoutDashboard, Calendar, Wand2 } from 'lucide-react';

const AppContent = () => {
  const { currentScreen, setScreen, user } = useManifest();

  // Navigation Logic
  const renderScreen = () => {
    switch (currentScreen) {
      case 'ONBOARDING': return <Onboarding />;
      case 'WIZARD': return <VisionWizard />;
      case 'TIMELINE': return <Timeline />;
      case 'ALIGNER': return <DailyAligner />;
      case 'SIMULATOR': return <LifestyleSimulator />;
      default: return <Onboarding />;
    }
  };

  // Bottom Tab Bar (Only show if onboarded)
  const ShowTabBar = user.isOnboarded && currentScreen !== 'ONBOARDING' && currentScreen !== 'WIZARD';

  return (
    <div className="text-white font-sans max-w-md mx-auto relative min-h-screen bg-void shadow-2xl overflow-hidden">
      {/* Main Content Area */}
      {renderScreen()}

      {/* Floating Bottom Navigation */}
      {ShowTabBar && (
        <div className="fixed bottom-6 left-0 right-0 z-50 px-6 max-w-md mx-auto">
          <div className="bg-surface/90 backdrop-blur-xl border border-white/10 rounded-full h-16 flex items-center justify-around shadow-2xl shadow-black/50 px-2">
            
            <button 
              onClick={() => setScreen('TIMELINE')}
              className={`flex flex-col items-center justify-center w-14 h-full transition-colors ${currentScreen === 'TIMELINE' ? 'text-gold' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Calendar size={20} className={currentScreen === 'TIMELINE' ? 'drop-shadow-[0_0_8px_rgba(244,224,185,0.5)]' : ''} />
              <span className="text-[9px] uppercase tracking-widest mt-1">Vision</span>
            </button>

             <button 
              onClick={() => setScreen('SIMULATOR')}
              className={`flex flex-col items-center justify-center w-14 h-full transition-colors ${currentScreen === 'SIMULATOR' ? 'text-gold' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Wand2 size={20} className={currentScreen === 'SIMULATOR' ? 'drop-shadow-[0_0_8px_rgba(244,224,185,0.5)]' : ''} />
              <span className="text-[9px] uppercase tracking-widest mt-1">Shift</span>
            </button>

            {/* Middle Action Button (Add) */}
            <button 
              onClick={() => setScreen('WIZARD')}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-gold to-gold-dim flex items-center justify-center shadow-[0_0_15px_rgba(244,224,185,0.4)] -mt-8 border-4 border-void active:scale-95 transition-transform"
            >
               <span className="text-3xl text-void font-light pb-1">+</span>
            </button>

            <button 
              onClick={() => setScreen('ALIGNER')}
              className={`flex flex-col items-center justify-center w-14 h-full transition-colors ${currentScreen === 'ALIGNER' ? 'text-gold' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <LayoutDashboard size={20} className={currentScreen === 'ALIGNER' ? 'drop-shadow-[0_0_8px_rgba(244,224,185,0.5)]' : ''} />
              <span className="text-[9px] uppercase tracking-widest mt-1">Align</span>
            </button>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ManifestProvider>
      <AppContent />
    </ManifestProvider>
  );
}