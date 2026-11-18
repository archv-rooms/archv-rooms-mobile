import React, { useState, useEffect, useRef } from 'react';
import { Image, Animated, Easing, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SURFACE, SURFACE_LIGHT, WHITE } from '../constants/palette';

const NATIVE = Platform.OS !== 'web';

// Cover image with a fallback. With zoom, the image slowly "breathes".
// Pass accent to tint the fallback with a color.
export default function Cover({ uri, style, iconSize = 28, zoom = false, accent }) {
  const [failed, setFailed] = useState(false);
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!zoom) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(scale, { toValue: 0, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [zoom]);

  if (!uri || failed) {
    return (
      <LinearGradient
        colors={[accent ? accent + '99' : SURFACE_LIGHT, SURFACE]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[style, { alignItems: 'center', justifyContent: 'center' }]}
      >
        <Ionicons name="game-controller" size={iconSize} color={WHITE} style={{ opacity: accent ? 0.5 : 0.35 }} />
      </LinearGradient>
    );
  }

  if (!zoom) {
    return <Image source={{ uri }} style={style} resizeMode="cover" onError={() => setFailed(true)} />;
  }

  return (
    <Animated.View
      style={[style, { transform: [{ scale: scale.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }) }] }]}
    >
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setFailed(true)} />
    </Animated.View>
  );
}