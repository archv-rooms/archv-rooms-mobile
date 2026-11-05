import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Rajdhani_500Medium, Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../services/api';
import { MODO_TESTE } from '../services/mock';
import {
  listarAmigos,
  listarPendentes,
  buscarUsuarios,
  convidar,
  responder,
} from '../services/friends';

const NATIVO = Platform.OS !== 'web';
const TEXTO_SEMI = 'Rajdhani_600SemiBold';
const TEXTO_BOLD = 'Rajdhani_700Bold';

// Cores (as mesmas da home)
const FUNDO_TOPO = '#14111F';
const FUNDO_BASE = '#221B38';
const SUPERFICIE = '#2D2545';
const SUPERFICIE_CLARA = '#3A3058';
const ACENTO = '#8E7CF0';
const ROXO_BOTAO = '#6A5BD6';
const BRANCO = '#FFFFFF';
const TEXTO_SUAVE = '#B4AACB';
const VERDE = '#4ADE80';
const ERRO = '#FF9AA8';

// Cores dos avatares
const CORES_AVATAR = ['#8E7CF0', '#FF6B8A', '#3F8CFF', '#FFB23C', '#7CE06B', '#C77CFF', '#FF4D4D'];

function corDoNome(nome) {
  let soma = 0;
  for (let i = 0; i < nome.length; i++) soma += nome.charCodeAt(i);
  return CORES_AVATAR[soma % CORES_AVATAR.length];
}

// ─── Animações reutilizáveis ───

