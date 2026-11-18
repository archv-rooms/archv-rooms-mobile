import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { Rajdhani_500Medium, Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { COLORS, authStyles } from './auth-kit';

// Background, fonts, keyboard and scroll shared by the auth screens
export default function AuthLayout({ children }) {
  const [fontsReady] = useFonts({ Rajdhani_500Medium, Rajdhani_600SemiBold, Rajdhani_700Bold });

  if (!fontsReady) return <View style={{ flex: 1, backgroundColor: COLORS.bgTop }} />;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgTop }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={authStyles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}