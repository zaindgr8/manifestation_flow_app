import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Platform, ImageBackground } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { useManifest } from '../context/ManifestContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Camera, Upload, Sparkles, X, Aperture, ChevronRight, User as UserIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Gender } from '../types';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

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
    });

    if (!result.canceled) {
      setSelfie(result.assets[0].uri);
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
    });

    if (!result.canceled) {
      setSelfie(result.assets[0].uri);
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
    <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }} 
        className="bg-void"
        showsVerticalScrollIndicator={false}
    >
      <View className="flex-1 items-center justify-center p-8 text-center">
        {/* Ambient background blur */}
        <View className="absolute top-[-50px] right-[-50px] w-80 h-80 bg-gold/10 rounded-full blur-[100px]"></View>
        <View className="absolute bottom-[-100px] left-[-50px] w-96 h-96 bg-gold/5 rounded-full blur-[120px]"></View>

        <View className="w-full max-w-md">
          <View className="items-center mb-12">
            <View className="w-16 h-16 rounded-[20px] bg-surface border border-gold/20 items-center justify-center shadow-2xl shadow-gold/20 mb-4">
                <Sparkles size={32} color="#F4E0B9" />
            </View>
            <View className="flex-row items-center gap-1.5">
                {[1, 2].map(s => (
                    <View key={s} className={`h-1 rounded-full ${step === s ? 'w-8 bg-gold' : 'w-2 bg-white/10'}`} />
                ))}
            </View>
          </View>

          {step === 1 && (
            <View className="space-y-10">
              <View>
                <Text className="text-4xl font-black text-white text-center tracking-tighter">Who is manifesting?</Text>
                <Text className="text-gold/40 text-[10px] font-black uppercase tracking-[3px] text-center mt-3 leading-relaxed">Tailor the quantum fields to your presence</Text>
              </View>
              
              <View className="space-y-6">
                <Input 
                    label="YOUR IDENTITY"
                    placeholder="E.g. Seeker of Truth" 
                    value={name} 
                    onChangeText={setName}
                />

                <View className="space-y-3">
                    <Text className="text-[10px] text-gold/60 font-black ml-1 uppercase tracking-widest">Quantum Gender</Text>
                    <View className="bg-surface/30 border border-white/5 rounded-2xl flex-row flex-wrap p-1">
                        {['Male', 'Female', 'Non-Binary', 'Other'].map((g) => (
                            <TouchableOpacity 
                                key={g}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setGender(g as Gender);
                                }}
                                className={`w-1/2 p-1`}
                            >
                                <View className={`py-3.5 items-center justify-center rounded-xl border ${gender === g ? 'bg-gold border-gold' : 'bg-transparent border-transparent'}`}>
                                    <Text className={`text-[10px] font-black uppercase tracking-widest ${gender === g ? 'text-void' : 'text-gray-500'}`}>{g}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity 
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowDatePicker(true);
                    }}
                    activeOpacity={0.7}
                >
                    <View pointerEvents="none">
                      <Input 
                        label="Earthly Entry (DOB)"
                        placeholder="Select Portal Date"
                        value={dob}
                        editable={false}
                      />
                    </View>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <BlurView intensity={20} tint="dark" className="rounded-[32px] overflow-hidden border border-white/5 p-4">
                    <RNDateTimePicker
                      value={dob ? new Date(dob) : new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, date) => {
                        if (Platform.OS === 'android') setShowDatePicker(false);
                        if (date) {
                          setDob(date.toISOString().split('T')[0]);
                        }
                      }}
                      maximumDate={new Date()}
                    />
                    {Platform.OS === 'ios' && (
                       <Button variant="secondary" onPress={() => setShowDatePicker(false)}>Confirm Alignment</Button>
                    )}
                </BlurView>
              )}

              <Button 
                disabled={!name || !gender || !dob} 
                onPress={() => {
                   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                   setStep(2);
                }}
              >
                Continue Alignment
              </Button>
            </View>
          )}

          {step === 2 && (
            <View className="space-y-10">
              <View>
                <Text className="text-4xl font-black text-white text-center tracking-tighter">The Identity Shift</Text>
                <Text className="text-gold/40 text-[10px] font-black uppercase tracking-[3px] text-center mt-3 leading-relaxed">Capture your quantum essence</Text>
              </View>
              
              <View className="items-center">
                <View className="relative">
                    <View className="w-56 h-56 rounded-full border-2 border-gold/20 items-center justify-center overflow-hidden bg-surface/30 shadow-2xl shadow-gold/20">
                      {selfie ? (
                        <Image source={{ uri: selfie }} className="w-full h-full" />
                      ) : (
                        <View className="items-center opacity-20">
                          <UserIcon size={64} color="#F4E0B9" />
                        </View>
                      )}
                    </View>
                    <View className="absolute -bottom-2 -right-2 flex-row gap-2">
                         <TouchableOpacity 
                          onPress={takePhoto}
                          className="w-14 h-14 bg-gold rounded-full items-center justify-center border-4 border-void shadow-xl"
                       >
                          <Camera size={20} color="#050505" /> 
                       </TouchableOpacity>
                       <TouchableOpacity 
                          onPress={pickImage}
                          className="w-14 h-14 bg-surface rounded-full items-center justify-center border-4 border-void shadow-xl border-white/5"
                       >
                          <Upload size={20} color="#F4E0B9" /> 
                       </TouchableOpacity>
                    </View>
                </View>
                <Text className="text-xs text-gray-500 text-center mt-12 px-8 leading-relaxed italic">
                    We use your physical manifestation to project your highest self into the timeline.
                </Text>
              </View>

              <View className="space-y-4">
                <Button disabled={!selfie} onPress={finishOnboarding}>
                   Enter ManifestFlow
                </Button>
                
                <TouchableOpacity 
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setStep(1);
                    }} 
                    className="py-4"
                >
                    <Text className="text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center">Re-Align Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};