function useFlutuar(amplitude, duracao) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 1,
          duration: duracao,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVO,
        }),
        Animated.timing(v, {
          toValue: 0,
          duration: duracao,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVO,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return v.interpolate({ inputRange: [0, 1], outputRange: [-amplitude, amplitude] });
}

function Toque({ onPress, wrapStyle, style, children, escala = 0.93, disabled }) {
  const s = useRef(new Animated.Value(1)).current;

  function dentro() {
    Animated.spring(s, {
      toValue: escala,
      useNativeDriver: NATIVO,
      speed: 50,
      bounciness: 0,
    }).start();
  }

  function fora() {
    Animated.spring(s, {
      toValue: 1,
      useNativeDriver: NATIVO,
      speed: 18,
      bounciness: 14,
    }).start();
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={dentro}
      onPressOut={fora}
      disabled={disabled}
      style={wrapStyle}
    >
      <Animated.View style={[style, { transform: [{ scale: s }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

function Entrada({ atraso = 0, style, children }) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(atraso),
      Animated.spring(v, {
        toValue: 1,
        useNativeDriver: NATIVO,
        tension: 70,
        friction: 10,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

function LinhaAnimada({ indice, children }) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(Math.min(indice, 8) * 60),
      Animated.spring(v, {
        toValue: 1,
        useNativeDriver: NATIVO,
        tension: 60,
        friction: 9,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
          { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

function FundoOrbes() {
  const a = useFlutuar(26, 5200);
  const b = useFlutuar(32, 6800);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.orbe1, { transform: [{ translateY: a }, { translateX: b }] }]} />
      <Animated.View style={[styles.orbe2, { transform: [{ translateY: b }, { translateX: a }] }]} />
    </View>
  );
}

function Avatar({ nome }) {
  const cor = corDoNome(nome);
  return (
    <View style={[styles.avatar, { backgroundColor: cor + '30', borderColor: cor + '66' }]}>
      <Text style={[styles.avatarTexto, { color: cor }]}>
        {(nome || '?').trim().charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

function BotaoAdicionar({ enviado, onPress }) {
  const s = useRef(new Animated.Value(1)).current;
  const primeira = useRef(true);

  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    if (enviado) {
      s.setValue(0.7);
      Animated.spring(s, {
        toValue: 1,
        useNativeDriver: NATIVO,
        speed: 14,
        bounciness: 20,
      }).start();
    }
  }, [enviado]);

  return (
    <Toque onPress={onPress} disabled={enviado} escala={0.88}>
      <Animated.View
        style={[styles.botao, enviado && styles.botaoEnviado, { transform: [{ scale: s }] }]}
      >
        {enviado && <Ionicons name="checkmark" size={16} color={VERDE} />}
        <Text style={[styles.botaoTexto, enviado && { color: VERDE }]}>
          {enviado ? 'Enviado' : 'Adicionar'}
        </Text>
      </Animated.View>
    </Toque>
  );
}

function EstadoVazio({ icone, texto }) {
  const flutua = useFlutuar(6, 1600);

  return (
    <Entrada style={styles.vazio}>
      <Animated.View style={[styles.vazioIcone, { transform: [{ translateY: flutua }] }]}>
        <Ionicons name={icone} size={34} color={TEXTO_SUAVE} />
      </Animated.View>
      <Text style={styles.vazioTexto}>{texto}</Text>
    </Entrada>
  );
}

export default function FriendsScreen({ navigation }) {
  const [fontesProntas] = useFonts({
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
  });

  const [logado, setLogado] = useState(true);
  const [amigos, setAmigos] = useState([]);
  const [pendentes, setPendentes] = useState([]);
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState([]);

  const foco = useRef(new Animated.Value(0)).current;

  async function carregar() {
    try {
      setAmigos(await listarAmigos());
      setPendentes(await listarPendentes());
    } catch (e) {}
  }

  useEffect(() => {
    async function iniciar() {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token && !MODO_TESTE) {
        setLogado(false);
        return;
      }
      carregar();
    }
    iniciar();
  }, []);

  async function pesquisar(texto) {
    setBusca(texto);
    if (!texto.trim()) {
      setResultados([]);
      return;
    }
    try {
      setResultados(await buscarUsuarios(texto));
    } catch (e) {}
  }

  async function enviarConvite(id) {
    try {
      await convidar(id);
      setResultados(resultados.map((u) => (u.id === id ? { ...u, requestSent: true } : u)));
    } catch (e) {}
  }

  async function responderConvite(id, status) {
    try {
      await responder(id, status);
      if (MODO_TESTE) {
        setPendentes((lista) => lista.filter((x) => x.id !== id));
        return;
      }
      carregar();
    } catch (e) {}
  }

  function nomeDe(u) {
    return u.username || u.name || 'User';
  }

  // Convida o amigo para uma sala: abre a tela de Salas já criando a sala
  function convidarParaSala(amigo) {
    navigation.navigate('Rooms', { invite: nomeDe(amigo), ts: Date.now() });
  }

  function focarBusca() {
    Animated.timing(foco, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  }

  function desfocarBusca() {
    Animated.timing(foco, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  }

  const buscaBorda = foco.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(142,124,240,0)', ACENTO],
  });
  const buscaFundo = foco.interpolate({
    inputRange: [0, 1],
    outputRange: [SUPERFICIE, SUPERFICIE_CLARA],
  });

  const buscando = busca.trim() !== '';

  if (!fontesProntas) {
    return <View style={{ flex: 1, backgroundColor: FUNDO_TOPO }} />;
  }

  return (
    <LinearGradient colors={[FUNDO_TOPO, FUNDO_BASE]} style={{ flex: 1 }}>
      <FundoOrbes />

      <View style={styles.container}>
        {/* Cabeçalho */}
        <Entrada style={styles.topo}>
          <Toque onPress={() => navigation.goBack()} style={styles.voltar} escala={0.82}>
            <Ionicons name="arrow-back" size={22} color={BRANCO} />
          </Toque>
          <View style={{ flex: 1 }}>
            <Text style={styles.titulo}>Amigos</Text>
            {logado && (
              <Text style={styles.subtitulo}>
                {amigos.length} {amigos.length === 1 ? 'amigo' : 'amigos'}
                {pendentes.length > 0 ? '  •  ' + pendentes.length + ' pedido(s)' : ''}
              </Text>
            )}
          </View>
        </Entrada>

        {!logado ? (
          <EstadoVazio
            icone="lock-closed-outline"
            texto="Entre na sua conta para ver seus amigos"
          />
        ) : (
          <>
            {/* Busca */}
            <Entrada atraso={100}>
              <Animated.View
                style={[styles.busca, { borderColor: buscaBorda, backgroundColor: buscaFundo }]}
              >
                <Ionicons name="search" size={20} color={TEXTO_SUAVE} />
                <TextInput
                  style={styles.buscaInput}
                  placeholder="Buscar usuários"
                  placeholderTextColor={TEXTO_SUAVE}
                  value={busca}
                  onChangeText={pesquisar}
                  onFocus={focarBusca}
                  onBlur={desfocarBusca}
                  autoCapitalize="none"
                />
                {busca !== '' && (
                  <Toque onPress={() => pesquisar('')} escala={0.8}>
                    <Ionicons name="close-circle" size={20} color={TEXTO_SUAVE} />
                  </Toque>
                )}
              </Animated.View>
            </Entrada>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 130 }}
            >
              {/* Resultados da busca */}
              {buscando &&
                resultados.map((u, i) => (
                  <LinhaAnimada key={'busca-' + u.id} indice={i}>
                    <View style={styles.linha}>
                      <Avatar nome={nomeDe(u)} />
                      <Text style={styles.nome} numberOfLines={1}>
                        {nomeDe(u)}
                      </Text>
                      <BotaoAdicionar
                        enviado={!!u.requestSent}
                        onPress={() => enviarConvite(u.id)}
                      />
                    </View>
                  </LinhaAnimada>
                ))}

              {buscando && resultados.length === 0 && (
                <EstadoVazio key="sem-resultado" icone="person-outline" texto="Nenhum usuário encontrado" />
              )}

              {/* Pedidos */}
              {!buscando && pendentes.length > 0 && (
                <>
                  <View style={styles.secaoCabecalho}>
                    <Text style={styles.secao}>Pedidos</Text>
                    <View style={styles.selo}>
                      <Text style={styles.seloTexto}>{pendentes.length}</Text>
                    </View>
                  </View>
                  {pendentes.map((p, i) => {
                    const nome = nomeDe(p.sender || p.user || p);
                    return (
                      <LinhaAnimada key={'pedido-' + p.id} indice={i}>
                        <View style={styles.linha}>
                          <Avatar nome={nome} />
                          <Text style={styles.nome} numberOfLines={1}>
                            {nome}
                          </Text>
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <Toque
                              onPress={() => responderConvite(p.id, 'accepted')}
                              style={[styles.botaoIcone, { backgroundColor: ROXO_BOTAO }]}
                              escala={0.8}
                            >
                              <Ionicons name="checkmark" size={20} color={BRANCO} />
                            </Toque>
                            <Toque
                              onPress={() => responderConvite(p.id, 'rejected')}
                              style={[styles.botaoIcone, { backgroundColor: SUPERFICIE_CLARA }]}
                              escala={0.8}
                            >
                              <Ionicons name="close" size={20} color={ERRO} />
                            </Toque>
                          </View>
                        </View>
                      </LinhaAnimada>
                    );
                  })}
                </>
              )}

              {/* Amigos */}
              {!buscando && (
                <>
                  <View style={styles.secaoCabecalho}>
                    <Text style={styles.secao}>Amigos</Text>
                  </View>
                  {amigos.length === 0 && (
                    <EstadoVazio key="sem-amigos" icone="people-outline" texto="Nenhum amigo ainda" />
                  )}
                  {amigos.map((a, i) => (
                    <LinhaAnimada key={'amigo-' + a.id} indice={i}>
                      <Toque
                        style={styles.linha}
                        onPress={() => navigation.navigate('Chat', { friend: a })}
                        escala={0.96}
                      >
                        <Avatar nome={nomeDe(a)} />
                        <Text style={styles.nome} numberOfLines={1}>
                          {nomeDe(a)}
                        </Text>
                        <Toque
                          onPress={() => convidarParaSala(a)}
                          style={styles.botaoConvidar}
                          escala={0.88}
                        >
                          <Ionicons name="game-controller" size={16} color={BRANCO} />
                          <Text style={styles.botaoTexto}>Convidar</Text>
                        </Toque>
                        <View style={styles.chatIcone}>
                          <Ionicons name="chatbubble" size={16} color={BRANCO} />
                        </View>
                      </Toque>
                    </LinhaAnimada>
                  ))}
                </>
              )}
            </ScrollView>
          </>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
  },

  // Luzes de fundo
  orbe1: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(142,124,240,0.14)',
  },
  orbe2: {
    position: 'absolute',
    bottom: 80,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(106,91,214,0.12)',
  },

  // Cabeçalho
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  voltar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontFamily: TEXTO_BOLD,
    color: BRANCO,
    fontSize: 28,
    letterSpacing: 0.5,
  },
  subtitulo: {
    fontFamily: TEXTO_SEMI,
    color: TEXTO_SUAVE,
    fontSize: 14,
    marginTop: -2,
  },

  // Busca
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 50,
  },
  buscaInput: {
    flex: 1,
    height: '100%',
    color: BRANCO,
    fontFamily: TEXTO_SEMI,
    fontSize: 18,
  },

  // Seções
  secaoCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 22,
    marginBottom: 10,
  },
  secao: {
    fontFamily: TEXTO_BOLD,
    color: TEXTO_SUAVE,
    fontSize: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  selo: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: ROXO_BOTAO,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACENTO,
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  seloTexto: {
    fontFamily: TEXTO_BOLD,
    color: BRANCO,
    fontSize: 13,
  },

  // Linhas
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: SUPERFICIE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    height: 64,
    marginBottom: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    fontFamily: TEXTO_BOLD,
    fontSize: 20,
  },
  nome: {
    flex: 1,
    fontFamily: TEXTO_BOLD,
    color: BRANCO,
    fontSize: 18,
  },
  chatIcone: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: ROXO_BOTAO,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACENTO,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },

  // Botões
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ROXO_BOTAO,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  botaoConvidar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: SUPERFICIE_CLARA,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  botaoEnviado: {
    backgroundColor: 'rgba(74,222,128,0.14)',
  },
  botaoTexto: {
    fontFamily: TEXTO_BOLD,
    color: BRANCO,
    fontSize: 15,
  },
  botaoIcone: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Estado vazio
  vazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 50,
  },
  vazioIcone: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vazioTexto: {
    fontFamily: TEXTO_SEMI,
    color: TEXTO_SUAVE,
    fontSize: 18,
    textAlign: 'center',
  },
});