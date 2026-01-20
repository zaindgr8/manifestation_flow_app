import React, { useState, useRef } from 'react';
import { useManifest } from '../context/ManifestContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Camera, Upload, Sparkles, X, Aperture } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { updateUser } = useManifest();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selfie, setSelfie] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setSelfie(url);
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please upload a file instead.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setSelfie(dataUrl);
        stopCamera();
      }
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
            <p className="text-gray-400 font-sans">Capture your essence. We will use this to bridge your reality with your dreams.</p>
            
            {!isCameraOpen ? (
              <div className="flex flex-col gap-4">
                 <div 
                  className="relative w-48 h-48 mx-auto rounded-full border-2 border-dashed border-gold/30 flex items-center justify-center overflow-hidden bg-surface/30 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                >
                  {selfie ? (
                    <img src={selfie} alt="Selfie" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-gold/50">
                      <Camera className="w-8 h-8 mb-2" />
                      <span className="text-xs uppercase tracking-widest">No Image</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                   <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 py-3 bg-surface border border-white/10 rounded-xl hover:bg-surface/80 hover:border-gold/30 transition-all text-sm"
                   >
                      <Upload size={16} /> Upload
                   </button>
                   <button 
                      onClick={startCamera}
                      className="flex items-center justify-center gap-2 py-3 bg-gold/10 border border-gold/30 rounded-xl hover:bg-gold/20 hover:border-gold text-gold transition-all text-sm"
                   >
                      <Aperture size={16} /> Take Photo
                   </button>
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              // Camera View
              <div className="relative w-full max-w-sm mx-auto aspect-square bg-black rounded-2xl overflow-hidden shadow-2xl border border-gold/50">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-6">
                  <button 
                    onClick={stopCamera}
                    className="p-3 bg-red-500/20 text-red-200 rounded-full backdrop-blur-sm border border-red-500/50"
                  >
                    <X size={20} />
                  </button>
                  <button 
                    onClick={takePhoto}
                    className="p-4 bg-white/20 rounded-full backdrop-blur-sm border-2 border-white hover:bg-white/40 transition-all"
                  >
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>
              </div>
            )}

            <Button disabled={!selfie} onClick={finishOnboarding} className="mt-6">
              Enter ManifestFlow
            </Button>
            
            {!isCameraOpen && (
              <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gold transition-colors block mx-auto">
                Back
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};