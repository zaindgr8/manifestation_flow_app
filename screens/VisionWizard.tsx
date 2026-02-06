import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Platform } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { useManifest } from '../context/ManifestContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ArrowRight, Activity, Plus, Check, X, ArrowLeft, Loader2 } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const GOAL_PLACEHOLDERS: Record<string, string> = {
  'Travel & Adventure': 'e.g., Two weeks in Kyoto...',
  'Business & Career': 'e.g., $100k/month revenue...',
  'Love & Relation': 'e.g., Meeting my soulmate...',
  'Health & Beauty': 'e.g., Run a marathon...',
  'Dream Car': 'e.g., Porsche 911 GT3 RS...',
  'Dream Home': 'e.g., Beachfront villa...',
};

const RITUAL_PLACEHOLDERS: Record<string, string> = {
  'Travel & Adventure': 'e.g., Save $50 daily...',
  'Business & Career': 'e.g., Call 5 leads before noon...',
  'Love & Relation': 'e.g., Practice active listening...',
  'Health & Beauty': 'e.g., Drink 3L water...',
  'Dream Car': 'e.g., Save $200/month...',
  'Dream Home': 'e.g., Check listings daily...',
};

type CategoryData = {
  title: string;
  targetDate: string;
  rituals: string[];
};

