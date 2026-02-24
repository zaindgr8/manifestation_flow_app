import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView
} from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { useManifest } from '../context/ManifestContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Plus, Check, X, Sparkles } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const GOAL_PLACEHOLDERS: Record<string, string> = {
  'Travel & Adventure': 'e.g., 2 weeks in Japan',
  'Business & Career': 'e.g., Hit $10k/month',
  'Love & Relation': 'e.g., Found my soulmate',
  'Health & Beauty': 'e.g., Run a marathon',
  'Dream Car': 'e.g., My new Porsche',
  'Dream Home': 'e.g., Beachfront villa',
};

const TARGET_PLACEHOLDERS: Record<string, string> = {
  'Travel & Adventure': 'e.g., Book the flights',
  'Business & Career': 'e.g., Sign 5 clients',
  'Love & Relation': 'e.g., Plan date night',
  'Health & Beauty': 'e.g., Abs showing',
  'Dream Car': 'e.g., Pay the deposit',
  'Dream Home': 'e.g., Get pre-approved',
};

type CategoryData = {
  title: string;
  targetDate: string;
  rituals: string[];
};

export const VisionWizard: React.FC = () => {
  const { addGoalAndRitual, setScreen } = useManifest();
  const [phase, setPhase] = useState<'SELECTION' | 'DEFINITION'>('SELECTION');
  const [availableCategories, setAvailableCategories] = useState<string[]>([
    'Travel & Adventure', 'Business & Career', 'Love & Relation', 'Health & Beauty', 'Dream Car', 'Dream Home'
  ]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [flowIndex, setFlowIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, CategoryData>>({});
  const [currentTargetInput, setCurrentTargetInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const currentCategoryIndex = Math.floor(flowIndex / 2);
  const currentCategory = selectedCategories[currentCategoryIndex];
  const isTargetStep = flowIndex % 2 === 1;

  const toggleCategory = (cat: string) => {
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

  const addTargetToCurrent = () => {
    if (currentTargetInput.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const currentRituals = formData[currentCategory]?.rituals || [];
      updateFormData('rituals', [...currentRituals, currentTargetInput.trim()]);
      setCurrentTargetInput('');
    }
  };

  const removeTargetFromCurrent = (index: number) => {
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
      if (isTargetStep) {
        const rituals = formData[currentCategory]?.rituals || [];
        if (rituals.length === 0 && !currentTargetInput.trim()) return;
        if (currentTargetInput.trim()) { addTargetToCurrent(); }
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
        if (data) { 
            await addGoalAndRitual({ 
                categories: [cat], 
                title: data.title, 
                targetDate: data.targetDate 
            }, data.rituals); 
        }
      }
      setScreen('TIMELINE');
    } catch (e) { setIsSubmitting(false); }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Tracker */}
        <View style={styles.progressHeader}>
          <View style={styles.progressBar}>
            {phase === 'DEFINITION' ? (
              Array.from({ length: selectedCategories.length * 2 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressStep,
                    i <= flowIndex ? styles.progressStepActive : styles.progressStepInactive
                  ]}
                />
              ))
            ) : (
              <View style={styles.progressStepStatic} />
            )}
          </View>
        </View>

        <View style={styles.mainContent}>
          {phase === 'SELECTION' ? (
            <View style={styles.selectionView}>
              <View style={styles.textSection}>
                <Text style={styles.kicker}>YOUR FOCUS</Text>
                <Text style={styles.title}>What to Manifest?</Text>
                <Text style={styles.subtitle}>CHOOSE WHERE TO FOCUS YOUR ENERGY.</Text>
              </View>

              <View style={styles.categoryGrid}>
                {availableCategories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => toggleCategory(cat)}
                    style={[
                      styles.categoryCard,
                      selectedCategories.includes(cat) ? styles.categoryCardActive : styles.categoryCardBlurred
                    ]}
                  >
                    <Text style={[
                      styles.categoryText,
                      selectedCategories.includes(cat) ? styles.categoryTextActive : styles.categoryTextInactive
                    ]}>
                      {cat}
                    </Text>
                    {selectedCategories.includes(cat) && (
                      <View style={styles.checkCircle}>
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
                  style={styles.customCard}
                >
                  <Plus size={24} color="rgba(255, 255, 255, 0.3)" />
                  <Text style={styles.customText}>CUSTOM</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.actionRow}>
                <View style={styles.flex1}>
                  <Button variant="secondary" onPress={() => setScreen('TIMELINE')}>Cancel</Button>
                </View>
                <View style={styles.flex1}>
                  <Button disabled={selectedCategories.length === 0} onPress={handleNext}>Confirm</Button>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.definitionView}>
              {!isTargetStep ? (
                <View style={styles.stepWrapper}>
                  <View style={styles.textSection}>
                    <Text style={styles.kicker}>THE DETAILS</Text>
                    <Text style={styles.titleSmall}>Define your Dream</Text>
                    <View style={styles.categoryBadgeWrapper}>
                      <BlurView intensity={20} tint="light" style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{currentCategory}</Text>
                      </BlurView>
                    </View>
                  </View>

                  <BlurView intensity={10} tint="dark" style={styles.card}>
                    <View style={styles.formGap}>
                      <Input
                        label="YOUR GOAL"
                        placeholder={GOAL_PLACEHOLDERS[currentCategory] || "Describe your vision..."}
                        value={formData[currentCategory]?.title}
                        onChangeText={t => updateFormData('title', t)}
                      />

                      <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                        <View pointerEvents="none">
                          <Input
                            label="TIMELINE"
                            placeholder="When does this arrive?"
                            value={formData[currentCategory]?.targetDate ? `Manifest by ${formData[currentCategory]?.targetDate}` : ""}
                            editable={false}
                          />
                        </View>
                      </TouchableOpacity>

                      {showDatePicker && (
                        <View style={styles.datePickerWrapper}>
                          <BlurView intensity={30} tint="dark" style={styles.datePickerBlur}>
                            <RNDateTimePicker
                              value={formData[currentCategory]?.targetDate ? new Date(formData[currentCategory]?.targetDate) : new Date()}
                              mode="date"
                              themeVariant="dark"
                              accentColor="#F4E0B9"
                              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                              onChange={(event, date) => {
                                if (Platform.OS === 'android' && event.type === 'set') setShowDatePicker(false);
                                if (date) {
                                  const dateString = date.toISOString().split('T')[0];
                                  updateFormData('targetDate', dateString);
                                }
                              }}
                              minimumDate={new Date()}
                            />
                            {Platform.OS === 'ios' && (
                              <TouchableOpacity
                                style={styles.datePickerDone}
                                onPress={() => {
                                  if (!formData[currentCategory]?.targetDate) {
                                    updateFormData('targetDate', new Date().toISOString().split('T')[0]);
                                  }
                                  setShowDatePicker(false);
                                }}
                              >
                                <Text style={styles.datePickerDoneText}>Confirm</Text>
                              </TouchableOpacity>
                            )}
                          </BlurView>
                        </View>
                      )}

                      <View style={styles.actionRowSub}>
                        <View style={styles.flex1}><Button variant="secondary" onPress={handleBack}>Back</Button></View>
                        <View style={styles.flex1}><Button onPress={handleNext}>Next Step</Button></View>
                      </View>
                    </View>
                  </BlurView>
                </View>
              ) : (
                <View style={styles.stepWrapper}>
                  <View style={styles.textSection}>
                    <Text style={styles.kicker}>YOUR TARGETS</Text>
                    <Text style={styles.titleSmall}>Your Targets</Text>
                    <Text style={styles.subtitleSmall}>What specific milestones will lead you to your ultimate goal for {currentCategory}?</Text>
                  </View>

                  <BlurView intensity={10} tint="dark" style={styles.card}>
                    <View style={styles.formGap}>
                      <View style={styles.ritualInputRow}>
                        <View style={styles.flex1}>
                          <Input
                            label="ADD A TARGET"
                            placeholder={TARGET_PLACEHOLDERS[currentCategory] || "e.g., Secure flight tickets..."}
                            value={currentTargetInput}
                            onChangeText={setCurrentTargetInput}
                          />
                        </View>
                        <TouchableOpacity
                          onPress={addTargetToCurrent}
                          style={styles.addRitualBtn}
                        >
                          <Plus size={24} color="#F4E0B9" />
                        </TouchableOpacity>
                      </View>

                      {formData[currentCategory]?.rituals?.length > 0 && (
                        <View style={styles.ritualList}>
                          {formData[currentCategory].rituals.map((r, i) => (
                            <View key={i} style={styles.ritualItem}>
                              <Text style={styles.ritualItemText}>{r}</Text>
                              <TouchableOpacity
                                onPress={() => removeTargetFromCurrent(i)}
                                style={styles.ritualRemoveBtn}
                              >
                                <X size={14} color="rgba(255, 255, 255, 0.4)" />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      )}

                      <View style={styles.actionRowSub}>
                        <View style={styles.flex1}><Button variant="secondary" onPress={handleBack}>Back</Button></View>
                        <View style={styles.flex1}>
                          <Button onPress={handleNext} loading={isSubmitting}>
                            {flowIndex === (selectedCategories.length * 2) - 1 ? "DONE" : "Next"}
                          </Button>
                        </View>
                      </View>
                    </View>
                  </BlurView>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Custom Category Modal */}
      <Modal visible={isAddingCustom} transparent={true} animationType="fade" statusBarTranslucent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <BlurView intensity={80} tint="dark" style={styles.modalBg}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Custom Focus</Text>
              <Text style={styles.modalSub}>What else would you like to manifest?</Text>

              <Input
                autoFocus
                label="AREA OF FOCUS"
                placeholder="e.g., Spiritual Mastery"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
              />

              <View style={styles.modalActions}>
                <View style={styles.flex1}>
                  <Button variant="secondary" onPress={() => setIsAddingCustom(false)}>Cancel</Button>
                </View>
                <View style={styles.flex1}>
                  <Button onPress={handleAddCustomCategory}>CREATE</Button>
                </View>
              </View>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  progressHeader: {
    marginBottom: 40,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    height: 6,
  },
  progressStep: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  progressStepActive: {
    backgroundColor: '#F4E0B9',
    shadowColor: '#F4E0B9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  progressStepInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  progressStepStatic: {
    width: '33%',
    height: 6,
    backgroundColor: '#F4E0B9',
    borderRadius: 3,
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  mainContent: {
    flex: 1,
  },
  selectionView: {
    flex: 1,
  },
  definitionView: {
    flex: 1,
  },
  stepWrapper: {
    flex: 1,
  },
  kicker: {
    fontSize: 10,
    color: '#F4E0B9',
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 10,
    opacity: 0.8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -1,
  },
  titleSmall: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 8,
    opacity: 1,
  },
  subtitleSmall: {
    fontSize: 10,
    color: '#F4E0B9',
    fontWeight: '700',
    letterSpacing: 2.5,
    marginTop: 10,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryCard: {
    width: (width - 48 - 12) / 2,
    height: 100,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  categoryCardActive: {
    borderColor: '#F4E0B9',
    backgroundColor: 'rgba(244, 224, 185, 0.1)',
  },
  categoryCardBlurred: {
    borderColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  categoryTextActive: {
    color: '#FFF',
  },
  categoryTextInactive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  checkCircle: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F4E0B9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customCard: {
    width: (width - 48 - 12) / 2,
    height: 100,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 40,
  },
  actionRowSub: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  flex1: {
    flex: 1,
  },
  card: {
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    overflow: 'hidden',
    padding: 24,
  },
  formGap: {
    gap: 16,
  },
  categoryBadgeWrapper: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(244, 224, 185, 0.2)',
  },
  categoryBadgeText: {
    color: '#F4E0B9',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  datePickerWrapper: {
    marginTop: -8,
    marginHorizontal: -16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  datePickerBlur: {
    padding: 8,
    alignItems: 'center',
  },
  datePickerDone: {
    backgroundColor: '#F4E0B9',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 8,
  },
  datePickerDoneText: {
    color: '#050505',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  ritualInputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  addRitualBtn: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 224, 185, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(244, 224, 185, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20, // Align with Input margin
  },
  ritualList: {
    gap: 10,
    marginTop: 8,
  },
  ritualItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ritualItemText: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  ritualRemoveBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 5, 0.85)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'rgba(15, 15, 15, 0.95)',
    borderRadius: 32,
    padding: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#F4E0B9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -1,
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 22,
    marginBottom: 32,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
});