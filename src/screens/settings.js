import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { useFonts } from 'expo-font';
import { DEFAULTS, loadSettings, saveSettings, vibrate } from '../services/settings';
import {
  FONT_SEMI,
  FONT_BOLD,
  BG_TOP,
  BG_BOTTOM,
  SURFACE,
  BUTTON_PURPLE,
  WHITE,
  TEXT_MUTED,
} from '../constants/palette';

const OPTIONS = [
  { key: 'sound', icon: 'volume-high', label: 'Sons', desc: 'Efeitos sonoros nos jogos' },
  { key: 'vibration', icon: 'phone-portrait', label: 'Vibração', desc: 'Vibrar ao interagir' },
  { key: 'notifications', icon: 'notifications', label: 'Notificações', desc: 'Convites e mensagens' },
];

export default function SettingsScreen() {
  const [fontsLoaded] = useFonts({ Rajdhani_600SemiBold, Rajdhani_700Bold });
  const [settings, setSettings] = useState(DEFAULTS);

  useEffect(() => {
    loadSettings().then((saved) => setSettings({ ...saved }));
  }, []);

  async function toggle(key) {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    await saveSettings(next);
    // Ao ligar a vibração, vibra uma vez para mostrar que funciona
    if (key === 'vibration' && next.vibration) vibrate(60);
  }

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: BG_TOP }} />;

  return (
    <LinearGradient colors={[BG_TOP, BG_BOTTOM]} style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Ajustes</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
          {OPTIONS.map((opt) => (
            <View key={opt.key} style={styles.row}>
              <View style={styles.icon}>
                <Ionicons name={opt.icon} size={22} color={TEXT_MUTED} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{opt.label}</Text>
                <Text style={styles.sub}>{opt.desc}</Text>
              </View>
              <Switch
                value={settings[opt.key]}
                onValueChange={() => toggle(opt.key)}
                trackColor={{ false: 'rgba(255,255,255,0.12)', true: BUTTON_PURPLE }}
                thumbColor={WHITE}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 28, letterSpacing: 0.5 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    height: 70,
    marginBottom: 10,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 18 },
  sub: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 14 },
});