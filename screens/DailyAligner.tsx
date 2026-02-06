import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, TextInput, ActivityIndicator, Platform } from 'react-native';
import { useManifest } from '../context/ManifestContext';
import { Check, RefreshCw, Settings, Bell, Sun, Moon, X, Flame, CheckCircle2, Plus, Edit2, Trash2, Save, Heart, Sparkles, Maximize2, LayoutDashboard } from 'lucide-react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import DateTimePicker from '@react-native-community/datetimepicker';

export const DailyAligner: React.FC = () => {
  const { user, rituals, affirmation, toggleRitual, refreshAffirmation, updateUser, acknowledgeAffirmation, addRitual, deleteRitual, gratitudeEntries, addGratitude, loadingAffirmation } = useManifest();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newRitualTitle, setNewRitualTitle] = useState('');
  const [gratitudeInput, setGratitudeInput] = useState('');
  const [morningTime, setMorningTime] = useState(user.reminderTimes?.morning || '08:00');
  const [eveningTime, setEveningTime] = useState(user.reminderTimes?.evening || '20:00');
  const [showMorningPicker, setShowMorningPicker] = useState(false);
  const [showEveningPicker, setShowEveningPicker] = useState(false);

  const formatTimeForDisplay = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    const m = minutes.toString().padStart(2, '0');
    return `${h}:${m} ${period}`;
  };

  const getTimeDate = (timeStr: string) => {
    const d = new Date();
    const [h, m] = timeStr.split(':').map(Number);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const onTimeChange = (type: 'morning' | 'evening', event: any, selectedDate?: Date) => {
    // Android: dismiss on any selection or cancel
    if (Platform.OS === 'android') {
      setShowMorningPicker(false);
      setShowEveningPicker(false);
    }

    if (selectedDate) {
      const h = selectedDate.getHours().toString().padStart(2, '0');
      const m = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeStr = `${h}:${m}`;
      if (type === 'morning') {
        setMorningTime(timeStr);
      } else {
        setEveningTime(timeStr);
      }
    }
  };

  const completedCount = rituals.filter(r => r.isCompleted).length;
  const progress = rituals.length > 0 ? (completedCount / rituals.length) * 100 : 0;
  const isAllComplete = rituals.length > 0 && completedCount === rituals.length;

  useEffect(() => {
    if (isAllComplete) {
      setShowConfetti(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [isAllComplete]);

  const handleRefreshAffirmation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await refreshAffirmation();
  };

  const saveSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateUser({ reminderTimes: { morning: morningTime, evening: eveningTime }, hasSetSchedule: true });
    setShowSettings(false);
    refreshAffirmation();
  };

  const handleAddRitual = () => {
    if (newRitualTitle.trim()) {
      addRitual(newRitualTitle.trim());
      setNewRitualTitle('');
      setIsAdding(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAddGratitude = () => {
    if (gratitudeInput.trim()) {
        addGratitude(gratitudeInput.trim());
        setGratitudeInput('');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const todaysGratitude = gratitudeEntries.filter(g => {
    const d = new Date(g.createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  return (
    <View className="flex-1 bg-void">
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20, paddingTop: 64 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-10">
           <View className="flex-row items-center gap-4">
              <View className="w-14 h-14 rounded-full border-2 border-gold/30 p-1">
                  {user.selfieUrl ? (
                    <View className="w-full h-full rounded-full overflow-hidden">
                      <Image source={{ uri: user.selfieUrl }} className="w-full h-full" />
                    </View>
                  ) : (
                    <View className="w-full h-full rounded-full bg-surface items-center justify-center">
                      <Sparkles size={20} color="#F4E0B9" />
                    </View>
                  )}
              </View>
              <View>
                  <Text className="text-[10px] text-gold font-black uppercase tracking-[3px] mb-1">Welcome Home</Text>
                  <Text className="text-2xl font-black text-white tracking-tighter">{user.name.split(' ')[0]}</Text>
              </View>
           </View>
           <TouchableOpacity 
             onPress={() => {
               Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
               setShowSettings(true);
             }} 
             className="w-12 h-12 rounded-2xl bg-surface/50 border border-white/10 items-center justify-center"
           >
             <Settings size={22} color="#9CA3AF" />
           </TouchableOpacity>
        </View>

        {/* Affirmation Card */}
        <View className="bg-surface/40 rounded-[24px] border border-white/5 overflow-hidden mb-10 shadow-2xl">
           <View className="p-6">
              <View className="flex-row justify-between items-center mb-8">
                 <View className="flex-row items-center gap-2">
                   <View className="w-1.5 h-1.5 rounded-full bg-gold shadow-lg shadow-gold/50" />
                   <Text className="text-[10px] tracking-[2px] text-gold font-bold uppercase">QUANTUM PROGRAMMING</Text>
                 </View>
                 <TouchableOpacity onPress={handleRefreshAffirmation} className="bg-white/5 p-2 rounded-[12px] border border-white/10 active:scale-90">
                   {loadingAffirmation ? <ActivityIndicator size="small" color="#F4E0B9" /> : <RefreshCw size={14} color="#6B7280" />}
                 </TouchableOpacity>
              </View>
              <Text className="text-2xl font-black italic text-white/95 leading-[42px] tracking-tight mb-10 text-center px-4">"{affirmation.text}"</Text>
              
              <View className="items-center">
                  {affirmation.isAcknowledged ? (
                    <BlurView intensity={30} tint="light" className="px-6 py-3 rounded-full border border-gold/40 overflow-hidden flex-row items-center gap-2">
                      <CheckCircle2 size={16} color="#F4E0B9" />
                      <Text className="text-gold-bright text-xs font-bold uppercase tracking-widest">Quantum State Locked</Text>
                    </BlurView>
                  ) : (
                  <Button 
                    onPress={async () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        await acknowledgeAffirmation();
                    }}
                    loading={loadingAffirmation}
                  >
                    <View className="flex-row items-center gap-2">
                        <Sparkles size={16} color="#050505" />
                        <Text className="text-void font-bold uppercase tracking-widest text-xs">I Affirm This</Text>
                    </View>
                  </Button>
                )}
              </View>
           </View>
        </View>

        {/* Frequency Tuner (Gratitude) */}
        <View className="mb-10">
            <View className="flex-row items-center gap-2 mb-5 ml-1">
              <Heart size={18} color="#F4E0B9" />
              <Text className="text-[12px] font-bold text-white/80 uppercase tracking-[2px]">Frequency Tuner</Text>
            </View>
            <View className="bg-surface/20 border border-white/5 rounded-[24px] p-6 shadow-xl">
               {todaysGratitude.length < 3 ? (
                  <View className="flex-row items-center gap-3 bg-void/30 px-5 py-4 rounded-[16px] border border-white/5">
                      <TextInput 
                        value={gratitudeInput} 
                        onChangeText={setGratitudeInput} 
                        placeholder={`I am grateful for...`} 
                        placeholderTextColor="#ffffff66" 
                        className="flex-1 text-[15px] text-white font-semibold p-0" 
                      />
                      <TouchableOpacity 
                        onPress={handleAddGratitude} 
                        disabled={!gratitudeInput.trim()}
                        className="bg-gold/10 p-2.5 rounded-[12px] border border-gold/20 active:scale-90"
                      >
                        <Plus size={20} color="#F4E0B9" />
                      </TouchableOpacity>
                  </View>
               ) : (
                  <View className="items-center py-2">
                     <Text className="text-gold-bright text-xs font-bold uppercase tracking-[3px]">Frequency Raised</Text>
                  </View>
               )}
               <View className="mt-6 gap-3">
                   {todaysGratitude.map((g) => (
                      <BlurView key={g.id} intensity={10} tint="light" className="flex-row items-center gap-3 px-5 py-4 rounded-[16px] border border-white/5 overflow-hidden">
                        <Heart size={10} color="#F4E0B9" fill="#F4E0B9" />
                        <Text className="text-sm text-gray-300 font-medium leading-5">{g.text}</Text>
                      </BlurView>
                   ))}
               </View>
            </View>
        </View>

        {/* Rituals */}
        <View className="mb-10">
          <View className="flex-row justify-between items-center mb-5 ml-1">
              <View className="flex-row items-center gap-2">
                  <LayoutDashboard size={18} color="#F4E0B9" />
                  <Text className="text-[12px] font-bold text-white/80 uppercase tracking-[2px]">Daily Rituals</Text>
              </View>
              <View className="flex-row items-center gap-3">
                  <TouchableOpacity 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setIsAdding(!isAdding);
                    }}
                    className="bg-white/5 p-2 rounded-[10px] border border-white/10"
                  >
                    <Plus size={18} color="#F4E0B9" />
                  </TouchableOpacity>
                  <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{completedCount}/{rituals.length}</Text>
              </View>
          </View>
          
          <View className="h-1.5 w-full bg-surface/50 rounded-full mb-8 overflow-hidden">
             <View className="h-full bg-gold shadow-lg shadow-gold/50" style={{ width: `${progress}%` }} />
          </View>

          <View className="gap-3">
              {isAdding && (
                <View className="mb-4">
                  <Input 
                    value={newRitualTitle} 
                    onChangeText={setNewRitualTitle} 
                    placeholder="Lock in new ritual..." 
                    autoFocus 
                  />
                  <View className="flex-row gap-3 -mt-2">
                     <TouchableOpacity onPress={handleAddRitual} className="flex-1 bg-gold h-12 rounded-[14px] items-center justify-center active:scale-95 transition-all">
                        <Text className="text-void font-bold uppercase text-xs tracking-widest">Add Ritual</Text>
                     </TouchableOpacity>
                     <TouchableOpacity onPress={() => setIsAdding(false)} className="flex-1 bg-surface/50 h-12 rounded-[14px] items-center justify-center border border-white/10 active:scale-95 transition-all">
                        <Text className="text-white/60 font-bold uppercase text-xs tracking-widest">Cancel</Text>
                     </TouchableOpacity>
                  </View>
                </View>
              )}
              
              {rituals.length === 0 && !isAdding ? (
                 <View className="py-12 items-center justify-center opacity-60">
                    <Text className="text-gray-400 text-xs font-bold uppercase tracking-[2px]">No Active Rituals</Text>
                 </View>
              ) : isAllComplete ? (
                 <View className="bg-surface/30 p-10 rounded-[32px] border border-gold/30 items-center justify-center overflow-hidden mb-4 shadow-2xl">
                      <View className="w-20 h-20 rounded-full bg-gold items-center justify-center shadow-2xl shadow-gold/40 mb-6">
                          <CheckCircle2 size={40} color="#050505" strokeWidth={3} />
                      </View>
                      <Text className="text-2xl font-black text-white text-center tracking-tighter mb-2">Universe Aligned</Text>
                      <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest text-center leading-5 px-4">Your frequency is optimized for high-performance manifestation</Text>
                 </View>
              ) : rituals.map(ritual => (
                  <TouchableOpacity 
                    key={ritual.id} 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      toggleRitual(ritual.id);
                    }} 
                    onLongPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                      deleteRitual(ritual.id);
                    }}
                    className={`flex-row items-center gap-5 px-5 py-4 rounded-[20px] border ${ritual.isCompleted ? 'bg-gold/10 border-gold/30 opacity-60' : 'bg-surface/40 border-white/10 shadow-sm'}`}
                  >
                      <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${ritual.isCompleted ? 'bg-gold border-gold' : 'border-gold/30'}`}>
                          {ritual.isCompleted && <CheckCircle2 size={14} color="#050505" strokeWidth={4} />}
                      </View>
                      <Text className={`flex-1 text-base font-bold tracking-tight ${ritual.isCompleted ? 'text-gold opacity-60 line-through' : 'text-white'}`}>
                        {ritual.title}
                      </Text>
                      <TouchableOpacity 
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
                          deleteRitual(ritual.id);
                        }}
                        className="opacity-20"
                      >
                        <Trash2 size={16} color="#ffffff" />
                      </TouchableOpacity>
                  </TouchableOpacity>
              ))}
          </View>
        </View>
      </ScrollView>

      {/* Settings Modal - Optimized Time Picker */}
      <Modal visible={showSettings || !user.hasSetSchedule} animationType="fade" transparent={true} statusBarTranslucent>
        <BlurView intensity={80} tint="dark" className="flex-1 justify-center p-8">
           <View className="bg-surface/90 rounded-[32px] border border-white/10 p-8 shadow-2xl overflow-hidden">
              <Text className="text-3xl font-black text-white mb-2 tracking-tighter">Your Rhythm</Text>
              <Text className="text-gray-400 text-sm mb-10 font-medium">Synchronize your life with the universe.</Text>
              
              <View className="gap-8 mb-12">
                <View>
                   <Text className="text-[10px] text-gold/60 font-black uppercase tracking-[2px] mb-4 ml-1">Morning Intention</Text>
                   <TouchableOpacity 
                     onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowMorningPicker(!showMorningPicker);
                        setShowEveningPicker(false);
                     }}
                     className={`bg-void/50 border ${showMorningPicker ? 'border-gold/50' : 'border-white/10'} rounded-[24px] h-20 items-center justify-center shadow-inner active:scale-95 transition-transform`}
                   >
                     <Text className="text-3xl font-black text-white tracking-widest">{formatTimeForDisplay(morningTime)}</Text>
                   </TouchableOpacity>
                   {showMorningPicker && (
                     <DateTimePicker
                       value={getTimeDate(morningTime)}
                       mode="time"
                       is24Hour={false}
                       display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                       onChange={(event, date) => onTimeChange('morning', event, date)}
                     />
                   )}
                </View>

                <View>
                   <Text className="text-[10px] text-gold/60 font-black uppercase tracking-[2px] mb-4 ml-1">Evening Gratitude</Text>
                   <TouchableOpacity 
                     onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowEveningPicker(!showEveningPicker);
                        setShowMorningPicker(false);
                     }}
                     className={`bg-void/50 border ${showEveningPicker ? 'border-gold/50' : 'border-white/10'} rounded-[24px] h-20 items-center justify-center shadow-inner active:scale-95 transition-transform`}
                   >
                     <Text className="text-3xl font-black text-white tracking-widest">{formatTimeForDisplay(eveningTime)}</Text>
                   </TouchableOpacity>
                   {showEveningPicker && (
                     <DateTimePicker
                       value={getTimeDate(eveningTime)}
                       mode="time"
                       is24Hour={false}
                       display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                       onChange={(event, date) => onTimeChange('evening', event, date)}
                     />
                   )}
                </View>
              </View>
              <Button onPress={saveSettings}>Lock In Frequency</Button>
           </View>
        </BlurView>
      </Modal>
    </View>
  );
};
