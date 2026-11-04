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

const NATIVE = Platform.OS !== 'web';

const COLORS = {
  gradient: ['#1E1830', '#3A2F55', '#5B4A7A'],
  surface: '#4B4163',
  button: '#6A5BD6',
  accent: '#8E7CF0',
  softText: '#B8B0C8',
};

const FONT = {
  normal: 'Rajdhani_500Medium',
  semi: 'Rajdhani_600SemiBold',
  bold: 'Rajdhani_700Bold',
};

export default function SignInScreen({ navigation }) {
  const [fontsReady] = useFonts({
    Rajdhani_500Medium,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focus, setFocus] = useState('');

  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: NATIVE,
    }).start();
  }, []);

  function handleLogin() {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
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
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Log in to continue playing</Text>
          </Animated.View>

          <Animated.View style={{ opacity: fade }}>
            <View style={[styles.field, focus === 'email' && styles.fieldFocus]}>
              <Ionicons name="mail-outline" size={20} color={COLORS.softText} />
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
              />
            </View>

            <View style={[styles.field, focus === 'password' && styles.fieldFocus]}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.softText} />
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
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color="#E6E0F0"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotBox}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgot}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.85}
            >
              <Text style={styles.loginText}>Log in</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleButton} activeOpacity={0.8}>
            <Ionicons name="logo-google" size={18} color="#fff" />
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={{ flex: 1, minHeight: 24 }} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.footerLink}>Create account</Text>
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
    marginBottom: 32,
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
    height: 56,
    marginBottom: 14,
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
  forgotBox: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    marginBottom: 18,
  },
  forgot: {
    fontFamily: FONT.semi,
    color: COLORS.softText,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: COLORS.button,
    borderRadius: 28,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    fontFamily: FONT.bold,
    color: '#fff',
    fontSize: 20,
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 24,
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