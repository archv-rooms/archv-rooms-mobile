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
  Pressable,
  Image,
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

// Mensagem de sucesso que aparece com fade
function Sucesso({ onIrLogin }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: NATIVO,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.sucessoBox, { opacity: anim }]}>
      <Ionicons name="checkmark-circle" size={22} color="#9BE7B0" />
      <View style={{ flex: 1 }}>
        <Text style={styles.success}>
          Conta criada! Verifique seu e-mail para ativar a conta antes de entrar.
        </Text>
        <TouchableOpacity onPress={onIrLogin}>
          <Text style={styles.goLogin}>Go to Log In</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
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

  const showBirthInfo = () => {
    Alert.alert(
      'Date of Birth',
      'We use your date of birth to confirm you are old enough to use archv-rooms.'
    );
  };

  async function handleSignUp() {
    if (loading) return;

    if (!name.trim() || !username.trim() || !email.trim() || !password) {
      mostrarErro('Preencha nome, username, e-mail e senha.');
      return;
    }

    setError('');
    setSuccess(false);
    setLoading(true);

    // Modo teste: finge que criou a conta, sem chamar a API
    if (MODO_TESTE) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setLoading(false);
      setSuccess(true);
      return;
    }

    try {
      // timeout maior porque a API pode demorar para "acordar"
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
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Voltar */}
          <TouchableOpacity
            style={styles.back}
            onPress={() => navigation.canGoBack() && navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>

          {/* Logo + Título */}
          <Animated.View style={[styles.tituloBox, { opacity: tituloAnim }]}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Create Account</Text>
          </Animated.View>

          <Animated.View style={{ transform: [{ translateX: tremer }] }}>
            {/* Nome */}
            <Entrada atraso={100}>
              <TextInput
                style={[styles.input, foco === 'nome' && styles.inputFoco]}
                placeholder="Name"
                placeholderTextColor="#B8B0C8"
                value={name}
                onChangeText={setName}
                onFocus={() => setFoco('nome')}
                onBlur={() => setFoco('')}
                editable={!loading}
              />
            </Entrada>

            {/* Username */}
            <Entrada atraso={180}>
              <TextInput
                style={[styles.input, foco === 'username' && styles.inputFoco]}
                placeholder="Username"
                placeholderTextColor="#B8B0C8"
                value={username}
                onChangeText={setUsername}
                onFocus={() => setFoco('username')}
                onBlur={() => setFoco('')}
                autoCapitalize="none"
                editable={!loading}
              />
            </Entrada>

            {/* Data de nascimento (não é enviada para a API) */}
            <Entrada atraso={260}>
              <View style={[styles.fieldBox, foco === 'nascimento' && styles.inputFoco]}>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Date of Birth"
                  placeholderTextColor="#B8B0C8"
                  value={birthDate}
                  onChangeText={setBirthDate}
                  onFocus={() => setFoco('nascimento')}
                  onBlur={() => setFoco('')}
                  keyboardType="numbers-and-punctuation"
                  editable={!loading}
                />
                <TouchableOpacity onPress={showBirthInfo}>
                  <Ionicons name="information-circle-outline" size={22} color="#E6E0F0" />
                </TouchableOpacity>
              </View>
            </Entrada>

            {/* Email */}
            <Entrada atraso={340}>
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
            <Entrada atraso={420}>
              <View style={[styles.fieldBox, foco === 'senha' && styles.inputFoco]}>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Password"
                  placeholderTextColor="#B8B0C8"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFoco('senha')}
                  onBlur={() => setFoco('')}
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
              </View>
            </Entrada>

            {/* Mensagens */}
            {error !== '' && <Text style={styles.error}>{error}</Text>}

            {success && <Sucesso onIrLogin={() => navigation.navigate('SignIn')} />}

            {/* Botão cadastrar */}
            <Entrada atraso={500}>
              <BotaoAnimado
                onPress={handleSignUp}
                disabled={loading}
                style={[styles.signUpButton, loading && styles.buttonDisabled]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.signUpText}>Sign up</Text>
                )}
              </BotaoAnimado>
            </Entrada>
          </Animated.View>

          {/* Termos */}
          <Entrada atraso={580}>
            <Text style={styles.terms}>
              By continuing, you agree to our Terms and Privacy Policy.
            </Text>

            {/* Google */}
            <TouchableOpacity style={styles.googleButton}>
              <Ionicons name="logo-google" size={18} color="#fff" />
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>
          </Entrada>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  logo: {
    width: 60,
    height: 60,
    borderRadius: 14,
    marginBottom: 12,
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
  fieldBox: {
    backgroundColor: '#4B4163',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  fieldInput: {
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
  sucessoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(155, 231, 176, 0.12)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  success: {
    color: '#9BE7B0',
    fontSize: 13,
    marginBottom: 6,
  },
  goLogin: {
    color: '#fff',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  signUpButton: {
    backgroundColor: '#6A5BD6',
    borderRadius: 26,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signUpText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  terms: {
    color: '#B8B0C8',
    textAlign: 'center',
    fontSize: 11,
    marginTop: 14,
    marginBottom: 16,
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