import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { useFonts } from 'expo-font';

const FONT_SEMI = 'Rajdhani_600SemiBold';
const FONT_BOLD = 'Rajdhani_700Bold';

const BG_TOP = '#14111F';
const BG_BOTTOM = '#221B38';
const BUTTON_PURPLE = '#6A5BD6';
const ACCENT = '#8E7CF0';
const WHITE = '#FFFFFF';
const TEXT_MUTED = '#B4AACB';

const SLIDES = [
  {
    icon: 'game-controller',
    title: 'Jogue com amigos',
    text: 'Reviva os clássicos e jogue junto com quem você quiser.',
  },
  {
    icon: 'albums',
    title: 'Crie salas',
    text: 'Monte uma sala, convide seus amigos e comece a partida.',
  },
  {
    icon: 'chatbubbles',
    title: 'Converse em tempo real',
    text: 'Fale com seus amigos durante o jogo, sem sair do app.',
  },
];

export default function OnboardingScreen({ navigation, route }) {
  const [fontsLoaded] = useFonts({ Rajdhani_600SemiBold, Rajdhani_700Bold });
  const [index, setIndex] = useState(0);

  const fromSignUp = route?.params?.fromSignUp === true;
  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  // After sign up the user still has to confirm the e-mail, so go to login
  function finish() {
    const target = fromSignUp ? 'SignIn' : 'Home';
    navigation.reset({ index: 0, routes: [{ name: target }] });
  }

  function next() {
    if (isLast) finish();
    else setIndex(index + 1);
  }

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: BG_TOP }} />;

  return (
    <LinearGradient colors={[BG_TOP, BG_BOTTOM]} style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          {!isLast && (
            <Pressable onPress={finish} hitSlop={12}>
              <Text style={styles.skip}>Pular</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.center}>
          <View style={styles.logo}>
            <Ionicons name={slide.icon} size={52} color={WHITE} />
          </View>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.text}>{slide.text}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
          <Pressable style={styles.button} onPress={next}>
            <Text style={styles.buttonText}>
              {isLast ? (fromSignUp ? 'Ir para o login' : 'Começar') : 'Próximo'}
            </Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
  },
  header: { height: 32, alignItems: 'flex-end', justifyContent: 'center' },
  skip: { fontFamily: FONT_BOLD, color: TEXT_MUTED, fontSize: 17 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  logo: {
    width: 112,
    height: 112,
    borderRadius: 34,
    backgroundColor: BUTTON_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: ACCENT,
    shadowOpacity: 0.7,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  title: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 32, textAlign: 'center' },
  text: {
    fontFamily: FONT_SEMI,
    color: TEXT_MUTED,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
  },
  footer: { alignItems: 'center', gap: 24 },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { width: 24, backgroundColor: BUTTON_PURPLE },
  button: {
    alignSelf: 'stretch',
    backgroundColor: BUTTON_PURPLE,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 18 },
});