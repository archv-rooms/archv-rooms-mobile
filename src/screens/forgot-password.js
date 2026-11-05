import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, ScrollView, KeyboardAvoidingView, Platform, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Rajdhani_500Medium, Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import api from '../services/api';
import { TEST_MODE } from '../services/mock';
import {
  COLORS,
  FONT,
  NATIVE,
  FadeIn,
  PressableScale,
  AuthField,
  PrimaryButton,
  authStyles as s,
} from '../components/auth-kit';

function SentMessage() {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: NATIVE }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fade,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(74,222,128,0.12)',
        borderRadius: 16,
        padding: 14,
        marginTop: 16,
      }}
    >
      <Ionicons name="mail-outline" size={20} color={COLORS.green} />
      <Text style={{ flex: 1, fontFamily: FONT.semi, color: COLORS.green, fontSize: 16 }}>
        Se este e-mail estiver cadastrado, você receberá um link em instantes.
      </Text>
    </Animated.View>
  );
}

export default function ForgotPasswordScreen({ navigation }) {
  const [fontsReady] = useFonts({ Rajdhani_500Medium, Rajdhani_600SemiBold, Rajdhani_700Bold });

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const shake = useRef(new Animated.Value(0)).current;

  function shakeForm() {
    Animated.sequence([
      Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: NATIVE }),
      Animated.timing(shake, { toValue: -8, duration: 60, useNativeDriver: NATIVE }),
      Animated.timing(shake, { toValue: 6, duration: 60, useNativeDriver: NATIVE }),
      Animated.timing(shake, { toValue: -6, duration: 60, useNativeDriver: NATIVE }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: NATIVE }),
    ]).start();
  }

  function showError(message) {
    setSent(false);
    setError(message);
    shakeForm();
  }

  async function handleSend() {
    if (loading) return;

    if (!email.trim()) {
      showError('Preencha o e-mail.');
      return;
    }

    setError('');
    setSent(false);
    setLoading(true);

    // Test mode: pretends the link was sent, without calling the API
    if (TEST_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setLoading(false);
      setSent(true);
      return;
    }

    try {
      await api.post('/auth/forgot-password', { email: email.trim() }, { timeout: 90000 });
      setSent(true);
    } catch (err) {
      const apiMessage = err?.response?.data?.message;

      if (apiMessage) {
        showError(apiMessage);
      } else if (err?.code === 'ECONNABORTED') {
        showError('O servidor demorou para responder. Tente novamente.');
      } else {
        showError('Não foi possível conectar ao servidor. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (!fontsReady) return <View style={{ flex: 1, backgroundColor: COLORS.bgTop }} />;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgTop }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <FadeIn>
            <PressableScale
              onPress={() => navigation.canGoBack() && navigation.goBack()}
              style={s.back}
              scale={0.82}
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </PressableScale>
          </FadeIn>

          <FadeIn delay={80} style={s.header}>
            <Image source={require('../../assets/logo.png')} style={s.logo} resizeMode="contain" />
            <Text style={s.title}>Redefinir senha</Text>
            <Text style={[s.subtitle, { paddingHorizontal: 8 }]}>
              Digite o e-mail da sua conta e enviaremos um link para criar uma nova senha.
            </Text>
          </FadeIn>

          <FadeIn delay={160}>
            <Animated.View style={{ transform: [{ translateX: shake }] }}>
              <AuthField
                icon="mail-outline"
                placeholder="E-mail"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setSent(false);
                  setError('');
                }}
                keyboardType="email-address"
                editable={!loading}
                onSubmitEditing={handleSend}
              />

              <PrimaryButton label="Enviar link" onPress={handleSend} loading={loading} />
            </Animated.View>

            {sent && <SentMessage />}
            {error !== '' && <Text style={[s.error, { textAlign: 'center', marginTop: 16 }]}>{error}</Text>}
          </FadeIn>

          <View style={{ flex: 1, minHeight: 24 }} />

          <FadeIn delay={240} style={s.footer}>
            <Text style={s.footerText}>Lembrou a senha?</Text>
            <Pressable onPress={() => navigation.navigate('SignIn')}>
              <Text style={s.footerLink}>Entrar</Text>
            </Pressable>
          </FadeIn>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}