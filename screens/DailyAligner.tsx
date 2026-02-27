import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, TextInput, ActivityIndicator, Platform, KeyboardAvoidingView, Keyboard, Alert } from 'react-native';
import { useManifest } from '../context/ManifestContext';
import { Check, RefreshCw, Settings, Bell, Sun, Moon, X, Flame, CheckCircle2, Plus, Edit2, Trash2, Save, Heart, Sparkles, Maximize2, LayoutDashboard } from 'lucide-react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import DateTimePicker from '@react-native-community/datetimepicker';
import { showErrorToast } from '../utils/toast';
import { handleApiError } from '../utils/apiError';

export const DailyAligner: React.FC = () => {
  const { user, rituals, goals, affirmation, toggleRitual, refreshAffirmation, updateUser, acknowledgeAffirmation, addRitual, deleteRitual, gratitudeEntries, addGratitude, loadingAffirmation } = useManifest();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newTargetTitle, setNewTargetTitle] = useState('');
  const [gratitudeInput, setGratitudeInput] = useState('');
  // These are the "committed" display values shown in the buttons.
  const [morningTime, setMorningTime] = useState(user.reminderTimes?.morning || '08:00');
  const [eveningTime, setEveningTime] = useState(user.reminderTimes?.evening || '20:00');
  const [showMorningPicker, setShowMorningPicker] = useState(false);
  const [showEveningPicker, setShowEveningPicker] = useState(false);

  // Use state for the active picker value to ensure it's a properly controlled component.
  // This prevents the "snap-back" behavior on iOS.
  const [morningPickerDate, setMorningPickerDate] = useState(new Date());
  const [eveningPickerDate, setEveningPickerDate] = useState(new Date());

  const formatTimeForDisplay = (timeStr: string) => {
    if (!timeStr) return '--:--';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    const m = minutes.toString().padStart(2, '0');
    return `${h}:${m} ${period}`;
  };

  const getTimeDate = (timeStr: string) => {
    const d = new Date();
    const [h, m] = (timeStr || '00:00').split(':').map(Number);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const onTimeChange = (type: 'morning' | 'evening', event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowMorningPicker(false);
      setShowEveningPicker(false);
      if (selectedDate) {
        const h = selectedDate.getHours().toString().padStart(2, '0');
        const m = selectedDate.getMinutes().toString().padStart(2, '0');
        const timeStr = `${h}:${m}`;
        if (type === 'morning') setMorningTime(timeStr);
        else setEveningTime(timeStr);
      }
      return;
    }

    // iOS: update the state immediately so the wheel follows the user's finger correctly
    if (selectedDate) {
      if (type === 'morning') setMorningPickerDate(selectedDate);
      else setEveningPickerDate(selectedDate);
    }
  };

  const commitPickerValue = (type: 'morning' | 'evening') => {
    const d = type === 'morning' ? morningPickerDate : eveningPickerDate;
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    const timeStr = `${h}:${m}`;
    if (type === 'morning') {
      setMorningTime(timeStr);
      setShowMorningPicker(false);
    } else {
      setEveningTime(timeStr);
      setShowEveningPicker(false);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const openSettings = () => {
    const morning = user.reminderTimes?.morning || '08:00';
    const evening = user.reminderTimes?.evening || '20:00';
    setMorningTime(morning);
    setEveningTime(evening);
    setMorningPickerDate(getTimeDate(morning));
    setEveningPickerDate(getTimeDate(evening));
    setShowMorningPicker(false);
    setShowEveningPicker(false);
    setShowSettings(true);
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
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await refreshAffirmation();
    } catch (e) {
      const msg = handleApiError(e, 'refreshAffirmation');
      showErrorToast('Failed to refresh affirmation', msg);
    }
  };

  const saveSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateUser({ reminderTimes: { morning: morningTime, evening: eveningTime }, hasSetSchedule: true })
      .catch((e: unknown) => {
        const msg = handleApiError(e, 'saveSettings');
        showErrorToast('Failed to save settings', msg);
      });
    setShowSettings(false);
    refreshAffirmation().catch(() => {});
  };

  const handleAddRitual = () => {
    if (newTargetTitle.trim()) {
      addRitual(newTargetTitle.trim());
      setNewTargetTitle('');
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
              <Text className="text-[14px] text-gold font-black uppercase tracking-[5px] mb-2">VISION BOARD</Text>
              <Text className="text-5xl font-black text-white tracking-tighter">{user.name.split(' ')[0]}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              openSettings();
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
                <Text className="text-[11px] tracking-[2px] text-gold font-black uppercase">DAILY AFFIRMATIONS</Text>
              </View>
              <TouchableOpacity onPress={handleRefreshAffirmation} className="bg-white/5 p-2 rounded-[12px] border border-white/10 active:scale-90">
                {loadingAffirmation ? <ActivityIndicator size="small" color="#F4E0B9" /> : <RefreshCw size={14} color="#6B7280" />}
              </TouchableOpacity>
            </View>
            <Text className="text-3xl font-black italic text-white leading-[48px] tracking-tight mb-10 text-center px-4">"{affirmation.text}"</Text>

            <View className="items-center">
              {affirmation.isAcknowledged ? (
                <BlurView intensity={30} tint="light" className="px-6 py-3 rounded-full border border-gold/40 overflow-hidden flex-row items-center gap-2">
                  <CheckCircle2 size={16} color="#F4E0B9" />
                  <Text className="text-gold-bright text-xs font-bold uppercase tracking-widest">Affirmed</Text>
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
                    <Sparkles size={20} color="#050505" />
                    <Text className="text-void font-black uppercase tracking-[3px] text-base">I Affirm This</Text>
                  </View>
                </Button>
              )}
            </View>
          </View>
        </View>


        {/* Rituals */}
        <View className="mb-8">
          <View className="flex-row justify-between items-center mb-4 ml-1">
            <View className="flex-row items-center gap-2">
              <LayoutDashboard size={18} color="#F4E0B9" />
              <Text className="text-[14px] font-black text-white uppercase tracking-[2px]">Set Targets</Text>
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
              <Text className="text-[12px] font-black text-white/80 uppercase tracking-widest">{completedCount}/{rituals.length}</Text>
            </View>
          </View>

          <View className="h-2.5 w-full bg-surface/50 rounded-full mb-8 overflow-hidden">
            <View className="h-full bg-gold shadow-lg shadow-gold/50" style={{ width: `${progress}%` }} />
          </View>

          <View className="gap-3">

            {rituals.length === 0 && !isAdding ? (
              <View className="py-12 items-center justify-center opacity-60">
                <Text className="text-gray-400 text-xs font-bold uppercase tracking-[2px]">No Active Targets</Text>
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
                  Alert.alert('Delete Ritual', 'Are you sure you want to remove this ritual?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteRitual(ritual.id) },
                  ]);
                }}
                className={`flex-row items-center gap-5 px-5 py-4 rounded-[20px] border ${ritual.isCompleted ? 'bg-gold/10 border-gold/30 opacity-60' : 'bg-surface/40 border-white/10 shadow-sm'}`}
              >
                <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${ritual.isCompleted ? 'bg-gold border-gold' : 'border-gold/30'}`}>
                  {ritual.isCompleted && <CheckCircle2 size={14} color="#050505" strokeWidth={4} />}
                </View>
                <View className="flex-1">
                  <Text className={`text-xl font-black tracking-tight ${ritual.isCompleted ? 'text-gold opacity-60 line-through' : 'text-white'}`}>
                    {ritual.title}
                  </Text>
                  <Text className={`text-[10px] font-bold uppercase tracking-widest ${ritual.isCompleted ? 'text-gold/40' : 'text-gold/60'}`}>
                    {goals.find(g => g.id === ritual.goalId)?.title || 'General'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
                    Alert.alert('Delete Ritual', 'Are you sure you want to remove this ritual?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteRitual(ritual.id) },
                    ]);
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

      {/* Add Target Modal — bottom sheet, always above keyboard */}
      <Modal
        visible={isAdding}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => { setIsAdding(false); setNewTargetTitle(''); }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Tap backdrop to cancel */}
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' }}
            activeOpacity={1}
            onPress={() => { setIsAdding(false); setNewTargetTitle(''); Keyboard.dismiss(); }}
          />

          {/* Sheet */}
          <View style={{
            backgroundColor: '#121212',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 32,
            borderTopWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
          }}>
            {/* Handle */}
            <View style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, alignSelf: 'center', marginBottom: 24 }} />

            <Text style={{ color: '#F4E0B9', fontSize: 11, fontWeight: '800', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 14 }}>
              New Target
            </Text>

            <TextInput
              autoFocus
              value={newTargetTitle}
              onChangeText={setNewTargetTitle}
              placeholder="e.g. Gym every morning..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              returnKeyType="done"
              onSubmitEditing={handleAddRitual}
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderWidth: 1.5,
                borderColor: '#F4E0B9',
                borderRadius: 16,
                color: '#fff',
                fontSize: 17,
                paddingHorizontal: 18,
                paddingVertical: 16,
                marginBottom: 16,
              }}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={handleAddRitual}
                style={{
                  flex: 1,
                  backgroundColor: '#F4E0B9',
                  height: 52,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#050505', fontWeight: '800', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }}>Add Target</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setIsAdding(false); setNewTargetTitle(''); Keyboard.dismiss(); }}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>




      {/* Settings Modal - Optimized Time Picker */}
      <Modal visible={showSettings || !user.hasSetSchedule} animationType="fade" transparent={true} statusBarTranslucent>
        <BlurView intensity={80} tint="dark" className="flex-1 justify-center p-8">
          <View className="bg-surface/90 rounded-[32px] border border-white/10 p-8 shadow-2xl overflow-hidden">
            <Text className="text-4xl font-black text-white mb-2 tracking-tighter">Daily Reminders</Text>
            <Text className="text-gray-300 text-base mb-10 font-bold">Set times to receive your daily affirmations.</Text>

            <View className="gap-8 mb-12">
              <View>
                <Text className="text-[13px] text-gold/90 font-black uppercase tracking-[3px] mb-4 ml-1">MORNING AFFIRMATION</Text>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMorningPickerDate(getTimeDate(morningTime));
                    setShowMorningPicker(!showMorningPicker);
                    setShowEveningPicker(false);
                  }}
                  className={`bg-void/50 border ${showMorningPicker ? 'border-gold/50' : 'border-white/10'} rounded-[24px] h-20 items-center justify-center shadow-inner active:scale-95 transition-transform`}
                >
                  <Text className="text-3xl font-black text-white tracking-widest">{formatTimeForDisplay(morningTime)}</Text>
                </TouchableOpacity>
                {showMorningPicker && (
                  <View>
                    <DateTimePicker
                      value={morningPickerDate}
                      mode="time"
                      is24Hour={false}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, date) => onTimeChange('morning', event, date)}
                      textColor="#FFFFFF"
                    />
                    {Platform.OS === 'ios' && (
                      <TouchableOpacity
                        onPress={() => commitPickerValue('morning')}
                        className="bg-gold/20 border border-gold/40 rounded-[16px] py-3 mx-4 mt-1 items-center"
                      >
                        <Text className="text-gold font-black uppercase tracking-widest text-sm">Done</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              <View>
                <Text className="text-[13px] text-gold/90 font-black uppercase tracking-[3px] mb-4 ml-1">EVENING AFFIRMATION</Text>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setEveningPickerDate(getTimeDate(eveningTime));
                    setShowEveningPicker(!showEveningPicker);
                    setShowMorningPicker(false);
                  }}
                  className={`bg-void/50 border ${showEveningPicker ? 'border-gold/50' : 'border-white/10'} rounded-[24px] h-20 items-center justify-center shadow-inner active:scale-95 transition-transform`}
                >
                  <Text className="text-3xl font-black text-white tracking-widest">{formatTimeForDisplay(eveningTime)}</Text>
                </TouchableOpacity>
                {showEveningPicker && (
                  <View>
                    <DateTimePicker
                      value={eveningPickerDate}
                      mode="time"
                      is24Hour={false}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, date) => onTimeChange('evening', event, date)}
                      textColor="#FFFFFF"
                    />
                    {Platform.OS === 'ios' && (
                      <TouchableOpacity
                        onPress={() => commitPickerValue('evening')}
                        className="bg-gold/20 border border-gold/40 rounded-[16px] py-3 mx-4 mt-1 items-center"
                      >
                        <Text className="text-gold font-black uppercase tracking-widest text-sm">Done</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
            <Button onPress={saveSettings}>SAVE REMINDERS</Button>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
};
