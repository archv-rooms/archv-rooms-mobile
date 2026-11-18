import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Animated, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PressableScale from './PressableScale';
import HeartButton from './HeartButton';
import {
  FONT_SEMI,
  FONT_BOLD,
  SURFACE,
  ACCENT,
  BUTTON_PURPLE,
  WHITE,
  TEXT_MUTED,
  consoleColor,
} from '../constants/palette';

const NATIVE = Platform.OS !== 'web';

export default function GameCard({ game, index, favorite, onPress, onToggleFavorite }) {
  const enter = useRef(new Animated.Value(0)).current;
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(Math.min(index, 8) * 70),
      Animated.spring(enter, { toValue: 1, useNativeDriver: NATIVE, tension: 60, friction: 9 }),
    ]).start();
  }, []);

  const color = consoleColor(game.console);
  const initial = (game.title || '?').trim().charAt(0).toUpperCase();
  const hasImage = game.image && !imageFailed;

  return (
    <Animated.View
      style={[
        styles.cardWrap,
        {
          opacity: enter.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
          transform: [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
            { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
          ],
        },
      ]}
    >
      <PressableScale onPress={onPress} style={styles.card} scale={0.95}>
        <View style={styles.thumb}>
          {hasImage ? (
            <Image
              source={{ uri: game.image }}
              style={styles.thumbImage}
              fadeDuration={0}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <View style={[styles.thumbImage, styles.thumbEmpty, { backgroundColor: color + '30' }]}>
              <Text style={[styles.thumbInitial, { color }]}>{initial}</Text>
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(20,17,31,0.75)']}
            style={styles.thumbShade}
            pointerEvents="none"
          />

          <View style={styles.play} pointerEvents="none">
            <Ionicons name="play" size={14} color={WHITE} style={{ marginLeft: 2 }} />
          </View>

          <HeartButton favorite={favorite} onPress={onToggleFavorite} />
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {game.title}
          </Text>
          {game.console ? <Text style={styles.cardConsole}>{game.console}</Text> : null}
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrap: { width: '48%', marginBottom: 16 },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  thumb: { width: '100%', aspectRatio: 1.15 },
  thumbImage: { width: '100%', height: '100%' },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  thumbInitial: { fontFamily: FONT_BOLD, fontSize: 48 },
  thumbShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 54 },
  play: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: BUTTON_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  cardInfo: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 },
  cardTitle: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 17 },
  cardConsole: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 14, marginTop: 1 },
});