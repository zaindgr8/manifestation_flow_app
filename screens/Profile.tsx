import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator, Alert } from 'react-native';
import { useManifest } from '../context/ManifestContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Camera, Upload, LogOut, ChevronLeft, User as UserIcon, Shield, Bell, Heart, ShieldCheck, Sparkles, CreditCard, Zap } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Gender } from '../types';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { auth } from '../services/firebase';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

export const ProfileScreen: React.FC = () => {
    const { user, updateUser, setScreen, logout, isGuestMode, purchasePro, purchaseCredits } = useManifest();
    const [name, setName] = useState(user.name);
    const [gender, setGender] = useState<Gender | ''>(user.gender || '');
    const [dob, setDob] = useState(user.dob || '');
    const [selfie, setSelfie] = useState<string | null>(user.selfieUrl);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        if (user.name !== name) setName(user.name);
        if (user.gender !== gender) setGender(user.gender || '');
        if (user.dob !== dob) setDob(user.dob || '');
        if (user.selfieUrl !== selfie) setSelfie(user.selfieUrl);
    }, [user]);

    const handleSave = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsSaving(true);
        try {
            await updateUser({
                name,
                gender: gender as Gender,
                dob,
                selfieUrl: selfie
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Your quantum identity has been updated.');
        } catch (e) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'Failed to update profile.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        Alert.alert(
            "Close Portal",
            isGuestMode
                ? "Are you sure? Your temporary guest progress will be permanently lost."
                : "Are you sure you want to logout? Your progress is safe.",
            [
                { text: "Stay", style: "cancel" },
                {
                    text: isGuestMode ? "Delete & Logout" : "Logout",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await logout();
                        } catch (e) {
                            console.error("Logout failed", e);
                        }
                    }
                }
            ]
        );
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
            const uri = result.assets[0].uri;
            // Show the image immediately in the UI (optimistic)
            setSelfie(uri);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Auto-save: upload to Firebase Storage right away so image persists
            // even if the user navigates away without tapping "Synchronize Identity".
            setIsUploadingImage(true);
            try {
                await updateUser({ selfieUrl: uri });
            } catch (e) {
                console.error('Auto-save of profile image failed:', e);
            } finally {
                setIsUploadingImage(false);
            }
        }
    };

    const handleUpgrade = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setScreen('STORE');
    };

    const handleTopUp = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setScreen('STORE');
    };

    return (
        <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 100, paddingTop: 64 }}
            className="bg-void"
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View className="px-6 mb-10">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setScreen('TIMELINE');
                        }}
                        style={{ transform: [{ translateX: -8 }] }}
                        className="w-12 h-12 bg-surface/50 rounded-[16px] border border-white/10 items-center justify-center active:scale-95 transition-transform"
                    >
                        <ChevronLeft size={24} color="#F4E0B9" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-black text-white tracking-tighter">MY PROFILE</Text>
                    <TouchableOpacity
                        onPress={handleLogout}
                        style={{ transform: [{ translateX: -8 }] }}
                        className="w-12 h-12 bg-red-500/10 rounded-[16px] border border-red-500/20 items-center justify-center active:scale-95 transition-transform"
                    >
                        <LogOut size={20} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Profile Image Section */}
            <View className="items-center px-6 mb-10">
                <View className="relative">
                    <View className="w-32 h-32 rounded-full border-2 border-gold/30 items-center justify-center overflow-hidden bg-surface/30 shadow-2xl shadow-gold/20">
                        {selfie ? (
                            <Image source={{ uri: selfie }} className="w-full h-full" />
                        ) : (
                            <UserIcon size={48} color="#F4E0B9" opacity={0.3} />
                        )}
                        {isUploadingImage && (
                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                                <ActivityIndicator color="#F4E0B9" />
                            </View>
                        )}
                    </View>
                    <TouchableOpacity
                        onPress={pickImage}
                        className="absolute bottom-0 right-0 bg-gold w-10 h-10 rounded-full items-center justify-center border-4 border-void shadow-lg active:scale-90"
                    >
                        <Camera size={16} color="#050505" />
                    </TouchableOpacity>
                </View>
                <View className="mt-6 items-center">
                    <Text className="text-2xl font-black text-white tracking-tighter">{name || 'Seeker'}</Text>
                    <View className="flex-row items-center gap-2 mt-1">
                        <Sparkles size={12} color="#F4E0B9" />
                        <Text className="text-[11px] text-gold/80 font-bold uppercase tracking-[2px]">Frequency Aligned</Text>
                    </View>
                </View>
            </View>

            {/* Subscription & Credits Card */}
            <View className="px-6 mb-8">
                <View className="bg-surface/30 border border-gold/30 rounded-[24px] p-6 relative overflow-hidden">
                    <View className="absolute top-0 right-0 p-4 opacity-10">
                        <Zap size={80} color="#F4E0B9" />
                    </View>

                    <View className="flex-row justify-between items-start mb-6">
                        <View>
                            <Text className="text-[11px] text-gold font-bold uppercase tracking-[2px] mb-1">Current Plan</Text>
                            <Text className="text-2xl font-black text-white">{user.subscription?.plan === 'PRO' ? 'MANIFESTOR PRO' : 'AWAKENED (Free)'}</Text>
                        </View>
                        {user.subscription?.plan === 'FREE' && (
                            <TouchableOpacity onPress={handleUpgrade} className="bg-gold px-3 py-1.5 rounded-full">
                                <Text className="text-[10px] font-black text-void uppercase">Upgrade</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity 
                        activeOpacity={0.8}
                        onPress={() => setScreen('STORE')}
                        className="flex-row items-center gap-4 bg-void/40 p-4 rounded-[16px] border border-white/5"
                    >
                        <View className="w-10 h-10 rounded-full bg-gold/10 items-center justify-center">
                            <Zap size={20} color="#F4E0B9" fill="#F4E0B9" />
                        </View>
                        <View>
                            <Text className="text-white font-bold text-lg">{user.credits?.balance || 0} Credits</Text>
                            <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Tap to refill</Text>
                        </View>
                        <View className="ml-auto bg-white/10 px-3 py-2 rounded-lg">
                            <Text className="text-[10px] font-black text-gold uppercase">STORE</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Form Section */}
            <View className="px-6 gap-6">
                <View className="bg-surface/20 p-6 rounded-[24px] border border-white/5 shadow-xl">
                    <Input
                        label="User Name"
                        value={name}
                        onChangeText={setName}
                        placeholder="Your name in this timeline"
                    />

                    <View className="mt-2">
                        <Text className="text-[11px] text-gold font-bold ml-1 uppercase tracking-[2px] mb-3">Gender</Text>
                        <View className="bg-void/50 border border-white/10 rounded-[16px] flex-row overflow-hidden p-1.5">
                            {['Male', 'Female', 'Non-Binary'].map((g) => (
                                <TouchableOpacity
                                    key={g}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setGender(g as Gender);
                                    }}
                                    className={`flex-1 py-3 items-center justify-center rounded-[12px] ${gender === g ? 'bg-gold shadow-lg shadow-gold/20' : ''}`}
                                >
                                    <Text className={`text-[11px] font-black uppercase tracking-widest ${gender === g ? 'text-void' : 'text-gray-500'}`}>{g}</Text>
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
                        className="mt-6"
                    >
                        <View pointerEvents="none">
                            <Input
                                label="Date Of Birth"
                                value={dob}
                                editable={false}
                                placeholder="Select Earthly Entry Date"
                            />
                        </View>
                    </TouchableOpacity>
                </View>

                {showDatePicker && (
                    <View className="bg-surface/90 rounded-3xl p-4 border border-white/5">
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
                            <Button variant="secondary" onPress={() => setShowDatePicker(false)}>Confirm Date</Button>
                        )}
                    </View>
                )}

                <View className="mt-4">
                    <Button loading={isSaving} onPress={handleSave}>SAVE CHANGES</Button>
                </View>

                {/* Footer Badges */}
                <View className="flex-row justify-center gap-8 pt-6">
                    <View className="items-center opacity-70">
                        <ShieldCheck size={20} color="#F4E0B9" />
                        <Text className="text-xs text-gray-400 font-bold uppercase mt-2">Encrypted</Text>
                    </View>
                    <View className="items-center opacity-70">
                        <Sparkles size={20} color="#F4E0B9" />
                        <Text className="text-xs text-gray-400 font-bold uppercase mt-2">Personalized</Text>
                    </View>
                </View>
            </View>

            <View className="mt-10 mb-8">
                <Text className="text-center text-gray-400 text-xs font-bold uppercase tracking-[4px]">ManifestFlow v1.0.0-PRO</Text>
            </View>
        </ScrollView>
    );
};
