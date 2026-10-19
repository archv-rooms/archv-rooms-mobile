import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { TOKEN_KEY } from '../services/api';
import { MODO_TESTE, JOGOS_TESTE } from '../services/mock';

const TABS = ['Recent', 'Games', 'Saves'];
const NATIVO = Platform.OS !== 'web';

// Cartões de exemplo, usados só se a API não responder
const EXEMPLOS = [1, 2, 3, 4, 5, 6].map((n) => ({
  id: 'exemplo-' + n,
  title: 'Game ' + n,
  exemplo: true,
}));

// Cor da etiqueta de cada console
const COR_CONSOLE = {
  NES: '#E4504D',
  SNES: '#8E7CF0',
  SFC: '#8E7CF0',
  MD: '#3F8CFF',
  'MEGA DRIVE': '#3F8CFF',
  GB: '#5FBF6B',
  GBC: '#5FBF6B',
  GBA: '#B06CF0',
  N64: '#F0A63C',
  PS1: '#9AA3B5',
  PSX: '#9AA3B5',
};

function corDoConsole(nome) {
  return COR_CONSOLE[(nome || '').toUpperCase()] || '#6A5E85';
}

// Cartão com animação de entrada e "apertinho" ao tocar
function CartaoJogo({ jogo, indice, onPress }) {
  const entrada = useRef(new Animated.Value(0)).current;
  const escala = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 450,
      delay: indice * 90,
      useNativeDriver: NATIVO,
    }).start();
  }, []);

  function apertar() {
    Animated.spring(escala, { toValue: 0.94, useNativeDriver: NATIVO }).start();
  }

  function soltar() {
    Animated.spring(escala, { toValue: 1, friction: 4, useNativeDriver: NATIVO }).start();
  }

  const deslizar = entrada.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });
  const cor = corDoConsole(jogo.console);
  const inicial = (jogo.title || '?').trim().charAt(0).toUpperCase();

  return (
    <Animated.View
      style={[
        styles.cardWrap,
        { opacity: entrada, transform: [{ translateY: deslizar }, { scale: escala }] },
      ]}
    >
      <Pressable onPress={onPress} onPressIn={apertar} onPressOut={soltar}>
        <View style={styles.card}>
          {jogo.image ? (
            <Image source={{ uri: jogo.image }} style={styles.cardImage} />
          ) : (
            <LinearGradient
              colors={[cor + '55', 'rgba(30,24,48,0.2)']}
              style={styles.cardImage}
            >
              <Text style={[styles.cardInicial, { color: cor }]}>{inicial}</Text>
            </LinearGradient>
          )}

          {jogo.console ? (
            <View style={[styles.badge, { backgroundColor: cor }]}>
              <Text style={styles.badgeText}>{jogo.console}</Text>
            </View>
          ) : null}

          <View style={styles.cardRodape}>
            <Text style={styles.cardText} numberOfLines={2}>
              {jogo.title}
            </Text>
            <Ionicons name="play-circle" size={22} color={cor} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Recent');
  const [menuOpen, setMenuOpen] = useState(false);
  const [games, setGames] = useState(EXEMPLOS);
  const [erro, setErro] = useState('');

  const menuAnim = useRef(new Animated.Value(0)).current;
  const tituloAnim = useRef(new Animated.Value(0)).current;

  const showCards = activeTab === 'Recent' || activeTab === 'Games';
  const lista = Array.isArray(games) ? games : [];

  // Título entra com fade
  useEffect(() => {
    Animated.timing(tituloAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: NATIVO,
    }).start();
  }, []);

  // Menu abre e fecha com animação
  useEffect(() => {
    Animated.timing(menuAnim, {
      toValue: menuOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: NATIVO,
    }).start();
  }, [menuOpen]);

  useEffect(() => {
    async function carregarJogos() {
      if (MODO_TESTE) {
        setGames(JOGOS_TESTE);
        return;
      }
      try {
        const res = await api.get('/games');
        const corpo = res.data;
        let resultado = [];
        if (Array.isArray(corpo)) {
          resultado = corpo;
        } else if (corpo && Array.isArray(corpo.data)) {
          resultado = corpo.data;
        } else if (corpo && corpo.data && Array.isArray(corpo.data.games)) {
          resultado = corpo.data.games;
        }
        if (resultado.length > 0) {
          setGames(resultado);
        }
        setErro('');
      } catch (e) {
        const msg =
          e && e.response && e.response.data && e.response.data.message
            ? e.response.data.message
            : 'Não foi possível carregar os jogos.';
        setErro(msg);
      }
    }
    carregarJogos();
  }, []);

  async function abrirJogo(jogo) {
    if (jogo.exemplo) {
      setErro('Este é um cartão de exemplo. Os jogos reais aparecem quando a API voltar.');
      return;
    }
    try {
      let completo = jogo;
      if (!jogo.fileUrl) {
        const res = await api.get('/games/' + jogo.id);
        completo = res.data && res.data.data ? res.data.data : jogo;
      }
      navigation.navigate('Game', { game: completo });
    } catch (e) {
      let msg = 'Não foi possível abrir o jogo.';
      if (e && e.response && e.response.status === 403) {
        msg = 'Seu plano não permite acesso a este jogo.';
      } else if (e && e.response && e.response.data && e.response.data.message) {
        msg = e.response.data.message;
      }
      setErro(msg);
    }
  }

  async function handleExit() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      // se der erro ao apagar, seguimos para o login mesmo assim
    }
    navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
  }

  const menuDeslizar = menuAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] });

  return (
    <LinearGradient colors={['#1E1830', '#3A2F55', '#5B4A7A']} style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Título */}
        <Animated.View style={[styles.tituloBox, { opacity: tituloAnim }]}>
          <Text style={styles.titulo}>ARCHV ROOMS</Text>
          <Text style={styles.subtitulo}>your space — your game</Text>
        </Animated.View>

        {/* Abas + botão do menu */}
        <View style={styles.header}>
          <View style={styles.tabs}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)} style={styles.menuBotao}>
            <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {erro !== '' && <Text style={styles.erro}>{erro}</Text>}

        {/* Conteúdo da aba */}
        {showCards ? (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {/* key com a aba faz os cartões animarem de novo ao trocar de aba */}
            {lista.map((jogo, i) => (
              <CartaoJogo
                key={activeTab + String(jogo.id)}
                jogo={jogo}
                indice={i}
                onPress={() => abrirJogo(jogo)}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="save-outline" size={40} color="#B8B0C8" />
            <Text style={styles.emptyText}>No saves yet</Text>
          </View>
        )}

        {/* Menu */}
        <Animated.View
          style={[
            styles.menuWrapper,
            {
              opacity: menuAnim,
              transform: [{ translateY: menuDeslizar }],
              pointerEvents: menuOpen ? 'auto' : 'none',
            },
          ]}
        >
          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>Load Rooms</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>www.archvrooms</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>About archvrooms</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.menu, styles.exitBox]} onPress={handleExit}>
            <Text style={styles.menuText}>Exit</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  tituloBox: {
    marginBottom: 18,
  },
  titulo: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 3,
  },
  subtitulo: {
    color: '#B8B0C8',
    fontSize: 12,
    letterSpacing: 1,
    marginTop: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(75, 65, 99, 0.6)',
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#6A5E85',
  },
  tabText: {
    color: '#B8B0C8',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  menuBotao: {
    padding: 6,
  },
  erro: {
    color: '#FF9AA8',
    fontSize: 13,
    marginTop: 12,
  },
  list: {
    flex: 1,
    marginTop: 16,
  },
  listContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  cardWrap: {
    width: '48%',
    marginBottom: 14,
  },
  card: {
    backgroundColor: 'rgba(75, 65, 99, 0.7)',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardImage: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInicial: {
    fontSize: 38,
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  cardRodape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
  },
  cardText: {
    flex: 1,
    color: '#EDE8F7',
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyText: {
    color: '#B8B0C8',
    fontSize: 14,
  },
  menuWrapper: {
    position: 'absolute',
    top: 130,
    right: 20,
    width: 190,
  },
  menu: {
    backgroundColor: 'rgba(75, 65, 99, 0.97)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  menuText: {
    color: '#fff',
    fontSize: 13,
  },
  exitBox: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});