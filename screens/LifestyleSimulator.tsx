import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform
} from 'react-native';
import { useManifest } from '../context/ManifestContext';
import { Button } from '../components/Button';
import { generateLifestyleSimulation, generateLifestyleSuggestions } from '../services/geminiService';
import {
  Wand2,
  Camera,
  Upload,
  Sparkles,
  History,
  RefreshCw,
  ChevronRight,
  Lightbulb,
  X
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

/**
 * REDESIGNED REALITY SHIFTER (LIFESTYLE SIMULATOR)
 * Standardized spacing, pure StyleSheet for layout precision, and premium aesthetic.
 * Old code preserved in comments below.
 */

/*
// ──────────────────────────────────────────────────────────────────────────────
// OLD VERSION (Preserved for reference)
// ──────────────────────────────────────────────────────────────────────────────
export const LifestyleSimulatorOld: React.FC = () => {
  // ... (Previous NativeWind implementation) ...
  return (
    <ScrollView className="flex-1 bg-void" contentContainerStyle={{ paddingBottom: 140, paddingTop: 64 }}>
       ...
    </ScrollView>
  );
};
// ──────────────────────────────────────────────────────────────────────────────
*/

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
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerIconWrapper}>
            <Wand2 size={24} color="#F4E0B9" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Reality Shifter</Text>
            <Text style={styles.headerKicker}>COLLAPSE THE TIMELINE</Text>
          </View>
        </View>

        <View style={styles.mainContent}>
          {/* Result Preview */}
          {generatedResult && (
            <View style={styles.resultCard}>
              <BlurView intensity={40} tint="dark" style={styles.resultBlur}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultTitle}>Your New Timeline</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setGeneratedResult(null);
                    }}
                    style={styles.resetBtn}
                  >
                    <Text style={styles.resetBtnText}>RESET PORTAL</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.resultImageWrapper}>
                  <Image source={{ uri: generatedResult! }} style={styles.fullImage} />
                </View>

                <View style={styles.resultPromptBox}>
                  <Text style={styles.resultPromptLabel}>MANIFESTED INTENT</Text>
                  <Text style={styles.resultPromptText}>"{description}"</Text>
                </View>
              </BlurView>
            </View>
          )}

          {/* Input Controls */}
          <View style={[styles.controlsContainer, generatedResult && styles.controlsDisabled]}>
            {/* Identity Anchor Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionLabelWrapper}>
                  <View style={styles.goldDot} />
                  <Text style={styles.sectionLabel}>IDENTITY ANCHOR</Text>
                </View>
                <TouchableOpacity onPress={pickImage} style={styles.uploadBtn}>
                  <Upload size={14} color="#F4E0B9" />
                </TouchableOpacity>
              </View>

              <View style={styles.anchorRow}>
                <View style={styles.anchorImageWrapper}>
                  {currentImage ? (
                    <Image source={{ uri: currentImage }} style={styles.fullImage} />
                  ) : (
                    <Camera size={32} color="#F4E0B9" opacity={0.3} />
                  )}
                </View>
                <View style={styles.anchorTextWrapper}>
                  <Text style={styles.anchorDesc}>
                    We use this image to project your quantum identity into the target timeline.
                  </Text>
                </View>
              </View>
            </View>

            {/* Reality Description Section */}
            <View style={styles.realitySection}>
              <View style={styles.sectionLabelWrapperSmall}>
                <View style={styles.goldDot} />
                <Text style={styles.sectionLabel}>DESCRIBE YOUR REALITY</Text>
              </View>

              <View style={styles.inputCard}>
                <TextInput
                  multiline
                  numberOfLines={4}
                  style={styles.textInput}
                  placeholder="e.g. Sitting on the deck of a yacht in the Mediterranean..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={description}
                  onChangeText={setDescription}
                  selectionColor="#F4E0B9"
                  textAlignVertical="top"
                />

                <View style={styles.inputFooter}>
                  <View style={styles.suggestionLabelWrapper}>
                    <Lightbulb size={16} color="#F4E0B9" />
                    <Text style={styles.suggestionLabelText}>QUANTUM SUGGESTIONS</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      fetchSuggestions();
                    }}
                    disabled={loadingSuggestions}
                    style={styles.refreshBtn}
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
              <View style={styles.suggestionsContainer}>
                {suggestions.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setDescription(s);
                    }}
                    style={styles.suggestionPill}
                  >
                    <Text style={styles.suggestionPillText}>{s}</Text>
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
            <View style={styles.historySection}>
              <View style={styles.historyHeader}>
                <View style={styles.historyTitleWrapper}>
                  <History size={18} color="#9CA3AF" />
                  <Text style={styles.historyTitle}>PREVIOUS SHIFTS</Text>
                </View>
                <Text style={styles.historyCount}>{lifestyleHistory.length} ENTRIES</Text>
              </View>

              <View style={styles.historyGrid}>
                {lifestyleHistory.map(shift => (
                  <TouchableOpacity
                    key={shift.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setGeneratedResult(shift.imageUrl);
                      setDescription(shift.prompt);
                    }}
                    style={styles.historyItem}
                  >
                    <Image source={{ uri: shift.imageUrl }} style={styles.fullImage} />
                    <BlurView intensity={20} tint="dark" style={styles.historyItemLabel}>
                      <Text style={styles.historyItemText} numberOfLines={1}>{shift.prompt}</Text>
                    </BlurView>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 40,
    gap: 16,
  },
  headerIconWrapper: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(244, 224, 185, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -2,
  },
  headerKicker: {
    fontSize: 10,
    color: '#F4E0B9',
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 2,
    opacity: 0.7,
  },
  mainContent: {
    paddingHorizontal: 24,
  },
  resultCard: {
    marginBottom: 40,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(244, 224, 185, 0.3)',
    backgroundColor: 'rgba(15, 15, 15, 0.5)',
  },
  resultBlur: {
    padding: 24,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  resetBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resetBtnText: {
    color: '#F4E0B9',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  resultImageWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0A0A0A',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  fullImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  resultPromptBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  resultPromptLabel: {
    fontSize: 9,
    color: '#F4E0B9',
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
    opacity: 0.8,
  },
  resultPromptText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  controlsContainer: {
    opacity: 1, // Optional: keeping it clean
  },
  controlsDisabled: {
    opacity: 0.4,
    transform: [{ scale: 0.98 }],
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 28,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionLabelWrapperSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  goldDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F4E0B9',
    shadowColor: '#F4E0B9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  sectionLabel: {
    fontSize: 10,
    color: '#F4E0B9',
    fontWeight: '800',
    letterSpacing: 2,
  },
  uploadBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  anchorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  anchorImageWrapper: {
    width: 88,
    height: 88,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(244, 224, 185, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  anchorTextWrapper: {
    flex: 1,
  },
  anchorDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 20,
    fontWeight: '500',
  },
  realitySection: {
    marginBottom: 40,
  },
  inputCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 20,
  },
  textInput: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '700',
    minHeight: 120,
    lineHeight: 28,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  suggestionLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  suggestionLabelText: {
    fontSize: 10,
    color: '#F4E0B9',
    fontWeight: '800',
    letterSpacing: 1.5,
    opacity: 0.9,
  },
  refreshBtn: {
    padding: 8,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  suggestionPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  suggestionPillText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  historySection: {
    marginTop: 60,
    paddingTop: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  historyTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 2,
  },
  historyCount: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '800',
    letterSpacing: 1,
  },
  historyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  historyItem: {
    width: (width - 48 - 16) / 2,
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0A0A0A',
  },
  historyItemLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  historyItemText: {
    fontSize: 9,
    color: '#FFF',
    fontWeight: '700',
  },
});
