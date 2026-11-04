import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Rajdhani_500Medium, Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { TOKEN_KEY } from '../services/api';
import { MODO_TESTE, JOGOS_TESTE } from '../services/mock';

const TABS = ['Recent', 'Games', 'Saves'];
const NATIVO = Platform.OS !== 'web';
const TEXTO = 'Rajdhani_500Medium';
const TEXTO_SEMI = 'Rajdhani_600SemiBold';
const TEXTO_BOLD = 'Rajdhani_700Bold';

const FAVORITOS_KEY = 'favoritos';
const RECENTES_KEY = 'recentes';
const MAX_RECENTES = 10;

// Mesmas cores das telas de login e cadastro
const ACENTO = '#8E7CF0';
const ROXO_BOTAO = '#6A5BD6';
const FUNDO_ESCURO = '#1E1830';
const SUPERFICIE = '#4B4163';
const TEXTO_SUAVE = '#B8B0C8';

// Cartões de exemplo, usados só se a API não responder
const EXEMPLOS = [1, 2, 3, 4, 5, 6].map((n) => ({
  id: 'exemplo-' + n,
  title: 'Game ' + n,
  exemplo: true,
}));

// Cor de cada console (só um pontinho discreto)
const COR_CONSOLE = {
  NES: '#FF4D4D',
  SNES: '#9B8CFF',
  SFC: '#9B8CFF',
  MD: '#3F8CFF',
  'MEGA DRIVE': '#3F8CFF',
  GB: '#7CE06B',
  GBC: '#7CE06B',
  GBA: '#C77CFF',
  N64: '#FFB23C',
  PS1: '#9AA3B5',
  PSX: '#9AA3B5',
};

function corDoConsole(nome) {
  return COR_CONSOLE[(nome || '').toUpperCase()] || '#8E7CF0';
}

// Letras de "ARCHV ROOMS" flutuando no fundo
const TEXTO_LETRAS = 'ARCHVROOMS';
const QTD_LETRAS = 40;

// Número "aleatório" fixo, para as letras não mudarem de lugar a cada render
function pseudo(n) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const LETRAS = Array.from({ length: QTD_LETRAS }, (_, i) => ({
  l: TEXTO_LETRAS[i % TEXTO_LETRAS.length],
  top: pseudo(i + 1) * 94 + '%',
  left: pseudo(i + 101) * 92 + '%',
  tam: 16 + Math.round(pseudo(i + 201) * 20),
  rot: Math.round(pseudo(i + 301) * 40 - 20) + 'deg',
  amp: 5 + Math.round(pseudo(i + 401) * 7),
  dur: 3500 + Math.round(pseudo(i + 501) * 3000),
  op: 0.1 + pseudo(i + 601) * 0.12,
}));

function LetraFlutuante({ config }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: config.dur,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVO,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: config.dur,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVO,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const subir = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -config.amp] });

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        top: config.top,
        left: config.left,
        fontFamily: TEXTO_BOLD,
        fontSize: config.tam,
        color: '#B8A9FF',
        opacity: config.op,
        transform: [{ translateY: subir }, { rotate: config.rot }],
      }}
    >
      {config.l}
    </Animated.Text>
  );
}

function FundoLetras() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {LETRAS.map((cfg, i) => (
        <LetraFlutuante key={i} config={cfg} />
      ))}
    </View>
  );
}

