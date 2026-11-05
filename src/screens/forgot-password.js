import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import {
  Rajdhani_500Medium,
  Rajdhani_600SemiBold,
  Rajdhani_700Bold,
} from '@expo-google-fonts/rajdhani';
import api from '../services/api';
import { TEST_MODE } from '../services/mock';

const NATIVE = Platform.OS !== 'web';

const COLORS = {
  gradient: ['#1E1830', '#3A2F55', '#5B4A7A'],
  surface: '#4B4163',
  button: '#6A5BD6',
  accent: '#8E7CF0',
  softText: '#B8B0C8',
  error: '#FF9AA8',
  success: '#9BE7B0',
};

const FONT = {
  normal: 'Rajdhani_500Medium',
  semi: 'Rajdhani_600SemiBold',
  bold: 'Rajdhani_700Bold',
};

function SentMessage() {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 400,
      useNativeDriver: NATIVE,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.sentBox, { opacity: fade }]}>
      <Ionicons name="mail-outline" size={20} color={COLORS.success} />
      <Text style={styles.sentText}>
        If this email is registered, you will receive a link shortly.
      </Text>
    </Animated.View>
  );
}

export default function ForgotPasswordScreen({ navigation }) {
  const [fontsReady] = useFonts({
    Rajdhani_500Medium,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
  });

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: NATIVE,
    }).start();
  }, []);

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
      await api.post(
        '/auth/forgot-password',
        { email: email.trim() },
        { timeout: 90000 }
      );
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

  if (!fontsReady) {
    return <View style={{ flex: 1, backgroundColor: '#1E1830' }} />;
  }

  return (
    <LinearGradient colors={COLORS.gradient} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.back}
            onPress={() => navigation.canGoBack() && navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <Animated.View style={[styles.header, { opacity: fade }]}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.description}>
              Enter the email linked to your account and we'll send you a link to
              create a new password.
            </Text>
          </Animated.View>

          <Animated.View style={{ opacity: fade, transform: [{ translateX: shake }] }}>
            <View style={[styles.field, focused && styles.fieldFocus]}>
              <Ionicons name="mail-outline" size={20} color={COLORS.softText} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={COLORS.softText}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setSent(false);
                  setError('');
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
                onSubmitEditing={handleSend}
              />
            </View>

            <TouchableOpacity
              style={[styles.sendButton, loading && { opacity: 0.7 }]}
              onPress={handleSend}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sendText}>Send link</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {sent && <SentMessage />}

          {error !== '' && <Text style={styles.error}>{error}</Text>}

          <View style={{ flex: 1, minHeight: 24 }} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Remembered it?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={styles.footerLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 32,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 28,
  },
  logo: {
    width: 84,
    height: 84,
    marginBottom: 14,
  },
  title: {
    fontFamily: FONT.bold,
    color: '#fff',
    fontSize: 34,
    letterSpacing: 0.5,
  },
  description: {
    fontFamily: FONT.normal,
    color: COLORS.softText,
    fontSize: 18,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  fieldFocus: {
    borderColor: COLORS.accent,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#fff',
    fontFamily: FONT.semi,
    fontSize: 18,
  },
  sendButton: {
    backgroundColor: COLORS.button,
    borderRadius: 28,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    fontFamily: FONT.bold,
    color: '#fff',
    fontSize: 20,
    letterSpacing: 0.5,
  },
  sentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(155, 231, 176, 0.12)',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  sentText: {
    flex: 1,
    fontFamily: FONT.semi,
    color: COLORS.success,
    fontSize: 16,
  },
  error: {
    fontFamily: FONT.semi,
    color: COLORS.error,
    textAlign: 'center',
    fontSize: 16,
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    fontFamily: FONT.normal,
    color: COLORS.softText,
    fontSize: 17,
  },
  footerLink: {
    fontFamily: FONT.bold,
    color: '#fff',
    fontSize: 17,
  },
});