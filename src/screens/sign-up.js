import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
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

// Input row with an icon on the left (and an optional action on the right)
function Field({ icon, focused, children }) {
  return (
    <View style={[styles.field, focused && styles.fieldFocus]}>
      <Ionicons name={icon} size={20} color={COLORS.softText} />
      {children}
    </View>
  );
}

function SuccessMessage({ onContinue }) {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 400,
      useNativeDriver: NATIVE,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.successBox, { opacity: fade }]}>
      <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
      <View style={{ flex: 1 }}>
        <Text style={styles.successText}>
          Conta criada! Verifique seu e-mail para ativar a conta antes de entrar.
        </Text>
        <TouchableOpacity onPress={onContinue}>
          <Text style={styles.goLogin}>Continue</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function SignUpScreen({ navigation }) {
  const [fontsReady] = useFonts({
    Rajdhani_500Medium,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
  });

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [focus, setFocus] = useState('');

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
    setError(message);
    shakeForm();
  }

  function showBirthInfo() {
    Alert.alert(
      'Date of Birth',
      'We use your date of birth to confirm you are old enough to use archv-rooms.'
    );
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
        {
          name: name.trim(),
          username: username.trim(),
          email: email.trim(),
          password,
        },
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
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Join Archv Rooms and start playing</Text>
          </Animated.View>

          <Animated.View style={{ opacity: fade, transform: [{ translateX: shake }] }}>
            <Field icon="person-outline" focused={focus === 'name'}>
              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor={COLORS.softText}
                value={name}
                onChangeText={setName}
                onFocus={() => setFocus('name')}
                onBlur={() => setFocus('')}
                editable={!loading}
              />
            </Field>

            <Field icon="at-outline" focused={focus === 'username'}>
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor={COLORS.softText}
                value={username}
                onChangeText={setUsername}
                onFocus={() => setFocus('username')}
                onBlur={() => setFocus('')}
                autoCapitalize="none"
                editable={!loading}
              />
            </Field>

            {/* Date of birth is not sent to the API */}
            <Field icon="calendar-outline" focused={focus === 'birth'}>
              <TextInput
                style={styles.input}
                placeholder="Date of Birth"
                placeholderTextColor={COLORS.softText}
                value={birthDate}
                onChangeText={setBirthDate}
                onFocus={() => setFocus('birth')}
                onBlur={() => setFocus('')}
                keyboardType="numbers-and-punctuation"
                editable={!loading}
              />
              <TouchableOpacity onPress={showBirthInfo}>
                <Ionicons name="information-circle-outline" size={22} color="#E6E0F0" />
              </TouchableOpacity>
            </Field>

            <Field icon="mail-outline" focused={focus === 'email'}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={COLORS.softText}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocus('email')}
                onBlur={() => setFocus('')}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </Field>

            <Field icon="lock-closed-outline" focused={focus === 'password'}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={COLORS.softText}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocus('password')}
                onBlur={() => setFocus('')}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
                onSubmitEditing={handleSignUp}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color="#E6E0F0"
                />
              </TouchableOpacity>
            </Field>

            {error !== '' && <Text style={styles.error}>{error}</Text>}

            {success && <SuccessMessage onContinue={goToOnboarding} />}

            <TouchableOpacity
              style={[styles.signUpButton, loading && { opacity: 0.7 }]}
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signUpText}>Sign up</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.terms}>
            By continuing, you agree to our Terms and Privacy Policy.
          </Text>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleButton} activeOpacity={0.8}>
            <Ionicons name="logo-google" size={18} color="#fff" />
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
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
    marginTop: 4,
    marginBottom: 24,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 10,
  },
  title: {
    fontFamily: FONT.bold,
    color: '#fff',
    fontSize: 32,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: FONT.normal,
    color: COLORS.softText,
    fontSize: 18,
    marginTop: 2,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 12,
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
  error: {
    fontFamily: FONT.semi,
    color: COLORS.error,
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 8,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(155, 231, 176, 0.12)',
    borderRadius: 14,
    padding: 12,
    marginVertical: 8,
  },
  successText: {
    fontFamily: FONT.semi,
    color: COLORS.success,
    fontSize: 16,
    marginBottom: 6,
  },
  goLogin: {
    fontFamily: FONT.bold,
    color: '#fff',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  signUpButton: {
    backgroundColor: COLORS.button,
    borderRadius: 28,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  signUpText: {
    fontFamily: FONT.bold,
    color: '#fff',
    fontSize: 20,
    letterSpacing: 0.5,
  },
  terms: {
    fontFamily: FONT.normal,
    color: COLORS.softText,
    textAlign: 'center',
    fontSize: 14,
    marginTop: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dividerText: {
    fontFamily: FONT.semi,
    color: COLORS.softText,
    fontSize: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  googleText: {
    fontFamily: FONT.semi,
    color: '#fff',
    fontSize: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
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