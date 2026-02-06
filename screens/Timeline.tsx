import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, ActivityIndicator, Platform } from 'react-native';
import { useManifest } from '../context/ManifestContext';
import { Plus, RefreshCw, Upload, X, Camera, Sparkles, ChevronRight } from 'lucide-react-native';
import { Button } from '../components/Button';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Svg, Circle } from 'react-native-svg';


import { BlurView } from 'expo-blur';

export const Timeline: React.FC = () => {
  const { goals, user, setScreen, regenerateGoalImage, personalizeGoalImage } = useManifest();
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleRegenerateImage = (goalId: string) => { 
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    regenerateGoalImage(goalId); 
  };

  const handleFeelItClick = (goalId: string) => {
    setActiveGoalId(goalId);
    setModalOpen(true);
    setIsGenerating(false);
  };

  const handlePersonalize = async (useExisting: boolean) => {
    if (!activeGoalId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    let imageUrl = user.selfieUrl;

    if (!useExisting) {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (result.canceled || !result.assets[0].uri) return;
        imageUrl = result.assets[0].uri;
    }

    if (!imageUrl) return;

    setIsGenerating(true);
    try {
        await personalizeGoalImage(activeGoalId, imageUrl);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setModalOpen(false);
    } catch (e) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
        setIsGenerating(false);
    }
  };

  const EmptyState = () => (
    <View className="flex-1 items-center justify-center pt-32">
      <BlurView intensity={20} tint="dark" className="w-24 h-24 rounded-full items-center justify-center border border-white/10 mb-6 overflow-hidden">
        <Sparkles color="#F4E0B9" size={32} />
      </BlurView>
      <Text className="text-2xl font-black text-white tracking-tight">The Void Awaits</Text>
      <Text className="text-gray-400 text-sm max-w-[260px] text-center mt-3 leading-6 font-medium">
        Your future is unwritten. Begin your journey by creating your first vision.
      </Text>
      <TouchableOpacity 
        onPress={() => setScreen('WIZARD')} 
        className="mt-8 px-10 py-4 bg-gold rounded-[16px] shadow-lg shadow-gold/20 active:scale-95"
      >
        <Text className="text-void font-black uppercase tracking-[2px] text-[11px]">Create Your Vision</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView 
      className="flex-1 bg-void" 
      contentContainerStyle={{ paddingBottom: 140, paddingTop: 64 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-6 mb-10">
        <View className="flex-row justify-between items-end">
          <View>
             <Text className="text-[12px] text-gold font-bold uppercase tracking-[3px] mb-2">Reality Log</Text>
             <Text className="text-4xl font-black text-white tracking-tighter">Timeline</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setScreen('WIZARD')} 
            className="bg-surface/50 w-12 h-12 rounded-[16px] border border-white/10 items-center justify-center active:scale-95 transition-transform"
          >
            <Plus color="#F4E0B9" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-6">
        <View className="flex-1">
          {goals.length > 0 && <View className="absolute left-[20px] top-6 bottom-0 w-[2px] bg-white/5" />}
          {goals.length === 0 ? <EmptyState /> : goals.map((goal) => (
            <View key={goal.id} className="relative pl-14 mb-10">
               {/* Time Indicator */}
               <View className="absolute left-0 top-1 w-10 h-10 items-center justify-center z-20">
                  <BlurView intensity={40} tint="dark" className="absolute inset-0 rounded-[12px] border border-gold/20 overflow-hidden" />
                  <Text className="text-[10px] text-gold font-bold uppercase">{new Date(goal.targetDate).toLocaleString('default', { month: 'short' })}</Text>
                  <Text className="text-[8px] text-gold/40 font-bold">{new Date(goal.targetDate).getFullYear()}</Text>
               </View>

               {/* Card */}
               <View className="bg-surface/40 rounded-[24px] overflow-hidden border border-white/5 shadow-2xl">
                  <View className="relative h-56 w-full bg-midnight">
                    {goal.imageUrl ? (
                      <Image 
                        source={{ uri: goal.imageUrl }} 
                        className="w-full h-full" 
                        resizeMode="cover" 
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center bg-void/50">
                        <BlurView intensity={20} tint="dark" className="items-center justify-center p-6 rounded-2xl border border-white/5">
                          <ActivityIndicator size="small" color="#F4E0B9" className="mb-4" />
                          <Text className="text-[10px] text-gold/60 font-black uppercase tracking-[3px]">Manifesting Reality...</Text>
                        </BlurView>
                      </View>
                    )}
                    <View className="absolute inset-0 bg-black/20" />
                    
                    {goal.imageUrl && (
                      <BlurView intensity={30} tint="dark" className="absolute top-4 right-4 rounded-full overflow-hidden border border-white/10">
                        <TouchableOpacity 
                          onPress={() => handleRegenerateImage(goal.id)}
                          className="p-2.5"
                        >
                          {goal.isRegeneratingImage ? <ActivityIndicator size="small" color="#F4E0B9" /> : <RefreshCw size={14} color="#ffffff" />}
                        </TouchableOpacity>
                      </BlurView>
                    )}
                    
                    {user.selfieUrl && (
                      <View className="absolute bottom-4 left-4 flex-row items-center gap-3">
                         <View className="w-10 h-10 rounded-full border-2 border-gold/40 shadow-lg overflow-hidden">
                           <Image source={{ uri: user.selfieUrl }} className="w-full h-full" />
                         </View>
                         <BlurView intensity={20} tint="dark" className="px-3 py-1.5 rounded-full border border-white/10 overflow-hidden">
                            <Text className="text-[9px] text-white/80 font-bold uppercase tracking-widest leading-none">Quantum Identity Locked</Text>
                         </BlurView>
                      </View>
                    )}
                  </View>

                  <View className="p-6">
                    <View className="flex-row flex-wrap gap-2 mb-4">
                      {goal.categories.map(cat => (
                        <View key={cat} className="bg-gold/10 border border-gold/20 px-3 py-1.5 rounded-[8px]">
                          <Text className="text-[10px] font-bold uppercase tracking-wider text-gold-bright">{cat}</Text>
                        </View>
                      ))}
                    </View>
                    <Text className="text-2xl font-black text-white mb-6 tracking-tight leading-8">{goal.title}</Text>
                    <Button variant="secondary" onPress={() => handleFeelItClick(goal.id)}>
                      <View className="flex-row items-center gap-2">
                        <Sparkles size={14} color="#F4E0B9" />
                        <Text className="text-gold text-xs font-bold uppercase tracking-[1.5px]">Experience Now</Text>
                      </View>
                    </Button>
                  </View>
               </View>
            </View>
          ))}
        </View>
      </View>

      <Modal visible={modalOpen} animationType="fade" transparent={true} statusBarTranslucent>
        <BlurView intensity={80} tint="dark" className="flex-1">
          <View className="flex-1 justify-center items-center p-8">
              <TouchableOpacity 
                onPress={() => { setModalOpen(false); setIsGenerating(false); }} 
                className="absolute top-16 right-8 w-10 h-10 items-center justify-center bg-white/10 rounded-full"
              >
                <X size={20} color="#fff" />
              </TouchableOpacity>

              <View className="items-center w-full">
                  {!isGenerating ? (
                    <>
                      <View className="w-20 h-20 rounded-3xl bg-gold/10 border border-gold/30 items-center justify-center mb-8">
                         <Sparkles size={32} color="#F4E0B9" />
                      </View>
                      <Text className="text-4xl font-black text-white text-center mb-3 tracking-tighter">See Your Future</Text>
                      <Text className="text-gray-400 text-base text-center mb-12 leading-6">
                        We'll use AI to project your identity into this vision. Choose the anchor image for your shift.
                      </Text>
                      
                      <View className="w-full gap-4">
                        {user.selfieUrl && (
                          <TouchableOpacity 
                            onPress={() => handlePersonalize(true)}
                            className="bg-surface/60 border border-white/10 p-5 rounded-[24px] flex-row items-center gap-4 active:scale-95 transition-transform"
                          >
                            <View className="w-14 h-14 rounded-full border-2 border-gold/40 shadow-lg overflow-hidden">
                              <Image source={{ uri: user.selfieUrl }} className="w-full h-full" />
                            </View>
                            <View className="flex-1">
                              <Text className="text-white font-bold text-base tracking-tight">Use Current Identity</Text>
                              <Text className="text-gray-400 text-xs mt-1">Quickest way to visualize success</Text>
                            </View>
                            <ChevronRight size={20} color="#F4E0B9" />
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity 
                          onPress={() => handlePersonalize(false)}
                          className="bg-gold/5 border border-gold/20 p-5 rounded-[24px] flex-row items-center gap-4 active:scale-95 transition-transform"
                        >
                          <View className="w-14 h-14 rounded-[16px] bg-gold/10 items-center justify-center border border-gold/20">
                            <Upload size={24} color="#F4E0B9" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-gold font-bold text-base tracking-tight">Upload New Essence</Text>
                            <Text className="text-gold/60 text-xs mt-1">Pick a photo that captures your resonance</Text>
                          </View>
                          <ChevronRight size={20} color="#F4E0B9" />
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <View className="items-center">
                        <View className="w-32 h-32 rounded-full border-4 border-gold items-center justify-center overflow-hidden bg-surface/30 shadow-2xl shadow-gold/40 mb-10">
                           {user.selfieUrl && <Image source={{ uri: user.selfieUrl }} className="w-full h-full opacity-50" />}
                           <View className="absolute inset-0 items-center justify-center">
                              <ActivityIndicator size="large" color="#F4E0B9" />
                           </View>
                        </View>
                        <Text className="text-2xl font-black text-white text-center mb-4 tracking-tight">Collapsing Timelines...</Text>
                        <Text className="text-gray-400 text-center px-8 leading-6">
                           Our AI is manifesting your presence within this goal. Please hold your intention.
                        </Text>
                    </View>
                  )}
              </View>
          </View>
        </BlurView>
      </Modal>
    </ScrollView>
  );
};