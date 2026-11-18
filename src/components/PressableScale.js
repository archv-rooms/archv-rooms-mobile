import React, { useRef } from 'react';
import { Animated, Pressable, Platform } from 'react-native';

const NATIVE = Platform.OS !== 'web';

// Button that shrinks when pressed and springs back
export default function PressableScale({ onPress, wrapStyle, style, children, scale = 0.93, disabled }) {
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