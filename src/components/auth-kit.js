import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const NATIVE = Platform.OS !== 'web';

export const COLORS = {
  bgTop: '#14111F',
  bgBottom: '#221B38',
  surface: '#2D2545',
  surfaceLight: '#3A3058',
  accent: '#8E7CF0',
  button: '#6A5BD6',
  muted: '#B4AACB',
  green: '#4ADE80',
  error: '#FF9AA8',
};

export const FONT = {
  normal: 'Rajdhani_500Medium',
  semi: 'Rajdhani_600SemiBold',
  bold: 'Rajdhani_700Bold',
};

// Button that shrinks when pressed and springs back
export function PressableScale({ onPress, wrapStyle, style, children, scale = 0.95, disabled }) {
  const value = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(value, { toValue: scale, useNativeDriver: NATIVE, speed: 50, bounciness: 0 }).start();
  }

  function pressOut() {
    Animated.spring(value, { toValue: 1, useNativeDriver: NATIVE, speed: 18, bounciness: 14 }).start();
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
      style={wrapStyle}
    >
      <Animated.View style={[style, { transform: [{ scale: value }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

// Fades in and slides up, with an optional delay
export function FadeIn({ delay = 0, style, children }) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(value, { toValue: 1, useNativeDriver: NATIVE, tension: 70, friction: 10 }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
          transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

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