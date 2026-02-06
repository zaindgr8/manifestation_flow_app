import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  className?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="w-full mb-6">
      {label && (
        <Text className="text-[12px] text-gold font-bold uppercase tracking-[2px] ml-1 mb-2.5">
          {label}
        </Text>
      )}
      <View 
        className={`w-full bg-surface/50 border rounded-[16px] overflow-hidden transition-all duration-300 ${
          isFocused ? 'border-gold bg-surface/70' : 'border-white/10'
        }`}
      >
        <TextInput 
          className={`w-full px-5 h-[56px] text-white font-semibold text-[15px] ${className}`}
          placeholderTextColor="#ffffff30"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          textAlignVertical="center"
          {...props}
        />
      </View>
    </View>
  );
};