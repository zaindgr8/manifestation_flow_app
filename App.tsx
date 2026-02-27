import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ManifestProvider, useManifest } from './context/ManifestContext';
import { Onboarding } from './screens/Onboarding';
import { VisionWizard } from './screens/VisionWizard';
import { Timeline } from './screens/Timeline';
import { DailyAligner } from './screens/DailyAligner';
import { LifestyleSimulator } from './screens/LifestyleSimulator';
import { AuthScreen } from './screens/Auth';
import { ProfileScreen } from './screens/Profile';
import { StoreScreen } from './screens/Store';
import { LayoutDashboard, Calendar, Wand2, Loader2, User } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { requestNotificationPermissions } from './services/notificationService';
import { ErrorBoundary } from './components/ErrorBoundary';

import Purchases, { LOG_LEVEL } from 'react-native-purchases';

const AppContent = () => {
    useEffect(() => {
        // RevenueCat Initialization
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
            try {
                Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
                const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
                if (apiKey) {
                    Purchases.configure({ apiKey });
                }
            } catch (e) {
                console.warn("RevenueCat failed to initialize (likely running in Expo Go w/o Dev Client). Ignoring.");
            }
        }

        // Request Push Notification Permissions
        requestNotificationPermissions().catch((e) =>
          console.warn('Notification permission request failed:', e)
        );
    }, []);

  const { currentScreen, setScreen, user, authUser, authLoading, isGuestMode } = useManifest();

  // Loading State
  if (authLoading) {
      return (
          <View className="flex-1 bg-void items-center justify-center">
              <Loader2 size={32} className="text-gold animate-spin" />
          </View>
      );
  }

  // Auth Guard
  if (!authUser && !isGuestMode) {
      return <AuthScreen />;
  }

  // Navigation Logic
  const renderScreen = () => {
    switch (currentScreen) {
      case 'ONBOARDING': return <Onboarding />;
      case 'WIZARD': return <VisionWizard />;
      case 'TIMELINE': return <Timeline />;
      case 'ALIGNER': return <DailyAligner />;
      case 'SIMULATOR': return <LifestyleSimulator />;
      case 'PROFILE': return <ProfileScreen />;
      case 'STORE': return <StoreScreen />;
      default: return <Onboarding />;
    }
  };

  // Bottom Tab Bar (Only show if onboarded and on main screens)
  const ShowTabBar = currentScreen !== 'ONBOARDING' && currentScreen !== 'WIZARD' && currentScreen !== 'STORE';

  return (
    <SafeAreaView className="flex-1 bg-void" edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      
      {/* Main Content Area */}
      <View className="flex-1 text-white">
        {renderScreen()}
      </View>

      {/* Floating Bottom Navigation */}
      {ShowTabBar && (
        <View className="absolute bottom-8 left-6 right-6 z-50">
          <BlurView intensity={30} tint="dark" className="bg-surface/60 flex-row items-center justify-between h-16 rounded-[24px] border border-white/10 px-4 shadow-2xl">
            
            <TouchableOpacity 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setScreen('TIMELINE');
              }}
              className="flex-1 items-center justify-center h-full active:scale-90 transition-transform"
            >
              <Calendar size={22} color={currentScreen === 'TIMELINE' ? '#F4E0B9' : '#9CA3AF'} strokeWidth={2.5} />
              <Text className={`text-[9px] font-bold uppercase tracking-[1.5px] mt-1.5 ${currentScreen === 'TIMELINE' ? 'text-gold' : 'text-gray-400'}`}>Vision</Text>
            </TouchableOpacity>

             <TouchableOpacity 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setScreen('SIMULATOR');
              }}
              className="flex-1 items-center justify-center h-full active:scale-90 transition-transform"
            >
              <Wand2 size={22} color={currentScreen === 'SIMULATOR' ? '#F4E0B9' : '#9CA3AF'} strokeWidth={2.5} />
              <Text className={`text-[9px] font-bold uppercase tracking-[1.5px] mt-1.5 ${currentScreen === 'SIMULATOR' ? 'text-gold' : 'text-gray-400'}`}>Shift</Text>
            </TouchableOpacity>

            {/* Middle Action Button (Add) */}
            <View className="px-2">
              <TouchableOpacity 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setScreen('WIZARD');
                }}
                className="w-14 h-14 rounded-full bg-gold items-center justify-center shadow-2xl shadow-gold/40 -mt-10 border-4 border-void active:scale-95 transition-transform"
              >
                <Text className="text-3xl text-void font-bold">+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setScreen('ALIGNER');
              }}
              className="flex-1 items-center justify-center h-full active:scale-90 transition-transform"
            >
              <LayoutDashboard size={22} color={currentScreen === 'ALIGNER' ? '#F4E0B9' : '#9CA3AF'} strokeWidth={2.5} />
              <Text className={`text-[9px] font-bold uppercase tracking-[1.5px] mt-1.5 ${currentScreen === 'ALIGNER' ? 'text-gold' : 'text-gray-400'}`}>Align</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setScreen('PROFILE');
              }}
              className="flex-1 items-center justify-center h-full active:scale-90 transition-transform"
            >
              <User size={22} color={currentScreen === 'PROFILE' ? '#F4E0B9' : '#9CA3AF'} strokeWidth={2.5} />
              <Text className={`text-[9px] font-bold uppercase tracking-[1.5px] mt-1.5 ${currentScreen === 'PROFILE' ? 'text-gold' : 'text-gray-400'}`}>PROFILE</Text>
            </TouchableOpacity>

          </BlurView>
        </View>
      )}
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ManifestProvider>
          <AppContent />
        </ManifestProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
