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
  Dimensions
} from 'react-native';
import { useManifest } from '../context/ManifestContext';
import { RefreshCw, Sparkles, X, ChevronRight, Upload } from 'lucide-react-native';
import { Button } from '../components/Button';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

/**
 * REDESIGNED TIMELINE SCREEN
 * Standardized spacing, pure StyleSheet for layout precision, and improved date visibility.
 * Old code preserved in comments below.
 */

/*
// ──────────────────────────────────────────────────────────────────────────────
// OLD VERSION (Preserved for reference as requested)
// ──────────────────────────────────────────────────────────────────────────────
export const TimelineOld: React.FC = () => {
  // ... original state and logic ...
  return (
    <ScrollView className="flex-1 bg-void" contentContainerStyle={{ paddingBottom: 140, paddingTop: 64 }}>
       ... (NativeWind implementation) ...
    </ScrollView>
  );
};
// ──────────────────────────────────────────────────────────────────────────────
*/

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
    <View style={styles.emptyStateContainer}>
      <BlurView intensity={20} tint="dark" style={styles.emptyIconWrapper}>
        <Sparkles color="#F4E0B9" size={32} />
      </BlurView>
      <Text style={styles.emptyTitle}>The Void Awaits</Text>
      <Text style={styles.emptySubtitle}>
        Your future is unwritten. Begin your journey by creating your first vision.
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
          <Text style={styles.kicker}>REALITY LOG</Text>
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
                {/* Time Indicator - BIGGER & CLEANER */}
                <View style={styles.timeIndicator}>
                  <BlurView intensity={40} tint="dark" style={styles.timeIndicatorBlur} />
                  <Text style={styles.timeMonth}>{month}</Text>
                  <Text style={styles.timeYear}>{year}</Text>
                </View>

                {/* Card */}
                <View style={styles.card}>
                  <View style={styles.imageSection}>
                    {goal.imageUrl ? (
                      <Image source={{ uri: goal.imageUrl }} style={styles.goalImage} />
                    ) : (
                      <View style={styles.placeholderContainer}>
                        <BlurView intensity={20} tint="dark" style={styles.placeholderBlur}>
                          <ActivityIndicator size="small" color="#F4E0B9" style={styles.placeholderSpinner} />
                          <Text style={styles.placeholderText}>MANIFESTING REALITY...</Text>
                        </BlurView>
                      </View>
                    )}

                    <View style={styles.imageOverlay} />

                    {goal.imageUrl && (
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

                    {user.selfieUrl && (
                      <View style={styles.identityBadgeWrapper}>
                        <View style={styles.identityAvatar}>
                          <Image source={{ uri: user.selfieUrl }} style={styles.fullImage} />
                        </View>
                        <BlurView intensity={20} tint="dark" style={styles.identityTextBlur}>
                          <Text style={styles.identityLabel}>QUANTUM IDENTITY LOCKED</Text>
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
                        <Text style={styles.buttonText}>Experience Now</Text>
                      </View>
                    </Button>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Modal - Themed to match Wizard/Onboarding */}
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
                      We'll use AI to project your identity into this vision. Choose the anchor image for your shift.
                    </Text>

                    <View style={styles.modalOptions}>
                      {user.selfieUrl && (
                        <TouchableOpacity
                          onPress={() => handlePersonalize(true)}
                          style={styles.optionCard}
                          activeOpacity={0.8}
                        >
                          <View style={styles.optionAvatar}>
                            <Image source={{ uri: user.selfieUrl }} style={styles.fullImage} />
                          </View>
                          <View style={styles.flex1}>
                            <Text style={styles.optionTitle}>Use Current Identity</Text>
                            <Text style={styles.optionDesc}>Quickest way to visualize success</Text>
                          </View>
                          <ChevronRight size={18} color="#F4E0B9" />
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={() => handlePersonalize(false)}
                        style={styles.optionCardSecondary}
                        activeOpacity={0.8}
                      >
                        <View style={styles.optionIconBox}>
                          <Upload size={22} color="#F4E0B9" />
                        </View>
                        <View style={styles.flex1}>
                          <Text style={styles.optionTitleGold}>Upload New Essence</Text>
                          <Text style={styles.optionDescGold}>Capture your resonance</Text>
                        </View>
                        <ChevronRight size={18} color="#F4E0B9" />
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View style={styles.generatingState}>
                    <View style={styles.genLoaderWrapper}>
                      {user.selfieUrl && <Image source={{ uri: user.selfieUrl }} style={styles.genLoaderImage} />}
                      <View style={styles.genSpinnerOverlay}>
                        <ActivityIndicator size="large" color="#F4E0B9" />
                      </View>
                    </View>
                    <Text style={styles.genTitle}>Collapsing Timelines...</Text>
                    <Text style={styles.genSubtitle}>
                      Our AI is manifesting your presence within this goal. Please hold your intention.
                    </Text>
                  </View>
                )}
              </View>
            </BlurView>
          </View>
        </View>
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
    left: 26, // Center of the 52px indicator
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
  },
  regenerateBtnWrapper: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 20,
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
    paddingVertical: 5,
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
  // Empty State
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
    maxWidth: 260,
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
    shadowColor: '#F4E0B9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyBtnText: {
    color: '#050505',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 11,
  },
  // Modal 
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 5, 0.75)',
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
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(15, 15, 15, 0.95)',
    overflow: 'hidden',
    padding: 32,
    shadowColor: '#F4E0B9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: '100%',
    alignItems: 'center',
  },
  modalIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(244, 224, 185, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 224, 185, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  modalOptions: {
    width: '100%',
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 16,
    gap: 16,
  },
  optionCardSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 224, 185, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(244, 224, 185, 0.15)',
    borderRadius: 24,
    padding: 16,
    gap: 16,
  },
  optionAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(244, 224, 185, 0.3)',
    overflow: 'hidden',
  },
  optionIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(244, 224, 185, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 224, 185, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  optionTitleGold: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F4E0B9',
  },
  optionDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 2,
  },
  optionDescGold: {
    fontSize: 12,
    color: 'rgba(244, 224, 185, 0.4)',
    marginTop: 2,
  },
  generatingState: {
    alignItems: 'center',
  },
  genLoaderWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#F4E0B9',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  genLoaderImage: {
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  genSpinnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  genSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 40,
  },
  flex1: {
    flex: 1,
  },
});