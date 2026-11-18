import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Animated, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import FadeIn from './FadeIn';
import {
  FONT as FONT_NORMAL,
  FONT_SEMI,
  FONT_BOLD,
  BG_TOP,
  BG_BOTTOM,
  SURFACE,
  SURFACE_LIGHT,
  ACCENT,
  BUTTON_PURPLE,
  TEXT_MUTED,
  GREEN,
  ERROR,
} from '../constants/palette';

export const NATIVE = Platform.OS !== 'web';

// Re-exported so the auth screens keep importing everything from here
export { PressableScale, FadeIn };

export const COLORS = {
  bgTop: BG_TOP,
  bgBottom: BG_BOTTOM,
  surface: SURFACE,
  surfaceLight: SURFACE_LIGHT,
  accent: ACCENT,
  button: BUTTON_PURPLE,
  muted: TEXT_MUTED,
  green: GREEN,
  error: ERROR,
};

export const FONT = {
  normal: FONT_NORMAL,
  semi: FONT_SEMI,
  bold: FONT_BOLD,
};

// Input with an icon and a highlighted border on focus
export function AuthField({ icon, right, style, ...props }) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.field, focused && styles.fieldFocus, style]}>
      <Ionicons name={icon} size={20} color={focused ? COLORS.accent : COLORS.muted} />
      <TextInput
        style={styles.input}
        placeholderTextColor={COLORS.muted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="none"
        {...props}
      />
      {right}
    </View>
  );
}

// Main purple button (shows a spinner while loading)
export function PrimaryButton({ label, onPress, disabled, loading }) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.primary, loading && { opacity: 0.7 }]}
      scale={0.96}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Animated.Text style={styles.primaryText}>{label}</Animated.Text>
      )}
    </PressableScale>
  );
}

export const authStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 32,
  },
  header: { alignItems: 'center', marginTop: 30, marginBottom: 30 },
  logo: { width: 84, height: 84, marginBottom: 14 },
  title: { fontFamily: FONT.bold, color: '#fff', fontSize: 34, letterSpacing: 0.5 },
  subtitle: {
    fontFamily: FONT.normal,
    color: COLORS.muted,
    fontSize: 18,
    marginTop: 2,
    textAlign: 'center',
  },
  link: { fontFamily: FONT.semi, color: COLORS.muted, fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  footerText: { fontFamily: FONT.normal, color: COLORS.muted, fontSize: 17 },
  footerLink: { fontFamily: FONT.bold, color: COLORS.accent, fontSize: 17 },
  error: { fontFamily: FONT.semi, color: COLORS.error, fontSize: 15, marginBottom: 10 },
});

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  fieldFocus: { borderColor: COLORS.accent, backgroundColor: COLORS.surfaceLight },
  input: { flex: 1, height: '100%', color: '#fff', fontFamily: FONT.semi, fontSize: 18 },
  primary: {
    backgroundColor: COLORS.button,
    borderRadius: 28,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accent,
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  primaryText: { fontFamily: FONT.bold, color: '#fff', fontSize: 20, letterSpacing: 0.5 },
});