import React, { useRef, useEffect } from 'react';
import { Animated, Platform } from 'react-native';

const NATIVE = Platform.OS !== 'web';

// Linha de lista que aparece uma após a outra (efeito cascata)
export default function AnimatedRow({ index, children }) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(Math.min(index, 8) * 60),
      Animated.spring(value, { toValue: 1, useNativeDriver: NATIVE, tension: 60, friction: 9 }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
        transform: [
          { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
          { scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}