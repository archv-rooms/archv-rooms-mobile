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
import api from '../services/api';
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

// Mensagem de envio que aparece com fade
function Enviado() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: NATIVO,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.enviadoBox, { opacity: anim }]}>
      <Ionicons name="mail-outline" size={20} color="#9BE7B0" />
      <Text style={styles.sentMessage}>
        If this email is registered, you will receive a link shortly.
      </Text>
    </Animated.View>
  );
}

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [foco, setFoco] = useState(false);

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
    setSent(false);
    setError(mensagem);
    balancar();
  }

  async function handleSend() {
    if (loading) return;

    if (!email.trim()) {
      mostrarErro('Preencha o e-mail.');
      return;
    }

    setError('');
    setSent(false);
    setLoading(true);

    // Modo teste: finge que enviou o link, sem chamar a API
    if (MODO_TESTE) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setLoading(false);
      setSent(true);
      return;
    }

    try {
      // timeout maior porque a API pode demorar para "acordar"
      await api.post(
        '/auth/forgot-password',
        { email: email.trim() },
        { timeout: 90000 }
      );
      setSent(true);
    } catch (err) {
      const apiMessage = err?.response?.data?.message;

      if (apiMessage) {
        mostrarErro(apiMessage);
      } else if (err?.code === 'ECONNABORTED') {
        mostrarErro('O servidor demorou para responder. Tente novamente.');
      } else {
        mostrarErro('Não foi possível conectar ao servidor. Tente novamente.');
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
          <Text style={styles.title}>Reset Password</Text>
        </Animated.View>

        <Entrada atraso={150}>
          <Text style={styles.description}>
            To recover your account, please enter the email address linked to your
            account. We'll send you instructions to reset your password.
          </Text>
        </Entrada>

        <Animated.View style={{ transform: [{ translateX: tremer }] }}>
          {/* Email */}
          <Entrada atraso={250}>
            <TextInput
              style={[styles.input, foco && styles.inputFoco]}
              placeholder="Email"
              placeholderTextColor="#B8B0C8"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setSent(false);
                setError('');
              }}
              onFocus={() => setFoco(true)}
              onBlur={() => setFoco(false)}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
              onSubmitEditing={handleSend}
            />
          </Entrada>

          {/* Botão enviar */}
          <Entrada atraso={350}>
            <BotaoAnimado
              onPress={handleSend}
              disabled={loading}
              style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sendText}>Send link</Text>
              )}
            </BotaoAnimado>
          </Entrada>
        </Animated.View>

        {sent && <Enviado />}

        {error !== '' && <Text style={styles.error}>{error}</Text>}
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
    marginBottom: 14,
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
  description: {
    color: '#D8D0E8',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#4B4163',
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    color: '#fff',
    marginBottom: 14,
  },
  inputFoco: {
    borderColor: '#8E7CF0',
  },
  sendButton: {
    backgroundColor: '#6A5BD6',
    borderRadius: 26,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  enviadoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(155, 231, 176, 0.12)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  sentMessage: {
    flex: 1,
    color: '#9BE7B0',
    fontSize: 12,
  },
  error: {
    color: '#FF9AA8',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 16,
  },
});