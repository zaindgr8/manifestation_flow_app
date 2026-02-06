import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Sparkles, AlertCircle } from 'lucide-react-native';
import { useManifest } from '../context/ManifestContext';
import { Svg, Path } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { enableGuestMode } = useManifest();

  const [request, response, promptAsync] = Google.useAuthRequest({
    // Use environment variables for client IDs to make it easier to switch between local and production
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '50846238672-1skmjgl5lp2r9u10i9vnqumvdpcd6mc2.apps.googleusercontent.com',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '50846238672-1skmjgl5lp2r9u10i9vnqumvdpcd6mc2.apps.googleusercontent.com',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '50846238672-1skmjgl5lp2r9u10i9vnqumvdpcd6mc2.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      setLoading(true);
      signInWithCredential(auth, credential)
        .then(() => {
           Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        })
        .catch((err) => {
           console.error("Google Auth Error", err);
           setError("Google Sign-In failed.");
           Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        })
        .finally(() => setLoading(false));
    }
  }, [response]);

  const handleEmailAuth = async () => {
    if (!email || !password) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!auth) {
        setError("Firebase not configured. Please add API keys or continue as guest.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.error(err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      let msg = "Authentication failed.";
      if (err.code === 'auth/invalid-credential') msg = "Invalid email or password.";
      if (err.code === 'auth/email-already-in-use') msg = "Email already exists.";
      if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
      if (err.code === 'auth/operation-not-allowed') msg = "Email/Password sign-in is disabled in Firebase Console.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-void"
    >
        <ScrollView 
            contentContainerStyle={{ flexGrow: 1 }} 
            className="px-6"
            showsVerticalScrollIndicator={false}
        >
            <View className="flex-1 items-center justify-center py-20">
                <View className="items-center mb-12">
                    <View className="w-20 h-20 rounded-[28px] bg-surface border border-gold/20 items-center justify-center shadow-2xl shadow-gold/20 mb-6 overflow-hidden">
                        <BlurView intensity={30} tint="dark" className="w-full h-full items-center justify-center">
                            <Sparkles size={38} color="#F4E0B9" />
                        </BlurView>
                    </View>
                    <Text className="text-4xl font-black text-white text-center tracking-tighter">ManifestFlow</Text>
                    <Text className="text-[12px] text-gold/60 font-bold uppercase tracking-[4px] mt-2 text-center">Align with your reality</Text>
                </View>

                <View className="w-full overflow-hidden rounded-[32px] border border-white/10 shadow-3xl bg-surface/10">
                    <BlurView intensity={20} tint="dark" className="p-8">
                        <View className="flex-row gap-2 mb-10 bg-void/50 p-1.5 rounded-[16px] border border-white/10">
                            <TouchableOpacity 
                                onPress={() => { 
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setIsLogin(true); 
                                    setError(null); 
                                }}
                                className={`flex-1 py-3.5 items-center rounded-[12px] ${isLogin ? 'bg-gold shadow-lg shadow-gold/20' : 'bg-transparent'}`}
                            >
                                <Text className={`text-[11px] font-black uppercase tracking-widest ${isLogin ? 'text-void' : 'text-gray-500'}`}>Login</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => { 
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setIsLogin(false); 
                                    setError(null); 
                                }}
                                className={`flex-1 py-3.5 items-center rounded-[12px] ${!isLogin ? 'bg-gold shadow-lg shadow-gold/20' : 'bg-transparent'}`}
                            >
                                <Text className={`text-[11px] font-black uppercase tracking-widest ${!isLogin ? 'text-void' : 'text-gray-500'}`}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="gap-6">
                            <Input 
                                label="Quantum Email" 
                                keyboardType="email-address"
                                value={email} 
                                onChangeText={setEmail}
                                placeholder="you@universe.com"
                                autoCapitalize="none"
                            />
                            <Input 
                                label="Access Key" 
                                secureTextEntry
                                value={password} 
                                onChangeText={setPassword}
                                placeholder="••••••••"
                            />

                            {error && (
                                <View className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex-row items-center gap-3">
                                    <AlertCircle size={16} color="#ef4444" />
                                    <Text className="text-xs text-red-200 font-medium flex-1 leading-tight">{error}</Text>
                                </View>
                            )}

                            <View className="mt-4">
                                <Button 
                                    loading={loading} 
                                    onPress={handleEmailAuth} 
                                >
                                    {isLogin ? 'Enter Portal' : 'Begin Journey'}
                                </Button>
                            </View>
                        </View>

                        <View className="flex-row items-center my-10">
                            <View className="flex-1 h-[1px] bg-white/10" />
                            <Text className="mx-6 text-[10px] text-gray-600 font-bold uppercase tracking-[4px]">or</Text>
                            <View className="flex-1 h-[1px] bg-white/10" />
                        </View>

                        <Button
                            disabled={loading || !request}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                promptAsync();
                            }}
                            variant="google"
                        >
                            <View className="flex-row items-center justify-center gap-3">
                                <Svg width="18" height="18" viewBox="0 0 24 24">
                                    <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </Svg>
                                <Text className="text-black font-black text-[12px] uppercase tracking-widest">Continue with Google</Text>
                            </View>
                        </Button>

                        <TouchableOpacity 
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                enableGuestMode();
                            }}
                            className="mt-8 pt-8 border-t border-white/5 items-center"
                        >
                            <Text className="text-[12px] text-gold/80 font-bold uppercase tracking-[4px]">Entry as Seeker Only</Text>
                        </TouchableOpacity>
                    </BlurView>
                </View>
                
                <Text className="text-center text-[11px] text-gray-600 font-bold uppercase tracking-[2px] mt-12 leading-5">
                    By entering, you agree to align with{"\n"}your highest self.
                </Text>
            </View>
        </ScrollView>
    </KeyboardAvoidingView>
  );
};
