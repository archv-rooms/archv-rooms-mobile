import { useRef, useEffect } from 'react';
import { Animated, Easing, Platform } from 'react-native';

const NATIVE = Platform.OS !== 'web';

// Value that slowly goes up and down
export default function useFloat(amplitude, duration) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVE,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVE,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return value.interpolate({ inputRange: [0, 1], outputRange: [-amplitude, amplitude] });
}