import React, { useRef, useEffect } from 'react';
import { Animated, Platform } from 'react-native';

const NATIVE = Platform.OS !== 'web';

// Fades in and slides up, with an optional delay
export default function FadeIn({ delay = 0, style, children }) {
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