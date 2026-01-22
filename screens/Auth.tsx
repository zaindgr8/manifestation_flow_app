
import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Sparkles, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useManifest } from '../context/ManifestContext';

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { isGuestMode, enableGuestMode } = useManifest();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (!auth) {
        setError("Firebase not configured. Please add API keys or continue as guest.");
        return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      let msg = "Authentication failed.";
      if (err.code === 'auth/invalid-credential') msg = "Invalid email or password.";
      if (err.code === 'auth/email-already-in-use') msg = "Email already exists.";
      if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) {
        setError("Firebase not configured. Please add API keys.");
        return;
    }
    setLoading(true);
    setError(null);

    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        // The onAuthStateChanged listener in ManifestContext will handle the redirect/state update
    } catch (err: any) {
        console.error("Google Auth Error:", err);
        setError(err.message || "Google authentication failed.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-void relative overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-gold/5 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] left-[-20%] w-[80%] h-[80%] bg-midnight rounded-full blur-[100px]"></div>

        <div className="w-full max-w-sm z-10 space-y-8 animate-fade-in">
            <div className="text-center space-y-2">
                <div className="inline-block p-3 rounded-full bg-surface border border-gold/20 mb-4 shadow-[0_0_20px_rgba(244,224,185,0.1)]">
                    <Sparkles className="w-8 h-8 text-gold" />
                </div>
                <h1 className="text-3xl font-serif text-white">ManifestFlow</h1>
                <p className="text-gray-400 text-sm">Align your digital reality.</p>
            </div>

            <div className="bg-surface/50 backdrop-blur-md p-8 rounded-3xl border border-white/5 shadow-2xl">
                <div className="flex gap-4 mb-8 border-b border-white/5 pb-1">
                    <button 
                        onClick={() => { setIsLogin(true); setError(null); }}
                        className={`flex-1 pb-2 text-sm font-medium transition-colors ${isLogin ? 'text-gold border-b-2 border-gold' : 'text-gray-500 hover:text-white'}`}
                    >
                        Login
                    </button>
                    <button 
                        onClick={() => { setIsLogin(false); setError(null); }}
                        className={`flex-1 pb-2 text-sm font-medium transition-colors ${!isLogin ? 'text-gold border-b-2 border-gold' : 'text-gray-500 hover:text-white'}`}
                    >
                        Sign Up
                    </button>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                    <Input 
                        label="Email" 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@universe.com"
                        required
                    />
                    <Input 
                        label="Password" 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-xs text-red-200">
                            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <Button type="submit" disabled={loading} className="mt-4">
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="animate-spin w-4 h-4" /> Processing...
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                {isLogin ? 'Enter Portal' : 'Begin Journey'} <ArrowRight className="w-4 h-4" />
                            </div>
                        )}
                    </Button>
                </form>

                <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-500 text-xs">OR</span>
                    <div className="flex-grow border-t border-white/10"></div>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-white text-black rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                </button>

                {!auth && (
                   <div className="mt-4 pt-4 border-t border-white/5 text-center">
                       <p className="text-xs text-gray-500 mb-2">Development Mode</p>
                       <button onClick={enableGuestMode} className="text-xs text-gold hover:underline">
                           Continue as Guest (No Cloud Save)
                       </button>
                   </div>
                )}
            </div>
            
            <p className="text-center text-xs text-gray-500">
                By entering, you agree to align with your highest self.
            </p>
        </div>
    </div>
  );
};
