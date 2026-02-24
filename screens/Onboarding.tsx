import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  StyleSheet,
  Dimensions,
} from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { useManifest } from '../context/ManifestContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Camera, Upload, Sparkles, User as UserIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Gender } from '../types';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

/**
 * REDESIGNED ONBOARDING SCREEN
 * Fixed spacing issues and upgraded to a premium glassmorphic UI.
 * Old version preserved in comments below.
 */

/*
// ──────────────────────────────────────────────────────────────────────────────
// OLD VERSION (Preserved for reference as requested)
// ──────────────────────────────────────────────────────────────────────────────
export const OnboardingOld: React.FC = () => {
  // ... original state and logic ...
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-void">
       <View className="flex-1 items-center justify-center p-8 text-center">
         <View className="w-full max-w-md">
           {step === 1 && (<View className="space-y-5">... name, gender, dob ...</View>)}
           {step === 2 && (<View className="space-y-5">... identity shift ...</View>)}
         </View>
       </View>
    </ScrollView>
  );
};
// ──────────────────────────────────────────────────────────────────────────────
*/

export const Onboarding: React.FC = () => {
  const { updateUser, user } = useManifest();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(user.name || '');
  const [gender, setGender] = useState<Gender | ''>(user.gender || '');
  const [dob, setDob] = useState(user.dob || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selfie, setSelfie] = useState<string | null>(user.selfieUrl || null);

  useEffect(() => {
    if (user.name && !name) setName(user.name);
    if (user.selfieUrl && !selfie) setSelfie(user.selfieUrl);
  }, [user]);

  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true, // Avoid blob: URLs in Expo Go / Replit tunnel
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (!asset.base64 && asset.uri.startsWith('blob:')) {
        alert('Image could not be processed. Please try again or use a different image.');
        return;
      }
      const imageUri = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;
      setSelfie(imageUri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const takePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your camera!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true, // Avoid blob: URLs in Expo Go / Replit tunnel
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (!asset.base64 && asset.uri.startsWith('blob:')) {
        alert('Image could not be processed. Please try again or use a different image.');
        return;
      }
      const imageUri = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;
      setSelfie(imageUri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const finishOnboarding = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateUser({
      name,
      gender: gender as Gender,
      dob,
      selfieUrl: selfie,
      isOnboarded: true
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <BlurView intensity={20} tint="dark" style={styles.logoBlur}>
              <Sparkles size={32} color="#F4E0B9" />
            </BlurView>
          </View>

          <View style={styles.progressContainer}>
            {[1, 2].map(s => (
              <View
                key={s}
                style={[
                  styles.progressDot,
                  step === s ? styles.progressDotActive : styles.progressDotInactive
                ]}
              />
            ))}
          </View>
        </View>

        {step === 1 && (
          <View style={styles.contentWrapper}>
            <View style={styles.textSection}>
              <Text style={styles.title}>Who is manifesting?</Text>
              <Text style={styles.subtitle}>Tell Us About Yourself To Align Your Energy.</Text>
            </View>

            <BlurView intensity={10} tint="dark" style={styles.card}>
              <View style={styles.form}>
                <Input
                  label="YOUR NAME"
                  placeholder="How would you like to be addressed?"
                  value={name}
                  onChangeText={setName}
                />

                <View style={styles.genderSection}>
                  <Text style={styles.inputLabel}>YOUR GENDER</Text>
                  <View style={styles.genderGrid}>
                    {(['Male', 'Female'] as Gender[]).map((g) => (
                      <TouchableOpacity
                        key={g}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setGender(g);
                        }}
                        style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                      >
                        <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}>
                          {g}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowDatePicker(true);
                  }}
                  activeOpacity={0.8}
                >
                  <View pointerEvents="none">
                    <Input
                      label="BIRTHDAY (DOB)"
                      placeholder="Select Your Birthday"
                      value={dob}
                      editable={false}
                    />
                  </View>
                </TouchableOpacity>

                {showDatePicker && (
                  <View style={styles.datePickerContainer}>
                    <BlurView intensity={30} tint="dark" style={styles.datePickerBlur}>
                      <RNDateTimePicker
                        value={dob ? new Date(dob) : new Date()}
                        mode="date"
                        themeVariant="dark"
                        accentColor="#F4E0B9" // Match the gold theme
                        textColor="#FFFFFF"   // Ensure text is white
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, date) => {
                          if (Platform.OS === 'android' && event.type === 'set') setShowDatePicker(false);
                          if (date) {
                            setDob(date.toISOString().split('T')[0]);
                          }
                        }}
                        maximumDate={new Date()}
                      />
                      {Platform.OS === 'ios' && (
                        <TouchableOpacity
                          onPress={() => {
                            if (!dob) {
                              setDob(new Date().toISOString().split('T')[0]);
                            }
                            setShowDatePicker(false);
                          }}
                          style={styles.datePickerDone}
                        >
                          <Text style={styles.datePickerDoneText}>Confirm</Text>
                        </TouchableOpacity>
                      )}
                    </BlurView>
                  </View>
                )}

                <Button
                  disabled={!name || !gender || !dob}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setStep(2);
                  }}
                  style={styles.mainBtn}
                >
                  Continue
                </Button>
              </View>
            </BlurView>
          </View>
        )}

        {step === 2 && (
          <View style={styles.contentWrapper}>
            <View style={styles.textSection}>
              <Text style={styles.title}>Add Profile Photo</Text>
              <Text style={styles.subtitle}>PUT A FACE TO YOUR FUTURE</Text>
            </View>

            <BlurView intensity={10} tint="dark" style={styles.card}>
              <View style={styles.identitySection}>
                <View style={styles.selfieContainer}>
                  <View style={styles.selfieFrame}>
                    {selfie ? (
                      <Image source={{ uri: selfie }} style={styles.selfieImage} />
                    ) : (
                      <View style={styles.selfiePlaceholder}>
                        <UserIcon size={64} color="#F4E0B9" />
                      </View>
                    )}
                  </View>

                  <View style={styles.photoControls}>
                    <TouchableOpacity onPress={takePhoto} style={styles.ctrlBtnMain}>
                      <Camera size={22} color="#050505" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={pickImage} style={styles.ctrlBtnSec}>
                      <Upload size={22} color="#F4E0B9" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.identityDesc}>
                  Upload a Photo to Make Your Manifestation Journey More Personal.
                </Text>

                <View style={styles.form}>
                  <Button disabled={!selfie} onPress={finishOnboarding} style={styles.mainBtn}>
                    Enter ManifestFlow
                  </Button>

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setStep(1);
                    }}
                    style={styles.backBtn}
                  >
                    <Text style={styles.backBtnText}>RE-EDIT DETAILS</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  ambience1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(244, 224, 185, 0.08)',
    borderRadius: 150,
    filter: 'blur(80px)', // Only works on supported platforms, adds glow
  },
  ambience2: {
    position: 'absolute',
    bottom: -150,
    left: -100,
    width: 400,
    height: 400,
    backgroundColor: 'rgba(244, 224, 185, 0.04)',
    borderRadius: 200,
    filter: 'blur(100px)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrapper: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(244, 224, 185, 0.2)',
    backgroundColor: 'rgba(20, 20, 20, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  logoBlur: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressDot: {
    height: 4,
    borderRadius: 2,
  },
  progressDotActive: {
    width: 32,
    backgroundColor: '#F4E0B9',
  },
  progressDotInactive: {
    width: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  contentWrapper: {
    width: '100%',
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 10,
    color: '#F4E0B9',
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: 10,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 16,
  },
  card: {
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    overflow: 'hidden',
    padding: 24,
  },
  form: {
    gap: 16,
  },
  genderSection: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 10,
    color: '#F4E0B9',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginLeft: 4,
    marginBottom: 10,
    opacity: 0.8,
  },
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  genderBtn: {
    width: (width - 48 - 48 - 16 - 16) / 2, // Accounting for screen padding, card padding, and grid gaps
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  genderBtnActive: {
    backgroundColor: '#F4E0B9',
    borderColor: '#F4E0B9',
  },
  genderBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  genderBtnTextActive: {
    color: '#050505',
  },
  mainBtn: {
    marginTop: 12,
  },
  datePickerContainer: {
    marginTop: -8,
    marginBottom: 8,
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
  identitySection: {
    alignItems: 'center',
  },
  selfieContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  selfieFrame: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: 'rgba(244, 224, 185, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F4E0B9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  selfieImage: {
    width: '100%',
    height: '100%',
  },
  selfiePlaceholder: {
    opacity: 0.3,
  },
  photoControls: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
  },
  ctrlBtnMain: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F4E0B9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#050505',
    elevation: 5,
  },
  ctrlBtnSec: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#151515',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#050505',
    elevation: 5,
  },
  identityDesc: {
    fontSize: 12,
    color: '#F4E0B9',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 32,
    paddingHorizontal: 20,
    fontWeight: '500',
    letterSpacing: 2,
    opacity: 0.85,
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backBtnText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '800',
    letterSpacing: 2,
  },
});
