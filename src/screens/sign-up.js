import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, ScrollView, KeyboardAvoidingView, Platform, Alert, Animated, Pressable } from 'react-native';
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

function SuccessMessage({ onContinue }) {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: NATIVE }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fade,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: 'rgba(74,222,128,0.12)',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
      }}
    >
      <Ionicons name="checkmark-circle" size={22} color={COLORS.green} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: FONT.semi, color: COLORS.green, fontSize: 16, marginBottom: 6 }}>
          Conta criada! Verifique seu e-mail para ativar a conta antes de entrar.
        </Text>
        <Pressable onPress={onContinue}>
          <Text style={{ fontFamily: FONT.bold, color: '#fff', fontSize: 16, textDecorationLine: 'underline' }}>
            Continuar
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function SignUpScreen({ navigation }) {
  const [fontsReady] = useFonts({ Rajdhani_500Medium, Rajdhani_600SemiBold, Rajdhani_700Bold });

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
    setError(message);
    shakeForm();
  }

  function showBirthInfo() {
    Alert.alert('Data de nascimento', 'Usamos sua data de nascimento para confirmar que você tem idade para usar o archv-rooms.');
  }

  // After sign up, show the onboarding; it ends at the login screen
  function goToOnboarding() {
    navigation.navigate('Onboarding', { fromSignUp: true });
  }

  async function handleSignUp() {
    if (loading) return;

    if (!name.trim() || !username.trim() || !email.trim() || !password) {
      showError('Preencha nome, username, e-mail e senha.');
      return;
    }

    setError('');
    setSuccess(false);
    setLoading(true);

    // Test mode: pretends the account was created, without calling the API
    if (TEST_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setLoading(false);
      setSuccess(true);
      return;
    }

    try {
      await api.post(
        '/auth/register',
        { name: name.trim(), username: username.trim(), email: email.trim(), password },
        { timeout: 90000 }
      );
      setSuccess(true);
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
          <FadeIn style={[s.header, { marginBottom: 24 }]}>
            <Image source={require('../../assets/logo.png')} style={[s.logo, { width: 72, height: 72 }]} resizeMode="contain" />
            <Text style={s.title}>Criar conta</Text>
            <Text style={s.subtitle}>Entre no Archv Rooms e comece a jogar</Text>
          </FadeIn>

          <FadeIn delay={100}>
            <Animated.View style={{ transform: [{ translateX: shake }] }}>
              <AuthField icon="person-outline" placeholder="Nome" value={name} onChangeText={setName} autoCapitalize="words" editable={!loading} />
              <AuthField icon="at-outline" placeholder="Username" value={username} onChangeText={setUsername} editable={!loading} />

              {/* Date of birth is not sent to the API */}
              <AuthField
                icon="calendar-outline"
                placeholder="Data de nascimento"
                value={birthDate}
                onChangeText={setBirthDate}
                keyboardType="numbers-and-punctuation"
                editable={!loading}
                right={
                  <Pressable onPress={showBirthInfo} hitSlop={10}>
                    <Ionicons name="information-circle-outline" size={22} color={COLORS.muted} />
                  </Pressable>
                }
              />

              <AuthField
                icon="mail-outline"
                placeholder="E-mail"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                editable={!loading}
              />
              <AuthField
                icon="lock-closed-outline"
                placeholder="Senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
                onSubmitEditing={handleSignUp}
                right={
                  <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
                    <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={22} color={COLORS.muted} />
                  </Pressable>
                }
              />

              {error !== '' && <Text style={[s.error, { textAlign: 'center' }]}>{error}</Text>}
              {success && <SuccessMessage onContinue={goToOnboarding} />}

              <PrimaryButton label="Criar conta" onPress={handleSignUp} loading={loading} />
            </Animated.View>
          </FadeIn>

          <Text style={{ fontFamily: FONT.normal, color: COLORS.muted, textAlign: 'center', fontSize: 14, marginTop: 14 }}>
            Ao continuar, você concorda com os Termos e a Política de Privacidade.
          </Text>

          <FadeIn delay={200}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
              <Text style={s.link}>ou</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
            </View>

            <PressableScale
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                height: 54,
                borderRadius: 27,
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
              }}
              scale={0.96}
            >
              <Ionicons name="logo-google" size={18} color="#fff" />
              <Text style={{ fontFamily: FONT.semi, color: '#fff', fontSize: 18 }}>Continuar com Google</Text>
            </PressableScale>
          </FadeIn>

          <FadeIn delay={280} style={[s.footer, { marginTop: 24 }]}>
            <Text style={s.footerText}>Já tem conta?</Text>
            <Pressable onPress={() => navigation.navigate('SignIn')}>
              <Text style={s.footerLink}>Entrar</Text>
            </Pressable>
          </FadeIn>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}