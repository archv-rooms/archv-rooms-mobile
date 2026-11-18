import { useRef } from 'react';
import { Animated, Platform } from 'react-native';

const NATIVE = Platform.OS !== 'web';

// Shakes a form left and right (use on validation errors)
export default function useShake() {
  const value = useRef(new Animated.Value(0)).current;

  function shake() {
    Animated.sequence([
      Animated.timing(value, { toValue: 8, duration: 60, useNativeDriver: NATIVE }),
      Animated.timing(value, { toValue: -8, duration: 60, useNativeDriver: NATIVE }),
      Animated.timing(value, { toValue: 6, duration: 60, useNativeDriver: NATIVE }),
      Animated.timing(value, { toValue: -6, duration: 60, useNativeDriver: NATIVE }),
      Animated.timing(value, { toValue: 0, duration: 60, useNativeDriver: NATIVE }),
    ]).start();
  }

  const shakeStyle = { transform: [{ translateX: value }] };

  return { shakeStyle, shake };
}