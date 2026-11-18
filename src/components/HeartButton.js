import React, { useRef, useEffect } from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import { PINK, WHITE } from '../constants/palette';

const NATIVE = Platform.OS !== 'web';

// Heart that pops when favorited
export default function HeartButton({ favorite, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (favorite) {
      scale.setValue(0.6);
      Animated.spring(scale, { toValue: 1, useNativeDriver: NATIVE, speed: 14, bounciness: 22 }).start();
    }
  }, [favorite]);

  return (
    <PressableScale onPress={onPress} wrapStyle={styles.heartWrap} style={styles.heart} scale={0.8}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons
          name={favorite ? 'heart' : 'heart-outline'}
          size={18}
          color={favorite ? PINK : WHITE}
        />
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  heartWrap: { position: 'absolute', top: 8, right: 8 },
  heart: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});