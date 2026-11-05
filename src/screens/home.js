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
  Image,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Rajdhani_500Medium, Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { MODO_TESTE, JOGOS_TESTE } from '../services/mock';

const TABS = ['Recent', 'Games', 'Saves'];
const NOME_ABA = { Recent: 'Recentes', Games: 'Jogos', Saves: 'Saves' };
const NATIVO = Platform.OS !== 'web';
const TEXTO = 'Rajdhani_500Medium';
const TEXTO_SEMI = 'Rajdhani_600SemiBold';
const TEXTO_BOLD = 'Rajdhani_700Bold';

const FAVORITOS_KEY = 'favoritos';
const RECENTES_KEY = 'recentes';
const MAX_RECENTES = 10;

// Cores
const FUNDO_TOPO = '#14111F';
const FUNDO_BASE = '#221B38';
const SUPERFICIE = '#2D2545';
const SUPERFICIE_CLARA = '#3A3058';
const ACENTO = '#8E7CF0';
const ROXO_BOTAO = '#6A5BD6';
const BRANCO = '#FFFFFF';
const TEXTO_SUAVE = '#B4AACB';
const ROSA = '#FF6B8A';
const ERRO = '#FF9AA8';

// Cartões de exemplo, usados só se a API não responder
const EXEMPLOS = [1, 2, 3, 4, 5, 6].map((n) => ({
  id: 'exemplo-' + n,
  title: 'Game ' + n,
  exemplo: true,
}));

// Cor de cada console (usada só quando o jogo não tem imagem)
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
  return COR_CONSOLE[(nome || '').toUpperCase()] || ACENTO;
}

// ─── Animações reutilizáveis ───

// Valor que sobe e desce devagar (para flutuar)
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

