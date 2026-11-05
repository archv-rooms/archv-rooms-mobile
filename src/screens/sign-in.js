import React, { useState } from 'react';
import { View, Text, Image, ScrollView, KeyboardAvoidingView, Platform, Alert, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Rajdhani_500Medium, Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { TOKEN_KEY } from '../services/api';
import {
  COLORS,
  FONT,
  FadeIn,
  PressableScale,
  AuthField,
  PrimaryButton,
  authStyles as s,
} from '../components/auth-kit';

export default function SignInScreen({ navigation }) {
  const [fontsReady] = useFonts({ Rajdhani_500Medium, Rajdhani_600SemiBold, Rajdhani_700Bold });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function goHome() {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  }

  async function handleLogin() {
    // Empty fields skip the login and enter without an account (test access)
    if (!email.trim() || !password) {
      await AsyncStorage.removeItem(TOKEN_KEY);
      goHome();
      return;
    }
    try {
      const res = await api.post('/auth/login', { email: email.trim(), password });
      await AsyncStorage.setItem(TOKEN_KEY, res.data.data.token);
      goHome();
    } catch (e) {
      Alert.alert('Erro', 'E-mail ou senha incorretos.');
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
            <Text style={s.title}>Bem-vindo de volta</Text>
            <Text style={s.subtitle}>Entre para continuar jogando</Text>
          </FadeIn>

          <FadeIn delay={160}>
            <AuthField
              icon="mail-outline"
              placeholder="E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <AuthField
              icon="lock-closed-outline"
              placeholder="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              onSubmitEditing={handleLogin}
              right={
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={22} color={COLORS.muted} />
                </Pressable>
              }
            />

            <Pressable
              style={{ alignSelf: 'flex-end', paddingVertical: 4, marginBottom: 18 }}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={s.link}>Esqueceu a senha?</Text>
            </Pressable>

            <PrimaryButton label="Entrar" onPress={handleLogin} />
          </FadeIn>

          <FadeIn delay={240}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 }}>
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

          <View style={{ flex: 1, minHeight: 24 }} />

          <FadeIn delay={320} style={s.footer}>
            <Text style={s.footerText}>Não tem conta?</Text>
            <Pressable onPress={() => navigation.navigate('SignUp')}>
              <Text style={s.footerLink}>Criar conta</Text>
            </Pressable>
          </FadeIn>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}