function CartaoJogo({ jogo, indice, favorito, onPress, onFavorito }) {
  const entrada = useRef(new Animated.Value(0)).current;
  const [imagemFalhou, setImagemFalhou] = useState(false);

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 350,
      delay: indice * 60,
      useNativeDriver: NATIVO,
    }).start();
  }, []);

  const cor = corDoConsole(jogo.console);
  const inicial = (jogo.title || '?').trim().charAt(0).toUpperCase();
  const temImagem = jogo.image && !imagemFalhou;

  return (
    <Animated.View style={[styles.cardWrap, { opacity: entrada }]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
      >
        {temImagem ? (
          <Image
            source={{ uri: jogo.image }}
            style={styles.cardImage}
            fadeDuration={0}
            onError={() => setImagemFalhou(true)}
          />
        ) : (
          <View style={[styles.cardImage, styles.cardSemImagem, { backgroundColor: cor + '26' }]}>
            <Text style={[styles.cardInicial, { color: cor }]}>{inicial}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.coracao} onPress={onFavorito} activeOpacity={0.7}>
          <Ionicons
            name={favorito ? 'heart' : 'heart-outline'}
            size={18}
            color={favorito ? '#FF6B8A' : '#fff'}
          />
        </TouchableOpacity>

        <View style={styles.cardInfo}>
          <Text style={styles.cardText} numberOfLines={2}>
            {jogo.title}
          </Text>
          {jogo.console ? (
            <View style={styles.consoleRow}>
              <View style={[styles.consoleDot, { backgroundColor: cor }]} />
              <Text style={styles.consoleText}>{jogo.console}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }) {
  const [fontesProntas] = useFonts({
    Rajdhani_500Medium,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
  });

  const [activeTab, setActiveTab] = useState('Recent');
  const [menuOpen, setMenuOpen] = useState(false);
  const [games, setGames] = useState(EXEMPLOS);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('All');
  const [favoritos, setFavoritos] = useState([]);
  const [recentes, setRecentes] = useState([]);

  const menuAnim = useRef(new Animated.Value(0)).current;

  const showCards = activeTab === 'Recent' || activeTab === 'Games';
  const lista = Array.isArray(games) ? games : [];

  // Na aba Recent só aparecem os jogos abertos, do mais novo para o mais antigo
  const base =
    activeTab === 'Recent'
      ? recentes.map((id) => lista.find((j) => j.id === id)).filter(Boolean)
      : lista;

  const consoles = ['All', 'Favorites', ...new Set(lista.map((j) => j.console).filter(Boolean))];

  const filtrados = base.filter((j) => {
    const nomeBate = (j.title || '').toLowerCase().includes(busca.trim().toLowerCase());
    let filtroBate = true;
    if (filtro === 'Favorites') filtroBate = favoritos.includes(j.id);
    else if (filtro !== 'All') filtroBate = j.console === filtro;
    return nomeBate && filtroBate;
  });

  let textoVazio = 'No saves yet';
  if (showCards) {
    textoVazio = activeTab === 'Recent' && recentes.length === 0 ? 'No recent games' : 'No games found';
  }

  // Menu abre e fecha com animação
  useEffect(() => {
    Animated.timing(menuAnim, {
      toValue: menuOpen ? 1 : 0,
      duration: 180,
      useNativeDriver: NATIVO,
    }).start();
  }, [menuOpen]);

  // Carrega favoritos e recentes salvos no aparelho
  useEffect(() => {
    async function carregarSalvos() {
      try {
        const fav = await AsyncStorage.getItem(FAVORITOS_KEY);
        const rec = await AsyncStorage.getItem(RECENTES_KEY);
        if (fav) setFavoritos(JSON.parse(fav));
        if (rec) setRecentes(JSON.parse(rec));
      } catch (e) {
        // sem dados salvos, segue vazio
      }
    }
    carregarSalvos();
  }, []);

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

  function alternarFavorito(id) {
    const novos = favoritos.includes(id)
      ? favoritos.filter((f) => f !== id)
      : [...favoritos, id];
    setFavoritos(novos);
    AsyncStorage.setItem(FAVORITOS_KEY, JSON.stringify(novos)).catch(() => {});
  }

  function guardarRecente(id) {
    const novos = [id, ...recentes.filter((r) => r !== id)].slice(0, MAX_RECENTES);
    setRecentes(novos);
    AsyncStorage.setItem(RECENTES_KEY, JSON.stringify(novos)).catch(() => {});
  }

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
      guardarRecente(jogo.id);
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

  const menuDeslizar = menuAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] });

  // espera a fonte carregar
  if (!fontesProntas) {
    return <View style={{ flex: 1, backgroundColor: FUNDO_ESCURO }} />;
  }

  return (
    <LinearGradient colors={['#1E1830', '#3A2F55', '#5B4A7A']} style={{ flex: 1 }}>
      <FundoLetras />
      <View style={styles.container}>
        {/* Logo + Título */}
        <View style={styles.tituloBox}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} />
          <Text style={styles.titulo}>Archv Rooms</Text>
        </View>

        {/* Abas + botão do menu */}
        <View style={styles.header}>
          <View style={styles.tabs}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)} style={styles.menuBotao}>
            <Ionicons name="ellipsis-horizontal" size={22} color="#E6E0F0" />
          </TouchableOpacity>
        </View>

        {erro !== '' && <Text style={styles.erro}>{erro}</Text>}

        {/* Busca e filtros */}
        {showCards && (
          <>
            <View style={styles.busca}>
              <Ionicons name="search-outline" size={20} color={TEXTO_SUAVE} />
              <TextInput
                style={styles.buscaInput}
                placeholder="Search games"
                placeholderTextColor={TEXTO_SUAVE}
                value={busca}
                onChangeText={setBusca}
                autoCapitalize="none"
              />
              {busca !== '' && (
                <TouchableOpacity onPress={() => setBusca('')}>
                  <Ionicons name="close-circle" size={20} color={TEXTO_SUAVE} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.contador}>
              {filtrados.length} {filtrados.length === 1 ? 'game' : 'games'}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filtros}
              contentContainerStyle={{ gap: 8 }}
            >
              {consoles.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.filtro, filtro === c && styles.filtroAtivo]}
                  onPress={() => setFiltro(c)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filtroTexto, filtro === c && styles.filtroTextoAtivo]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Conteúdo da aba */}
        {showCards && filtrados.length > 0 ? (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {filtrados.map((jogo, i) => (
              <CartaoJogo
                key={activeTab + String(jogo.id)}
                jogo={jogo}
                indice={i}
                favorito={favoritos.includes(jogo.id)}
                onPress={() => abrirJogo(jogo)}
                onFavorito={() => alternarFavorito(jogo.id)}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.empty}>
            <Ionicons name={showCards ? 'game-controller-outline' : 'save-outline'} size={36} color={TEXTO_SUAVE} />
            <Text style={styles.emptyText}>{textoVazio}</Text>
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
              <Text style={styles.menuText}>archvrooms</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>About</Text>
            </TouchableOpacity>
            <View style={styles.menuDivisor} />
            <TouchableOpacity style={styles.menuItem} onPress={handleExit}>
              <Text style={[styles.menuText, { color: '#FF9AA8' }]}>Exit</Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: 60,
    paddingBottom: 12,
  },
  tituloBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  titulo: {
    fontFamily: TEXTO_BOLD,
    color: '#fff',
    fontSize: 28,
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: SUPERFICIE,
  },
  tabActive: {
    backgroundColor: ROXO_BOTAO,
  },
  tabText: {
    fontFamily: TEXTO_SEMI,
    color: TEXTO_SUAVE,
    fontSize: 16,
  },
  tabTextActive: {
    color: '#fff',
    fontFamily: TEXTO_BOLD,
  },
  menuBotao: {
    padding: 6,
  },
  erro: {
    fontFamily: TEXTO,
    color: '#FF9AA8',
    fontSize: 15,
    marginTop: 12,
  },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: SUPERFICIE,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    marginTop: 16,
  },
  buscaInput: {
    flex: 1,
    height: '100%',
    color: '#fff',
    fontFamily: TEXTO_SEMI,
    fontSize: 17,
  },
  contador: {
    fontFamily: TEXTO_SEMI,
    color: TEXTO_SUAVE,
    fontSize: 14,
    marginTop: 10,
  },
  filtros: {
    flexGrow: 0,
    marginTop: 12,
  },
  filtro: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  filtroAtivo: {
    backgroundColor: ACENTO,
    borderColor: ACENTO,
  },
  filtroTexto: {
    fontFamily: TEXTO_SEMI,
    color: TEXTO_SUAVE,
    fontSize: 15,
  },
  filtroTextoAtivo: {
    color: '#fff',
    fontFamily: TEXTO_BOLD,
  },
  list: {
    flex: 1,
    marginTop: 16,
  },
  listContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 30,
  },
  cardWrap: {
    width: '48%',
    marginBottom: 18,
  },
  card: {
    backgroundColor: SUPERFICIE,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardImage: {
    height: 110,
    width: '100%',
  },
  cardSemImagem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInicial: {
    fontFamily: TEXTO_BOLD,
    fontSize: 40,
  },
  coracao: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    minHeight: 68,
  },
  cardText: {
    fontFamily: TEXTO_BOLD,
    color: '#fff',
    fontSize: 16,
    lineHeight: 19,
  },
  consoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  consoleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  consoleText: {
    fontFamily: TEXTO_SEMI,
    color: TEXTO_SUAVE,
    fontSize: 13,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontFamily: TEXTO_SEMI,
    color: TEXTO_SUAVE,
    fontSize: 17,
  },
  menuWrapper: {
    position: 'absolute',
    top: 150,
    right: 20,
    width: 190,
  },
  menu: {
    backgroundColor: '#5A4E75',
    borderRadius: 14,
    paddingVertical: 6,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  menuText: {
    fontFamily: TEXTO_SEMI,
    color: '#fff',
    fontSize: 17,
  },
  menuDivisor: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 4,
    marginHorizontal: 12,
  },
});