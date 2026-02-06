import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, ImageBackground } from 'react-native';
import { useManifest } from '../context/ManifestContext';
import { Button } from '../components/Button';
import { generateLifestyleSimulation, generateLifestyleSuggestions } from '../services/geminiService';
import { Wand2, Camera, Upload, Sparkles, Loader2, History, ArrowUpRight, Lightbulb, RefreshCw, ChevronRight } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

export const LifestyleSimulator: React.FC = () => {
  const { user, lifestyleHistory, addToLifestyleHistory, goals, updateUser } = useManifest();
  const [description, setDescription] = useState('');
  const [currentImage, setCurrentImage] = useState<string | null>(user.selfieUrl);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, [user, goals]);

  const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const suggs = await generateLifestyleSuggestions(user, goals);
        setSuggestions(suggs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingSuggestions(false);
      }
  };

  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) { 
      setCurrentImage(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSimulate = async () => {
    if (!currentImage || !description) return;
    // Check Credits
    if ((user.credits?.balance || 0) <= 0) {
        alert("You have run out of Cosmic Credits. Top up to continue shifting realities.");
        return;
    }

    setIsLoading(true);
    setGeneratedResult(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await generateLifestyleSimulation(currentImage, description);
      if (result) {
        setGeneratedResult(result);
        addToLifestyleHistory({ imageUrl: result, prompt: description });
        // Deduct Credit (Optimistic)
        updateUser({
            credits: {
                ...user.credits!,
                balance: (user.credits?.balance || 0) - 1,
                lifetimeUsed: (user.credits?.lifetimeUsed || 0) + 1
            }
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      console.error(e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView 
      className="flex-1 bg-void" 
      contentContainerStyle={{ paddingBottom: 140, paddingTop: 64 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View className="px-6 flex-row items-center gap-4 mb-10">
         <View className="w-14 h-14 bg-surface rounded-[20px] border border-gold/20 items-center justify-center shadow-lg shadow-gold/10">
            <Wand2 size={24} color="#F4E0B9" />
         </View>
         <View>
            <Text className="text-3xl font-black text-white tracking-tighter">Reality Shifter</Text>
            <Text className="text-[12px] text-gold/60 font-bold uppercase tracking-[2px]">Collapse the timeline</Text>
         </View>
      </View>

      <View className="px-6">

      <View className="space-y-8">
        {/* Result Preview with Glassmorphism */}
        {generatedResult && (
           <View className="mb-10 rounded-[24px] overflow-hidden border border-gold/30 shadow-2xl shadow-gold/20">
              <BlurView intensity={40} tint="dark" className="p-6">
                <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-xl font-bold text-white tracking-tight">Your New Timeline</Text>
                  <TouchableOpacity 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setGeneratedResult(null);
                    }}
                    className="bg-white/10 px-4 py-2 rounded-full border border-white/10 active:scale-90"
                  >
                    <Text className="text-gold text-[10px] font-black uppercase tracking-widest">Reset Portal</Text>
                  </TouchableOpacity>
                </View>
                
                <View className="w-full aspect-square rounded-[16px] overflow-hidden mb-6 border border-white/10">
                  <Image source={{ uri: generatedResult }} className="w-full h-full" />
                </View>
                
                <View className="bg-black/60 p-5 rounded-[16px] border border-white/10">
                  <Text className="text-[10px] text-gold/80 font-bold uppercase tracking-[2px] mb-2">Manifested Intent</Text>
                  <Text className="text-sm text-gray-200 font-bold italic leading-5">"{description}"</Text>
                </View>
              </BlurView>
           </View>
        )}

        {/* Input Controls */}
        <View className={generatedResult ? 'opacity-40 scale-95' : 'opacity-100'}>
            {/* Identity Anchor Section */}
            <View className="mb-10 overflow-hidden rounded-[24px] border border-white/5 bg-surface/20 shadow-xl">
                <View className="p-6">
                  <View className="flex-row justify-between items-center mb-6">
                      <View className="flex-row items-center gap-2">
                        <View className="w-1.5 h-1.5 rounded-full bg-gold shadow-lg shadow-gold/40" />
                        <Text className="text-[10px] text-gold font-bold uppercase tracking-[2px]">Identity Anchor</Text>
                      </View>
                      <TouchableOpacity 
                        onPress={pickImage} 
                        className="bg-white/10 px-4 py-2 rounded-[12px] border border-white/10 active:scale-95 transition-all"
                      >
                        <Upload size={14} color="#F4E0B9" />
                      </TouchableOpacity>
                  </View>
  
                  <View className="flex-row items-center gap-6">
                      <View className="w-24 h-24 rounded-[16px] overflow-hidden border-2 border-gold/20 shadow-lg shadow-gold/10 bg-void/50 items-center justify-center">
                        {currentImage ? (
                          <Image source={{ uri: currentImage }} className="w-full h-full" />
                        ) : (
                          <Camera size={32} color="#F4E0B9" opacity={0.3} />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-[13px] text-gray-400 font-semibold leading-5">
                          We use this image to project your quantum identity into the target timeline.
                        </Text>
                      </View>
                  </View>
                </View>
            </View>
  
            {/* Reality Description Section */}
            <View className="mb-10">
                <View className="px-1 flex-row items-center gap-2 mb-4">
                  <View className="w-1.5 h-1.5 rounded-full bg-gold shadow-lg shadow-gold/40" />
                  <Text className="text-[10px] text-gold font-bold uppercase tracking-[2px]">Describe Your Reality</Text>
                </View>
  
                <View className="bg-surface/30 border border-white/10 rounded-[24px] p-6 mb-6 shadow-inner">
                  <TextInput 
                    multiline 
                    numberOfLines={4} 
                    className="w-full h-32 text-white font-bold text-lg text-left leading-7" 
                    placeholder="e.g. Sitting on the deck of a yacht in the Mediterranean..." 
                    placeholderTextColor="#ffffff22" 
                    value={description} 
                    onChangeText={setDescription}
                    selectionColor="#F4E0B9"
                  />
                  
                  <View className="mt-6 pt-6 border-t border-white/5 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Lightbulb size={16} color="#F4E0B9" />
                        <Text className="text-[10px] text-gold-bright font-bold uppercase tracking-[2px]">Quantum Suggestions</Text>
                      </View>
                      <TouchableOpacity 
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          fetchSuggestions();
                        }}
                        disabled={loadingSuggestions}
                        className="p-2 active:rotate-180 transition-transform"
                      >
                        {loadingSuggestions ? (
                          <ActivityIndicator size="small" color="#F4E0B9" />
                        ) : (
                          <RefreshCw size={14} color="#6B7280" />
                        )}
                      </TouchableOpacity>
                  </View>
                </View>
  
                {/* Suggestions Pills */}
                <View className="flex-row flex-wrap gap-2.5 mb-8">
                    {suggestions.map((s, i) => (
                      <TouchableOpacity 
                        key={i} 
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setDescription(s);
                        }} 
                        className="bg-white/5 border border-white/10 px-4 py-3 rounded-[14px] active:scale-95 transition-all"
                      >
                        <Text className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">{s}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
            </View>
  
            <Button 
              disabled={!currentImage || !description || isLoading} 
              onPress={handleSimulate}
              loading={isLoading}
            >
                Visualize Reality
            </Button>
        </View>
  
        {/* History Section */}
        {lifestyleHistory.length > 0 && (
            <View className="mt-12 pt-12 border-t border-white/5">
                <View className="flex-row items-center justify-between mb-8 px-1">
                  <View className="flex-row items-center gap-3">
                    <History size={18} color="#9CA3AF" />
                    <Text className="text-[12px] font-black text-gray-300 uppercase tracking-[2px]">Previous Shifts</Text>
                  </View>
                  <Text className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{lifestyleHistory.length} ENTRIES</Text>
                </View>
  
                <View className="flex-row flex-wrap justify-between gap-y-4">
                    {lifestyleHistory.map(shift => (
                        <TouchableOpacity 
                          key={shift.id} 
                          onPress={() => { 
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setGeneratedResult(shift.imageUrl); 
                            setDescription(shift.prompt); 
                          }} 
                          className="w-[48%] aspect-square rounded-[24px] overflow-hidden border border-white/10 active:scale-95 transition-transform shadow-xl"
                        >
                            <Image source={{ uri: shift.imageUrl }} className="w-full h-full" />
                            <BlurView intensity={20} tint="dark" className="absolute bottom-0 left-0 right-0 p-3">
                               <Text className="text-[10px] text-white font-bold tracking-tight" numberOfLines={1}>{shift.prompt}</Text>
                            </BlurView>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        )}
      </View>
      </View>
    </ScrollView>
  );
};