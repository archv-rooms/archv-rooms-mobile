import React from 'react';
import { Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FadeIn from './FadeIn';
import useFloat from '../hooks/useFloat';
import { FONT_SEMI, TEXT_MUTED } from '../constants/palette';

export default function EmptyState({ icon, text, style, textStyle }) {
  const float = useFloat(6, 1600);

  return (
    <FadeIn style={[styles.empty, style]}>
      <Animated.View style={[styles.emptyIcon, { transform: [{ translateY: float }] }]}>
        <Ionicons name={icon} size={34} color={TEXT_MUTED} />
      </Animated.View>
      <Text style={[styles.emptyText, textStyle]}>{text}</Text>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingBottom: 100 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 18 },
});