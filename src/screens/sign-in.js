import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { TOKEN_KEY } from '../services/api';
import { MODO_TESTE } from '../services/mock';

const NATIVO = Platform.OS !== 'web';

// Bloco que entra deslizando de baixo, com atraso
function Entrada({ atraso = 0, children }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      delay: atraso,
      useNativeDriver: NATIVO,
    }).start();
  }, []);

  const deslizar = anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: deslizar }] }}>
      {children}
    </Animated.View>
  );
}

// Botão com "apertinho"
function BotaoAnimado({ onPress, disabled, style, children }) {
  const escala = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() =>
          Animated.spring(escala, { toValue: 0.95, useNativeDriver: NATIVO }).start()
        }
        onPressOut={() =>
          Animated.spring(escala, { toValue: 1, friction: 4, useNativeDriver: NATIVO }).start()
        }
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [foco, setFoco] = useState('');

  const tituloAnim = useRef(new Animated.Value(0)).current;
  const tremer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(tituloAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: NATIVO,
    }).start();
  }, []);

  // Balança o formulário quando dá erro
  function balancar() {
    Animated.sequence([
      Animated.timing(tremer, { toValue: 8, duration: 60, useNativeDriver: NATIVO }),
      Animated.timing(tremer, { toValue: -8, duration: 60, useNativeDriver: NATIVO }),
      Animated.timing(tremer, { toValue: 6, duration: 60, useNativeDriver: NATIVO }),
      Animated.timing(tremer, { toValue: -6, duration: 60, useNativeDriver: NATIVO }),
      Animated.timing(tremer, { toValue: 0, duration: 60, useNativeDriver: NATIVO }),
    ]).start();
  }

  function mostrarErro(mensagem) {
    setError(mensagem);
    balancar();
  }

  async function handleLogin() {
    if (loading) return;

    if (!email.trim() || !password) {
      mostrarErro('Preencha o e-mail e a senha.');
      return;
    }

    setError('');
    setLoading(true);

    // Modo teste: aceita qualquer login, sem chamar a API
    if (MODO_TESTE) {
      await AsyncStorage.setItem(TOKEN_KEY, 'token-de-teste');
      setLoading(false);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      return;
    }

    try {
      // timeout maior porque a API pode demorar ~1 minuto para "acordar"
      const response = await api.post(
        '/auth/login',
        { email: email.trim(), password },
        { timeout: 90000 }
      );

      const token = response?.data?.data?.token;

      if (!token) {
        mostrarErro('Resposta inesperada do servidor. Tente novamente.');
        return;
      }

      await AsyncStorage.setItem(TOKEN_KEY, token);

      // reset para o usuário não voltar ao login ao apertar "voltar"
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err) {
      const apiMessage = err?.response?.data?.message;

      if (apiMessage) {
        mostrarErro(apiMessage);
      } else if (err?.code === 'ECONNABORTED') {
        mostrarErro('O servidor demorou para responder. Tente novamente.');
      } else {
        mostrarErro(
          'Não foi possível conectar ao servidor. Se for a primeira vez, aguarde um minuto e tente de novo.'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#1E1830', '#3A2F55', '#5B4A7A']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Voltar */}
        <TouchableOpacity
          style={styles.back}
          onPress={() => navigation.canGoBack() && navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        {/* Título */}
        <Animated.View style={[styles.tituloBox, { opacity: tituloAnim }]}>
          <Text style={styles.marca}>ARCHV ROOMS</Text>
          <Text style={styles.title}>Log In</Text>
        </Animated.View>

        <Animated.View style={{ transform: [{ translateX: tremer }] }}>
          {/* Email */}
          <Entrada atraso={150}>
            <TextInput
              style={[styles.input, foco === 'email' && styles.inputFoco]}
              placeholder="Email"
              placeholderTextColor="#B8B0C8"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFoco('email')}
              onBlur={() => setFoco('')}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </Entrada>

          {/* Senha */}
          <Entrada atraso={250}>
            <View style={[styles.passwordBox, foco === 'senha' && styles.inputFoco]}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="#B8B0C8"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFoco('senha')}
                onBlur={() => setFoco('')}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
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
          </Entrada>

          {/* Mensagem de erro */}
          {error !== '' && <Text style={styles.error}>{error}</Text>}

          {/* Botão entrar */}
          <Entrada atraso={350}>
            <BotaoAnimado
              onPress={handleLogin}
              disabled={loading}
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginText}>Log in</Text>
              )}
            </BotaoAnimado>
          </Entrada>
        </Animated.View>

        <Entrada atraso={450}>
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgot}>Forgot Password</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.createAccount}>Create account</Text>
          </TouchableOpacity>
        </Entrada>

        <View style={{ flex: 1 }} />

        {/* Google */}
        <Entrada atraso={550}>
          <TouchableOpacity style={styles.googleButton}>
            <Ionicons name="logo-google" size={18} color="#fff" />
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>
        </Entrada>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },
  back: {
    marginBottom: 20,
    width: 40,
  },
  tituloBox: {
    marginBottom: 24,
  },
  marca: {
    color: '#B8B0C8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 6,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#4B4163',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    color: '#fff',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputFoco: {
    borderColor: '#8E7CF0',
  },
  passwordBox: {
    backgroundColor: '#4B4163',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  passwordInput: {
    flex: 1,
    color: '#fff',
    height: '100%',
  },
  error: {
    color: '#FF9AA8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
  },
  loginButton: {
    backgroundColor: '#6A5BD6',
    borderRadius: 26,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  forgot: {
    color: '#B8B0C8',
    textAlign: 'center',
    marginTop: 18,
    fontSize: 13,
  },
  createAccount: {
    color: '#B8B0C8',
    textAlign: 'center',
    marginTop: 14,
    fontSize: 13,
  },
  googleButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#5A4E75',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  googleText: {
    color: '#fff',
    fontSize: 13,
  },
});