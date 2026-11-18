import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, Pressable, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT } from './auth-kit';

const NATIVE = Platform.OS !== 'web';

// Green message box that fades in, with an optional action link
export default function StatusMessage({ icon, iconSize = 22, message, actionLabel, onAction, style }) {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: NATIVE }).start();
  }, []);

  return (
    <Animated.View
      style={[styles.box, { opacity: fade, alignItems: actionLabel ? 'flex-start' : 'center' }, style]}
    >
      <Ionicons name={icon} size={iconSize} color={COLORS.green} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.text, actionLabel ? { marginBottom: 6 } : null]}>{message}</Text>
        {actionLabel ? (
          <Pressable onPress={onAction}>
            <Text style={styles.action}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderRadius: 16,
    padding: 14,
  },
  text: { fontFamily: FONT.semi, color: COLORS.green, fontSize: 16 },
  action: { fontFamily: FONT.bold, color: '#fff', fontSize: 16, textDecorationLine: 'underline' },
});