// Botão que afunda ao tocar e volta com mola
function Toque({ onPress, wrapStyle, style, children, escala = 0.93 }) {
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
    <Pressable onPress={onPress} onPressIn={dentro} onPressOut={fora} style={wrapStyle}>
      <Animated.View style={[style, { transform: [{ scale: s }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

// Entra com fade e subida, com atraso opcional
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

// Luzes roxas se movendo ao fundo
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

// Coração com "pop" ao favoritar
function CoracaoBotao({ favorito, onPress }) {
  const s = useRef(new Animated.Value(1)).current;
  const primeira = useRef(true);

  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    if (favorito) {
      s.setValue(0.6);
      Animated.spring(s, {
        toValue: 1,
        useNativeDriver: NATIVO,
        speed: 14,
        bounciness: 22,
      }).start();
    }
  }, [favorito]);

  return (
    <Toque onPress={onPress} wrapStyle={styles.coracaoWrap} style={styles.coracao} escala={0.8}>
      <Animated.View style={{ transform: [{ scale: s }] }}>
        <Ionicons
          name={favorito ? 'heart' : 'heart-outline'}
          size={18}
          color={favorito ? ROSA : BRANCO}
        />
      </Animated.View>
    </Toque>
  );
}

function CartaoJogo({ jogo, indice, favorito, onPress, onFavorito }) {
  const entrada = useRef(new Animated.Value(0)).current;
  const [imagemFalhou, setImagemFalhou] = useState(false);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(Math.min(indice, 8) * 70),
      Animated.spring(entrada, {
        toValue: 1,
        useNativeDriver: NATIVO,
        tension: 60,
        friction: 9,
      }),
    ]).start();
  }, []);

  const cor = corDoConsole(jogo.console);
  const inicial = (jogo.title || '?').trim().charAt(0).toUpperCase();
  const temImagem = jogo.image && !imagemFalhou;

  return (
    <Animated.View
      style={[
        styles.cardWrap,
        {
          opacity: entrada.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
          transform: [
            { translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
            { scale: entrada.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
          ],
        },
      ]}
    >
      <Toque onPress={onPress} style={styles.card} escala={0.95}>
        <View style={styles.thumb}>
          {temImagem ? (
            <Image
              source={{ uri: jogo.image }}
              style={styles.thumbImg}
              fadeDuration={0}
              onError={() => setImagemFalhou(true)}
            />
          ) : (
            <View style={[styles.thumbImg, styles.thumbVazia, { backgroundColor: cor + '30' }]}>
              <Text style={[styles.thumbInicial, { color: cor }]}>{inicial}</Text>
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(20,17,31,0.75)']}
            style={styles.thumbSombra}
            pointerEvents="none"
          />

          <View style={styles.play} pointerEvents="none">
            <Ionicons name="play" size={14} color={BRANCO} style={{ marginLeft: 2 }} />
          </View>

          <CoracaoBotao favorito={favorito} onPress={onFavorito} />
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardTitulo} numberOfLines={1}>
            {jogo.title}
          </Text>
          {jogo.console ? <Text style={styles.cardConsole}>{jogo.console}</Text> : null}
        </View>
      </Toque>
    </Animated.View>
  );
}

// Tela vazia com ícone flutuando
function EstadoVazio({ icone, texto }) {
  const flutua = useFlutuar(6, 1600);

  return (
    <Entrada style={styles.empty}>
      <Animated.View style={[styles.emptyIcone, { transform: [{ translateY: flutua }] }]}>
        <Ionicons name={icone} size={34} color={TEXTO_SUAVE} />
      </Animated.View>
      <Text style={styles.emptyText}>{texto}</Text>
    </Entrada>
  );
}

export default function HomeScreen({ navigation }) {
  const [fontesProntas] = useFonts({
    Rajdhani_500Medium,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
  });

  const [activeTab, setActiveTab] = useState('Recent');
  const [games, setGames] = useState(EXEMPLOS);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('All');
  const [favoritos, setFavoritos] = useState([]);
  const [recentes, setRecentes] = useState([]);
  const [atualizando, setAtualizando] = useState(false);
  const [larguraTabs, setLarguraTabs] = useState(0);

  const abaAnim = useRef(new Animated.Value(0)).current;
  const foco = useRef(new Animated.Value(0)).current;
  const logoFlutua = useFlutuar(3, 2200);

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

  let textoVazio = 'Nenhum save ainda';
  if (showCards) {
    textoVazio =
      activeTab === 'Recent' && recentes.length === 0 ? 'Nenhum jogo recente' : 'Nenhum jogo encontrado';
  }

  // Pílula das abas desliza
  const indiceAba = TABS.indexOf(activeTab);
  useEffect(() => {
    Animated.spring(abaAnim, {
      toValue: indiceAba,
      useNativeDriver: NATIVO,
      tension: 140,
      friction: 14,
    }).start();
  }, [indiceAba]);

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

  async function atualizar() {
    setAtualizando(true);
    await carregarJogos();
    setAtualizando(false);
  }

  useEffect(() => {
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

  function focarBusca() {
    Animated.timing(foco, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  }

  function desfocarBusca() {
    Animated.timing(foco, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  }

  // Valores calculados das animações
  const larguraAba = larguraTabs > 0 ? (larguraTabs - 8) / TABS.length : 0;
  const abaTranslate = abaAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, larguraAba, larguraAba * 2],
  });

  const buscaBorda = foco.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(142,124,240,0)', ACENTO],
  });
  const buscaFundo = foco.interpolate({
    inputRange: [0, 1],
    outputRange: [SUPERFICIE, SUPERFICIE_CLARA],
  });

  // espera a fonte carregar
  if (!fontesProntas) {
    return <View style={{ flex: 1, backgroundColor: FUNDO_TOPO }} />;
  }

  return (
    <LinearGradient colors={[FUNDO_TOPO, FUNDO_BASE]} style={{ flex: 1 }}>
      <FundoOrbes />

      <View style={styles.container}>
        {/* Cabeçalho */}
        <Entrada style={styles.cabecalho}>
          <Animated.Image
            source={require('../../assets/logo.png')}
            style={[styles.logo, { transform: [{ translateY: logoFlutua }] }]}
          />
          <Text style={styles.titulo}>archv.rooms</Text>
        </Entrada>

        {/* Abas */}
        <Entrada atraso={100}>
          <View style={styles.tabs} onLayout={(e) => setLarguraTabs(e.nativeEvent.layout.width)}>
            <Animated.View
              style={[
                styles.tabPilula,
                { width: larguraAba, transform: [{ translateX: abaTranslate }] },
              ]}
            />
            {TABS.map((tab) => (
              <Toque
                key={tab}
                wrapStyle={{ flex: 1 }}
                style={styles.tab}
                onPress={() => setActiveTab(tab)}
                escala={0.92}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {NOME_ABA[tab]}
                </Text>
              </Toque>
            ))}
          </View>
        </Entrada>

        {erro !== '' && (
          <Entrada key={erro}>
            <Text style={styles.erro}>{erro}</Text>
          </Entrada>
        )}

        {/* Busca e filtros */}
        {showCards && (
          <>
            <Entrada atraso={200}>
              <Animated.View
                style={[styles.busca, { borderColor: buscaBorda, backgroundColor: buscaFundo }]}
              >
                <Ionicons name="search" size={20} color={TEXTO_SUAVE} />
                <TextInput
                  style={styles.buscaInput}
                  placeholder="Buscar jogo"
                  placeholderTextColor={TEXTO_SUAVE}
                  value={busca}
                  onChangeText={setBusca}
                  onFocus={focarBusca}
                  onBlur={desfocarBusca}
                  autoCapitalize="none"
                />
                {busca !== '' && (
                  <Toque onPress={() => setBusca('')} escala={0.8}>
                    <Ionicons name="close-circle" size={20} color={TEXTO_SUAVE} />
                  </Toque>
                )}
              </Animated.View>
            </Entrada>

            <Entrada atraso={280}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filtros}
                contentContainerStyle={{ gap: 8 }}
              >
                {consoles.map((c) => (
                  <Toque
                    key={c}
                    style={[styles.filtro, filtro === c && styles.filtroAtivo]}
                    onPress={() => setFiltro(c)}
                    escala={0.9}
                  >
                    <Text style={[styles.filtroTexto, filtro === c && styles.filtroTextoAtivo]}>
                      {c === 'All' ? 'Todos' : c === 'Favorites' ? 'Favoritos' : c}
                    </Text>
                  </Toque>
                ))}
              </ScrollView>
            </Entrada>
          </>
        )}

        {/* Conteúdo da aba */}
        {showCards && filtrados.length > 0 ? (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={atualizando}
                onRefresh={atualizar}
                tintColor="#fff"
                colors={[ACENTO]}
              />
            }
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
          <EstadoVazio
            key={activeTab + textoVazio}
            icone={showCards ? 'game-controller-outline' : 'save-outline'}
            texto={textoVazio}
          />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    bottom: 120,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(106,91,214,0.12)',
  },

  // Cabeçalho
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  logo: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  titulo: {
    fontFamily: TEXTO_BOLD,
    color: BRANCO,
    fontSize: 28,
    letterSpacing: 0.5,
  },

  // Abas
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 24,
    padding: 4,
  },
  tabPilula: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 20,
    backgroundColor: ROXO_BOTAO,
    shadowColor: ACENTO,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  tab: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 20,
  },
  tabText: {
    fontFamily: TEXTO_SEMI,
    color: TEXTO_SUAVE,
    fontSize: 17,
  },
  tabTextActive: {
    color: BRANCO,
    fontFamily: TEXTO_BOLD,
  },

  erro: {
    fontFamily: TEXTO,
    color: ERRO,
    fontSize: 15,
    marginTop: 12,
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
    marginTop: 14,
  },
  buscaInput: {
    flex: 1,
    height: '100%',
    color: BRANCO,
    fontFamily: TEXTO_SEMI,
    fontSize: 18,
  },

  // Filtros
  filtros: {
    flexGrow: 0,
    marginTop: 12,
  },
  filtro: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: SUPERFICIE,
  },
  filtroAtivo: {
    backgroundColor: ACENTO,
  },
  filtroTexto: {
    fontFamily: TEXTO_SEMI,
    color: TEXTO_SUAVE,
    fontSize: 16,
  },
  filtroTextoAtivo: {
    color: BRANCO,
    fontFamily: TEXTO_BOLD,
  },

  // Lista e cartões
  list: {
    flex: 1,
    marginTop: 16,
  },
  listContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 150,
  },
  cardWrap: {
    width: '48%',
    marginBottom: 16,
  },
  card: {
    backgroundColor: SUPERFICIE,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    aspectRatio: 1.15,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  thumbVazia: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbInicial: {
    fontFamily: TEXTO_BOLD,
    fontSize: 48,
  },
  thumbSombra: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 54,
  },
  play: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: ROXO_BOTAO,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACENTO,
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  coracaoWrap: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  coracao: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  cardTitulo: {
    fontFamily: TEXTO_BOLD,
    color: BRANCO,
    fontSize: 17,
  },
  cardConsole: {
    fontFamily: TEXTO_SEMI,
    color: TEXTO_SUAVE,
    fontSize: 14,
    marginTop: 1,
  },

  // Estado vazio
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingBottom: 100,
  },
  emptyIcone: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: TEXTO_SEMI,
    color: TEXTO_SUAVE,
    fontSize: 18,
  },
});