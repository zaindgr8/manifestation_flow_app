import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  Platform,
} from 'react-native';

/**
 * REDESIGNED INPUT COMPONENT
 * Focused on solving the persistent Android vertical alignment issue.
 */

interface InputProps extends TextInputProps {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, style, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.container,
          isFocused ? styles.containerFocused : styles.containerBlurred,
        ]}
      >
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor="#F4E0B9"
          // Crucial for Android centering
          textAlignVertical="center"
          {...props}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    color: '#F4E0B9',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginLeft: 4,
    marginBottom: 6,
    opacity: 0.8,
  },
  container: {
    width: '100%',
    height: 56, // Explicit height
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center', // Center content vertically
    overflow: 'hidden',
  },
  containerFocused: {
    borderColor: '#F4E0B9',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  containerBlurred: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    flex: 1, // Take up all available space in the container
    width: '100%',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    paddingHorizontal: 16,
    // Reset all vertical paddings/margins that might shift text
    paddingTop: 0,
    paddingBottom: 0,
    marginTop: 0,
    marginBottom: 0,
    // Android centering
    textAlignVertical: 'center',
    includeFontPadding: false,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
});
