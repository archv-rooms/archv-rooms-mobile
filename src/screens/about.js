import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { useFonts } from 'expo-font';
import {
  FONT_SEMI,
  FONT_BOLD,
  BG_TOP,
  BG_BOTTOM,
  SURFACE,
  BUTTON_PURPLE,
  ACCENT,
  WHITE,
  TEXT_MUTED,
} from '../constants/palette';

export default function AboutScreen() {
  const [fontsLoaded] = useFonts({ Rajdhani_600SemiBold, Rajdhani_700Bold });

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: BG_TOP }} />;

  return (
    <LinearGradient colors={[BG_TOP, BG_BOTTOM]} style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Sobre</Text>
        </View>

        <View style={styles.center}>
          <View style={styles.logo}>
            <Ionicons name="game-controller" size={48} color={WHITE} />
          </View>
          <Text style={styles.text}>
            Jogue com seus amigos, crie salas e converse em tempo real.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.sub}>Versão</Text>
          <Text style={styles.value}>1.0.0</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 130,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 28, letterSpacing: 0.5 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 30,
    backgroundColor: BUTTON_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: ACCENT,
    shadowOpacity: 0.7,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  text: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 17, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    height: 70,
  },
  sub: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 17 },
  value: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 18 },
});