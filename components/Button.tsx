import React, { useRef } from 'react';
import { TouchableOpacity, Text, Animated, ActivityIndicator, View } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'google';
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  className = '', 
  children, 
  onPress, 
  disabled,
  loading 
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20
    }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20
    }).start();
  };

  const baseStyles = "w-full h-[56px] rounded-[16px] items-center justify-center overflow-hidden flex-row";
  
  const variants = {
    primary: "bg-gold",
    secondary: "border border-gold/30 bg-gold/5",
    ghost: "bg-transparent",
    google: "bg-white shadow-lg"
  };

  const textVariants = {
    primary: "text-void font-bold uppercase tracking-[2px] text-sm",
    secondary: "text-gold font-bold uppercase tracking-[1px] text-sm",
    ghost: "text-gray-300 font-bold",
    google: "text-black font-bold uppercase tracking-widest text-sm"
  };

  const isDisabled = disabled || loading;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
      <TouchableOpacity 
        onPress={onPress} 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        className={`${baseStyles} ${variants[variant]} ${className} ${isDisabled ? 'opacity-50' : ''}`}
        activeOpacity={1}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? '#050505' : '#F4E0B9'} />
        ) : (
          <View className="flex-row items-center justify-center w-full px-6">
            {typeof children === 'string' ? (
              <Text className={textVariants[variant]}>
                {children}
              </Text>
            ) : (
              children
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};