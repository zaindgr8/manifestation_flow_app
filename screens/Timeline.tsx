import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  Platform,
  StyleSheet,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Alert
} from 'react-native';
import { useManifest } from '../context/ManifestContext';
import { 
  RefreshCw, 
  Sparkles, 
  X, 
  ChevronRight, 
  Upload, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  AlertCircle,
  Calendar as CalendarIcon,
  Plus,
  Type
} from 'lucide-react-native';
import { Button } from '../components/Button';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import DateTimePicker from '@react-native-community/datetimepicker';
import { VisionGoal } from '../types';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import { handleApiError } from '../utils/apiError';

const { width, height } = Dimensions.get('window');

export const Timeline: React.FC = () => {
  const {
    goals,
    rituals,
    user,
    authUser,
    setScreen,
    regenerateGoalImage,
    personalizeGoalImage,
    updateGoalWithRituals,
    deleteGoal,
    deductCredits,
    simulateLifestyle
  } = useManifest();
  
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Edit Goal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<VisionGoal | null>(null);
  const [editingRituals, setEditingRituals] = useState<{id?: string, title: string, deleted?: boolean}[]>([]);
  const [optionsMenuId, setOptionsMenuId] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleRegenerateImage = async (goalId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await regenerateGoalImage(goalId);
    } catch (e: any) {
      if (e.message === 'INSUFFICIENT_ENERGY') {
        Alert.alert(
          "Insufficient Credits",
          "You need 1 Energy to regenerate this vision. Top up at the Store.",
          [
            { text: "Later", style: "cancel" },
            { text: "Go to Store", onPress: () => setScreen('STORE') }
          ]
        );
      }
    }
  };

  const handleFeelItClick = (goalId: string) => {
    setActiveGoalId(goalId);
    setModalOpen(true);
    setIsGenerating(false);
  };

  const handleOpenEdit = (goal: VisionGoal) => {
    setEditingGoal({ ...goal });
    // Filter rituals for this goal
    const goalRituals = rituals.filter(r => r.goalId === goal.id).map(r => ({ id: r.id, title: r.title }));
    setEditingRituals(goalRituals);
    setEditModalOpen(true);
    setOptionsMenuId(null);
  };

  const handleAddRitualToEdit = () => {
    setEditingRituals(prev => [...prev, { title: '' }]);
  };

  const handleRemoveRitualFromEdit = (index: number) => {
    setEditingRituals(prev => {
        const next = [...prev];
        if (next[index].id) {
            next[index] = { ...next[index], deleted: true };
        } else {
            next.splice(index, 1);
        }
        return next;
    });
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
        await updateGoalWithRituals(
            editingGoal.id, 
            { title: editingGoal.title, targetDate: editingGoal.targetDate },
            editingRituals
        );
        setEditModalOpen(false);
        setEditingGoal(null);
        setEditingRituals([]);
    } catch (e) {
        const msg = handleApiError(e, 'updateGoal');
        showErrorToast('Failed to update vision', msg);
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const doDelete = () => {
      deleteGoal(goalId);
      setOptionsMenuId(null);
    };
    if (Platform.OS === 'web') {
        if (window.confirm("Are you sure you want to delete this vision?")) {
            doDelete();
        }
    } else {
        Alert.alert(
          'Delete Vision',
          'Are you sure you want to delete this vision? This cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: doDelete },
          ]
        );
    }
  };

  const handlePersonalize = async (useExisting: boolean) => {
    if (!activeGoalId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let imageUrl = user.selfieUrl || authUser?.photoURL;

    if (!useExisting) {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          base64: true,
        });

        if (result.canceled || !result.assets[0]) return;
        const asset = result.assets[0];
        imageUrl = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
      } catch (e) {
        const msg = handleApiError(e, 'pickImage');
        showErrorToast('Failed to pick image', msg);
        return;
      }
    }

    if (!imageUrl) return;

    setIsGenerating(true);
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Image generation timed out')), 90000)
      );
      await Promise.race([
        personalizeGoalImage(activeGoalId, imageUrl),
        timeoutPromise,
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalOpen(false);
    } catch (e: any) {
      if (e.message === 'INSUFFICIENT_ENERGY') {
        Alert.alert(
          "Insufficient Credits",
          "A Personalized Vision requires 3 Credits. Refill at the Store.",
          [
            { text: "Later", style: "cancel" },
            { text: "Go to Store", onPress: () => {
              setModalOpen(false);
              setScreen('STORE');
            }}
          ]
        );
      } else {
        const msg = handleApiError(e, 'personalizeGoal');
        showErrorToast('Image generation failed', msg);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const EmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <BlurView intensity={20} tint="dark" style={styles.emptyIconWrapper}>
        <Sparkles color="#F4E0B9" size={32} />
      </BlurView>
      <Text style={styles.emptyTitle}>Ready to begin?</Text>
      <Text style={styles.emptySubtitle}>
       Take the first step by adding your first manifestation goal.
      </Text>
      <TouchableOpacity
        onPress={() => setScreen('WIZARD')}
        style={styles.emptyBtn}
      >
        <Text style={styles.emptyBtnText}>Create Your Vision</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.kicker}>MY JOURNEY</Text>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Timeline</Text>
          </View>
        </View>

        {/* Timeline Content */}
        <View style={styles.timelineContainer}>
          {goals.length > 0 && <View style={styles.timelineLine} />}

          {goals.length === 0 ? <EmptyState /> : goals.map((goal) => {
            const date = new Date(goal.targetDate);
            const month = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();

            return (
              <View key={goal.id} style={styles.goalNode}>
                {/* Time Indicator */}
                <View style={styles.timeIndicator}>
                  <BlurView intensity={40} tint="dark" style={styles.timeIndicatorBlur} />
                  <Text style={styles.timeMonth}>{month}</Text>
                  <Text style={styles.timeYear}>{year}</Text>
                </View>

                {/* Card Container - Wrap in View to prevent sibling error if needed */}
                <View style={styles.card}>
                    <View style={styles.imageSection}>
                      {(goal.isLoadingImage || (isGenerating && activeGoalId === goal.id)) ? (
                        <View style={styles.placeholderContainer}>
                          <BlurView intensity={30} tint="dark" style={styles.placeholderBlur}>
                            <ActivityIndicator size="large" color="#F4E0B9" style={styles.placeholderSpinner} />
                            <Text style={styles.placeholderText}>GENERATING VISION...</Text>
                          </BlurView>
                        </View>
                      ) : goal.imageUrl ? (
                        <Image source={{ uri: goal.imageUrl }} style={styles.goalImage} />
                      ) : goal.imageError ? (
                        <View style={styles.placeholderContainer}>
                          <BlurView intensity={30} tint="dark" style={styles.placeholderBlur}>
                            <Sparkles size={32} color="#F4E0B9" style={{ marginBottom: 12, opacity: 0.5 }} />
                            <Text style={styles.placeholderText}>GENERATING VISION...</Text>
                            {/* <TouchableOpacity 
                                onPress={() => handleRegenerateImage(goal.id)}
                                style={styles.retryBtn}
                            >
                                <Text style={styles.retryBtnText}>RETRY VISION</Text>
                            </TouchableOpacity> */}
                          </BlurView>
                        </View>
                      ) : (
                        <View style={styles.placeholderContainer}>
                          <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop' }}
                            style={styles.goalImage}
                          />
                        </View>
                      )}

                      <View style={styles.imageOverlay} />

                      {/* Options Button */}
                      <TouchableOpacity 
                        style={styles.optionsBtn}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setOptionsMenuId(optionsMenuId === goal.id ? null : goal.id);
                        }}
                      >
                        <MoreVertical size={20} color="#fff" />
                      </TouchableOpacity>

                      {optionsMenuId === goal.id && (
                        <BlurView intensity={80} tint="dark" style={styles.optionsMenu}>
                            <TouchableOpacity 
                                style={styles.menuItem}
                                onPress={() => handleOpenEdit(goal)}
                            >
                                <Edit2 size={16} color="#F4E0B9" />
                                <Text style={styles.menuText}>Edit Goal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.menuItem, { borderBottomWidth: 0 }]}
                                onPress={() => handleDeleteGoal(goal.id)}
                            >
                                <Trash2 size={16} color="#F87171" />
                                <Text style={[styles.menuText, { color: '#F87171' }]}>Delete</Text>
                            </TouchableOpacity>
                        </BlurView>
                      )}

                      {goal.imageUrl && !goal.isLoadingImage && !(isGenerating && activeGoalId === goal.id) && (
                        <BlurView intensity={30} tint="dark" style={styles.regenerateBtnWrapper}>
                          <TouchableOpacity
                            onPress={() => handleRegenerateImage(goal.id)}
                            style={styles.regenerateBtn}
                          >
                            {goal.isRegeneratingImage ? (
                                <ActivityIndicator size="small" color="#F4E0B9" />
                            ) : (
                                <RefreshCw size={14} color="#ffffff" />
                            )}
                          </TouchableOpacity>
                        </BlurView>
                      )}

                      {(user.selfieUrl || authUser?.photoURL) && (
                        <View style={[styles.identityBadgeWrapper, { zIndex: 100 }]}>
                          <View style={styles.identityAvatar}>
                            <Image source={{ uri: user.selfieUrl || authUser?.photoURL || '' }} style={styles.fullImage} />
                          </View>
                          <BlurView intensity={20} tint="dark" style={styles.identityTextBlur}>
                            {/* <Text style={styles.identityLabel}>YOUR IDENTITY</Text> */}
                          </BlurView>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardDetails}>
                      <View style={styles.categoryRow}>
                        {goal.categories.map(cat => (
                          <View key={cat} style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{cat}</Text>
                          </View>
                        ))}
                      </View>

                      <Text style={styles.goalTitle}>{goal.title}</Text>

                      <Button variant="secondary" onPress={() => handleFeelItClick(goal.id)}>
                        <View style={styles.buttonContent}>
                          <Sparkles size={14} color="#F4E0B9" />
                          <Text style={styles.buttonText}>VISUALIZE YOURSELF</Text>
                        </View>
                      </Button>
                    </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Visualize Selection Modal */}
      <Modal visible={modalOpen} animationType="fade" transparent={true} statusBarTranslucent>
        <View style={styles.modalBg}>
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.modalContainer}>
            <TouchableOpacity
              onPress={() => { setModalOpen(false); setIsGenerating(false); }}
              style={styles.closeBtn}
            >
              <X size={20} color="#fff" />
            </TouchableOpacity>

            <BlurView intensity={20} tint="dark" style={styles.modalCard}>
              <View style={styles.modalContent}>
                {!isGenerating ? (
                  <>
                    <View style={styles.modalIconWrapper}>
                      <Sparkles size={32} color="#F4E0B9" />
                    </View>
                    <Text style={styles.modalTitle}>See Your Future</Text>
                    <Text style={styles.modalSubtitle}>
                      Choose a photo of yourself so we can bring your vision to life.
                    </Text>

                    <View style={styles.modalOptions}>
                        <TouchableOpacity
                          onPress={() => handlePersonalize(true)}
                          style={styles.optionCard}
                          activeOpacity={0.8}
                        >
                          <View style={styles.optionAvatar}>
                            <Image source={{ uri: user.selfieUrl || authUser?.photoURL || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1288&auto=format&fit=crop' }} style={styles.fullImage} />
                          </View>
                          <View style={styles.flex1}>
                            <Text style={styles.optionTitle}>Use Current Image</Text>
                          </View>
                          <ChevronRight size={18} color="#F4E0B9" />
                        </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handlePersonalize(false)}
                        style={styles.optionCardSecondary}
                        activeOpacity={0.8}
                      >
                        <View style={styles.optionIconBox}>
                          <Upload size={22} color="#F4E0B9" />
                        </View>
                        <View style={styles.flex1}>
                          <Text style={styles.optionTitleGold}>Upload New Image</Text>
                        </View>
                        <ChevronRight size={18} color="#F4E0B9" />
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View style={styles.generatingState}>
                    <View style={styles.genLoaderWrapper}>
                      {(user.selfieUrl || authUser?.photoURL) && <Image source={{ uri: user.selfieUrl || authUser?.photoURL || '' }} style={styles.genLoaderImage} />}
                      <View style={styles.genSpinnerOverlay}>
                        <ActivityIndicator size="large" color="#F4E0B9" />
                      </View>
                    </View>
                    <Text style={styles.genTitle}>Bringing vision to life...</Text>
                    <Text style={styles.genSubtitle}>
                      Creating a personalized image of your future self.
                    </Text>
                  </View>
                )}
              </View>
            </BlurView>
          </View>
        </View>
      </Modal>

      {/* Edit Modal - Enhanced with Keyboard Handling and Full Editing */}
      <Modal visible={editModalOpen} animationType="slide" transparent={true} statusBarTranslucent>
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalBg}>
                    <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.modalContainer}>
                        <BlurView intensity={20} tint="dark" style={[styles.modalCard, { maxHeight: height * 0.85 }]}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Update Your Vision</Text>
                                <TouchableOpacity onPress={() => setEditModalOpen(false)} style={styles.miniClose}>
                                    <X size={18} color="#fff" />
                                </TouchableOpacity>
                            </View>
                            
                            <ScrollView style={styles.editScroll} showsVerticalScrollIndicator={false}>
                                <View style={styles.editSection}>
                                    <View style={styles.editInputGroup}>
                                        <View style={styles.inputIcon}>
                                            <Type size={16} color="#F4E0B9" />
                                        </View>
                                        <View style={styles.flex1}>
                                            <Text style={styles.editLabel}>GOAL TITLE</Text>
                                            <TextInput 
                                                style={styles.editInput}
                                                value={editingGoal?.title}
                                                onChangeText={(t) => setEditingGoal(prev => prev ? { ...prev, title: t } : null)}
                                                placeholderTextColor="rgba(255,255,255,0.3)"
                                                multiline
                                            />
                                        </View>
                                    </View>

                                    <TouchableOpacity 
                                        style={styles.editInputGroup}
                                        onPress={() => setShowDatePicker(true)}
                                    >
                                        <View style={styles.inputIcon}>
                                            <CalendarIcon size={16} color="#F4E0B9" />
                                        </View>
                                        <View style={styles.flex1}>
                                            <Text style={styles.editLabel}>TARGET DATE</Text>
                                            <Text style={styles.dateDisplay}>
                                                {editingGoal ? new Date(editingGoal.targetDate).toLocaleDateString() : ''}
                                            </Text>
                                        </View>
                                        <Edit2 size={14} color="rgba(244, 224, 185, 0.5)" />
                                    </TouchableOpacity>

                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={editingGoal ? new Date(editingGoal.targetDate) : new Date()}
                                            mode="date"
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={(event, selectedDate) => {
                                                setShowDatePicker(false);
                                                if (selectedDate && editingGoal) {
                                                    setEditingGoal({ ...editingGoal, targetDate: selectedDate.toISOString() });
                                                }
                                            }}
                                            themeVariant="dark"
                                        />
                                    )}

                                    <View style={styles.targetsEditSection}>
                                        <View style={styles.sectionHeader}>
                                            <Text style={styles.sectionTitle}>Daily Targets</Text>
                                            <TouchableOpacity style={styles.addTargetBtn} onPress={handleAddRitualToEdit}>
                                                <Plus size={14} color="#050505" />
                                            </TouchableOpacity>
                                        </View>
                                        
                                        {editingRituals.map((ritual, idx) => (
                                            !ritual.deleted && (
                                                <View key={ritual.id || `new-${idx}`} style={styles.ritualInputRow}>
                                                    <TextInput 
                                                        style={styles.ritualInput}
                                                        value={ritual.title}
                                                        onChangeText={(t) => {
                                                            const next = [...editingRituals];
                                                            next[idx] = { ...next[idx], title: t };
                                                            setEditingRituals(next);
                                                        }}
                                                        placeholder="Set Targets..."
                                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                                    />
                                                    <TouchableOpacity onPress={() => handleRemoveRitualFromEdit(idx)} style={styles.removeRitualBtn}>
                                                        <Trash2 size={14} color="#F87171" />
                                                    </TouchableOpacity>
                                                </View>
                                            )
                                        ))}

                                        {editingRituals.filter(r => !r.deleted).length === 0 && (
                                            <Text style={styles.emptyTargetsText}>No targets added yet.</Text>
                                        )}
                                    </View>
                                </View>
                            </ScrollView>

                            <View style={styles.modalFooter}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalOpen(false)}>
                                    <Text style={styles.cancelBtnText}>Discard</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateGoal}>
                                    <Text style={styles.saveBtnText}>Update Vision</Text>
                                </TouchableOpacity>
                            </View>
                        </BlurView>
                    </View>
                </View>
            </TouchableWithoutFeedback>
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
    paddingBottom: 140,
    paddingTop: 64,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 40,
  },
  kicker: {
    fontSize: 10,
    color: '#F4E0B9',
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 8,
    opacity: 0.8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -1,
  },
  timelineContainer: {
    flex: 1,
    paddingTop: 8,
  },
  timelineLine: {
    position: 'absolute',
    left: 26,
    top: 24,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  goalNode: {
    position: 'relative',
    paddingLeft: 76,
    marginBottom: 48,
  },
  timeIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(244, 224, 185, 0.25)',
    backgroundColor: 'rgba(20, 20, 20, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    zIndex: 10,
  },
  timeIndicatorBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  timeMonth: {
    fontSize: 16,
    color: '#F4E0B9',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  timeYear: {
    fontSize: 10,
    color: 'rgba(244, 224, 185, 0.65)',
    fontWeight: '800',
    marginTop: 2,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  imageSection: {
    height: 240,
    width: '100%',
    backgroundColor: '#0A0A0A',
    position: 'relative',
  },
  goalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  placeholderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  placeholderBlur: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  placeholderSpinner: {
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 11,
    color: 'rgba(244, 224, 185, 0.75)',
    fontWeight: '900',
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  optionsBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    padding: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  optionsMenu: {
    position: 'absolute',
    top: 60,
    left: 16,
    width: 140,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 100,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  menuText: {
    color: '#F4E0B9',
    fontSize: 12,
    fontWeight: '700',
  },
  regenerateBtnWrapper: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  regenerateBtn: {
    padding: 10,
  },
  identityBadgeWrapper: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  identityAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(244, 224, 185, 0.4)',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  identityTextBlur: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  identityLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  cardDetails: {
    padding: 24,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: 'rgba(244, 224, 185, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(244, 224, 185, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F4E0B9',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  goalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
    marginBottom: 24,
    lineHeight: 30,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#F4E0B9',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
    overflow: 'hidden',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    maxWidth: 240,
    marginTop: 12,
    lineHeight: 22,
    fontWeight: '500',
  },
  emptyBtn: {
    marginTop: 32,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#F4E0B9',
    borderRadius: 16,
  },
  emptyBtnText: {
    color: '#050505',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 11,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 5, 0.85)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(15, 15, 15, 0.95)',
    overflow: 'hidden',
  },
  modalContent: {
    padding: 32,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 32,
    position: 'relative',
  },
  miniClose: {
     position: 'absolute',
     right: 24,
     top: 32,
     padding: 8,
     borderRadius: 20,
     backgroundColor: 'rgba(255,255,255,0.05)',
  },
  closeBtn: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    padding: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modalIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(244, 224, 185, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -1,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    fontWeight: '500',
  },
  modalOptions: {
    width: '100%',
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 16,
  },
  optionCardSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(244, 224, 185, 0.3)',
    gap: 16,
  },
  optionAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F4E0B9',
    overflow: 'hidden',
  },
  optionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(244, 224, 185, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex1: {
    flex: 1,
  },
  optionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  optionTitleGold: {
    color: '#F4E0B9',
    fontSize: 16,
    fontWeight: '700',
  },
  generatingState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  genLoaderWrapper: {
    width: 100,
    height: 100,
    marginBottom: 24,
    position: 'relative',
  },
  genLoaderImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    opacity: 0.5,
  },
  genSpinnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
  },
  genSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 20,
  },
  editScroll: {
    padding: 32,
  },
  editSection: {
    gap: 20,
  },
  editInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 14,
  },
  inputIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 224, 185, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editLabel: {
    fontSize: 10,
    color: '#F4E0B9',
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  editInput: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
    padding: 0,
  },
  dateDisplay: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '700',
  },
  targetsEditSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  addTargetBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F4E0B9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ritualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  ritualInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    padding: 0,
  },
  removeRitualBtn: {
    padding: 4,
  },
  emptyTargetsText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#F4E0B9',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#050505',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cancelBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '700',
  },
});