export const VisionWizard: React.FC = () => {
  const { addGoalAndRitual, setScreen, goals } = useManifest();
  const [phase, setPhase] = useState<'SELECTION' | 'DEFINITION'>('SELECTION');
  const [availableCategories, setAvailableCategories] = useState<string[]>([
    'Travel & Adventure', 'Business & Career', 'Love & Relation', 'Health & Beauty', 'Dream Car', 'Dream Home'
  ]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [flowIndex, setFlowIndex] = useState(0); 
  const [formData, setFormData] = useState<Record<string, CategoryData>>({});
  const [currentRitualInput, setCurrentRitualInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const currentCategoryIndex = Math.floor(flowIndex / 2);
  const currentCategory = selectedCategories[currentCategoryIndex];
  const isRitualStep = flowIndex % 2 === 1;
  const activeCategories = new Set(goals.flatMap(g => g.categories));

  const toggleCategory = (cat: string) => {
    if (activeCategories.has(cat)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleAddCustomCategory = () => {
    if (newCategoryName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const name = newCategoryName.trim();
      setAvailableCategories(prev => [...prev, name]);
      setSelectedCategories(prev => [...prev, name]);
      setNewCategoryName('');
      setIsAddingCustom(false);
    }
  };

  const updateFormData = (field: keyof CategoryData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [currentCategory]: {
        ...(prev[currentCategory] || { title: '', targetDate: '', rituals: [] }),
        [field]: value
      }
    }));
  };

  const addRitualToCurrent = () => {
    if (currentRitualInput.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const currentRituals = formData[currentCategory]?.rituals || [];
      updateFormData('rituals', [...currentRituals, currentRitualInput.trim()]);
      setCurrentRitualInput('');
    }
  };

  const removeRitualFromCurrent = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentRituals = formData[currentCategory]?.rituals || [];
    updateFormData('rituals', currentRituals.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (phase === 'SELECTION') {
      if (selectedCategories.length === 0) return;
      const initialData: Record<string, CategoryData> = {};
      selectedCategories.forEach(cat => {
        initialData[cat] = { title: '', targetDate: '', rituals: [] };
      });
      setFormData(prev => ({ ...prev, ...initialData }));
      setPhase('DEFINITION');
      setFlowIndex(0);
    } else {
      if (isRitualStep) {
        const rituals = formData[currentCategory]?.rituals || [];
        if (rituals.length === 0 && !currentRitualInput.trim()) return;
        if (currentRitualInput.trim()) { addRitualToCurrent(); }
        if (flowIndex === (selectedCategories.length * 2) - 1) { handleSubmitAll(); }
        else { setFlowIndex(prev => prev + 1); }
      } else {
        const data = formData[currentCategory];
        if (!data?.title || !data?.targetDate) return;
        setFlowIndex(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (phase === 'SELECTION') { setScreen('TIMELINE'); }
    else {
      if (flowIndex === 0) { setPhase('SELECTION'); }
      else { setFlowIndex(prev => prev - 1); }
    }
  };

  const handleSubmitAll = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
        for (const cat of selectedCategories) {
            const data = formData[cat];
            if (data) { await addGoalAndRitual({ categories: [cat], title: data.title, targetDate: data.targetDate }, data.rituals); }
        }
        setScreen('TIMELINE');
    } catch (e) { setIsSubmitting(false); }
  };

  return (
    <>
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100, paddingTop: 64 }} 
        className="bg-void"
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Bar Container */}
        <View className="px-6 mb-12">
          <View className="flex-row gap-2.5">
            {phase === 'DEFINITION' ? (
              Array.from({ length: selectedCategories.length * 2 }).map((_, i) => (
                  <View key={i} className={`h-1.5 flex-1 rounded-full ${i <= flowIndex ? 'bg-gold shadow-lg shadow-gold/40' : 'bg-white/5'}`} />
              ))
            ) : (
              <View className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <View className="h-full w-1/3 bg-gold rounded-full shadow-lg shadow-gold/40" />
              </View>
            )}
          </View>
        </View>

        <View className="px-6">

        {phase === 'SELECTION' ? (
          <View>
            <Text className="text-[12px] text-gold font-bold uppercase tracking-[3px] text-center mb-2">Intentionality</Text>
            <Text className="text-4xl font-black text-white text-center mb-4 tracking-tighter">Select Areas</Text>
            <Text className="text-gray-400 text-sm text-center mb-10 leading-6 font-medium px-4">Where will you focus your energy?</Text>
            
            <View className="flex-row flex-wrap justify-between gap-y-4">
              {availableCategories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => toggleCategory(cat)}
                  className={`p-5 rounded-[16px] border flex-row items-center justify-between w-[48%] h-24 ${
                    selectedCategories.includes(cat) ? 'border-gold bg-gold/10' : 'border-white/5 bg-surface/30'
                  }`}
                >
                  <Text className={`text-[13px] font-bold leading-5 flex-1 ${selectedCategories.includes(cat) ? 'text-white' : 'text-gray-400'}`}>{cat}</Text>
                  {selectedCategories.includes(cat) && (
                    <View className="bg-gold rounded-full w-5 h-5 items-center justify-center ml-2">
                      <Check size={12} color="#050505" strokeWidth={4} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                onPress={() => {
                   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                   setIsAddingCustom(true);
                }} 
                className="p-5 rounded-[16px] border border-dashed border-white/10 w-[48%] h-24 items-center justify-center bg-white/5"
              >
                <Plus size={24} color="#6B7280" />
                <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2">Custom</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-4 mt-12">
                <View className="flex-1">
                    <Button variant="secondary" onPress={() => setScreen('TIMELINE')}>Cancel</Button>
                </View>
                <View className="flex-1">
                    <Button disabled={selectedCategories.length === 0} onPress={handleNext}>Confirm</Button>
                </View>
            </View>
          </View>
        ) : (
          <View>
            {!isRitualStep ? (
              <View>
                <Text className="text-xs text-gold font-bold uppercase tracking-[3px] text-center mb-2">Definition</Text>
                <Text className="text-3xl font-black text-white text-center mb-4 tracking-tighter leading-10">Define your Dream</Text>
                <View className="self-center mb-10 overflow-hidden rounded-full">
                  <BlurView intensity={30} tint="light" className="px-5 py-2 border border-white/20">
                    <Text className="text-gold-bright text-xs uppercase font-bold tracking-widest">{currentCategory}</Text>
                  </BlurView>
                </View>

                <Input 
                  label="What do you see?" 
                  placeholder={GOAL_PLACEHOLDERS[currentCategory] || "Describe your vision..."} 
                  value={formData[currentCategory]?.title} 
                  onChangeText={t => updateFormData('title', t)} 
                />
                
                <TouchableOpacity onPress={() => setShowDatePicker(true)} className="mb-6">
                  <View pointerEvents="none">
                    <Input 
                      label="Timeline" 
                      placeholder="When does this arrive?" 
                      value={formData[currentCategory]?.targetDate ? `Expected by ${formData[currentCategory]?.targetDate}` : ""} 
                      editable={false}
                    />
                  </View>
                </TouchableOpacity>

                {showDatePicker && (
                  <RNDateTimePicker
                    value={formData[currentCategory]?.targetDate ? new Date(formData[currentCategory]?.targetDate) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, date) => {
                      if (Platform.OS === 'android') setShowDatePicker(false);
                      if (date) {
                        const dateString = date.toISOString().split('T')[0];
                        updateFormData('targetDate', dateString);
                      }
                    }}
                    minimumDate={new Date()}
                  />
                )}
                {Platform.OS === 'ios' && showDatePicker && (
                   <View className="mb-6"><Button variant="secondary" onPress={() => setShowDatePicker(false)}>Confirm Date</Button></View>
                )}

                <View className="flex-row gap-4 mt-6">
                  <View className="flex-1"><Button variant="secondary" onPress={handleBack}>Back</Button></View>
                  <View className="flex-1"><Button onPress={handleNext}>Next Step</Button></View>
                </View>
              </View>
            ) : (
              <View>
                <Text className="text-[12px] text-gold font-bold uppercase tracking-[3px] text-center mb-2">The Bridge</Text>
                <Text className="text-3xl font-black text-white text-center mb-4 tracking-tighter leading-10">Daily Action</Text>
                <Text className="text-gray-400 text-sm text-center mb-10 leading-6 px-4 font-medium">
                  What repeated rituals will anchor this reality for {currentCategory}?
                </Text>

                <View className="flex-row gap-3 mb-10 items-end">
                    <View className="flex-1">
                      <Input 
                        label="Add a ritual"
                        placeholder={RITUAL_PLACEHOLDERS[currentCategory] || "Describe the action..."} 
                        value={currentRitualInput} 
                        onChangeText={setCurrentRitualInput} 
                      />
                    </View>
                    <TouchableOpacity 
                      onPress={addRitualToCurrent} 
                      className="bg-gold/10 border border-gold/20 w-14 h-14 rounded-[16px] items-center justify-center mb-6 active:scale-95 transition-all"
                    >
                      <Plus size={24} color="#F4E0B9" />
                    </TouchableOpacity>
                </View>

                {formData[currentCategory]?.rituals?.length > 0 && (
                  <View className="gap-3 mb-12">
                    {formData[currentCategory].rituals.map((r, i) => (
                        <BlurView key={i} intensity={10} tint="light" className="flex-row justify-between items-center px-5 py-4 rounded-[16px] border border-white/5 overflow-hidden">
                          <Text className="text-white text-sm font-semibold pr-4 leading-5">{r}</Text>
                          <TouchableOpacity 
                            onPress={() => removeRitualFromCurrent(i)}
                            className="w-8 h-8 items-center justify-center bg-white/5 rounded-[8px]"
                          >
                            <X size={14} color="#6B7280" />
                          </TouchableOpacity>
                        </BlurView>
                    ))}
                  </View>
                )}

                <View className="flex-row gap-4 mt-6">
                  <View className="flex-1"><Button variant="secondary" onPress={handleBack}>Back</Button></View>
                  <View className="flex-1">
                    <Button onPress={handleNext} loading={isSubmitting}>
                      {flowIndex === (selectedCategories.length * 2) - 1 ? "Collapse" : "Next"}
                    </Button>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
        </View>
      </ScrollView>

      <Modal visible={isAddingCustom} transparent={true} animationType="fade" statusBarTranslucent>
        <BlurView intensity={80} tint="dark" className="flex-1 justify-center p-8">
          <View className="bg-surface/90 w-full p-8 rounded-[32px] border border-white/10 shadow-2xl">
            <Text className="text-2xl font-black text-white mb-2 tracking-tighter">New Portal</Text>
            <Text className="text-gray-400 text-sm mb-8 leading-6 font-medium">Define an area not captured by the collective.</Text>
            <Input 
              autoFocus 
              label="Area of Focus"
              placeholder="e.g., Spiritual Mastery" 
              value={newCategoryName} 
              onChangeText={setNewCategoryName} 
            />
            <View className="flex-row gap-4 mt-6">
              <View className="flex-1">
                <Button variant="secondary" onPress={() => setIsAddingCustom(false)}>Cancel</Button>
              </View>
              <View className="flex-1">
                <Button onPress={handleAddCustomCategory}>Open Portal</Button>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>
    </>
  );
};