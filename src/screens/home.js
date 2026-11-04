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
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Rajdhani_500Medium, Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { TOKEN_KEY } from '../services/api';
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

function CartaoJogo({ jogo, indice, favorito, onPress, onFavorito }) {
  const entrada = useRef(new Animated.Value(0)).current;
  const [imagemFalhou, setImagemFalhou] = useState(false);

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 350,
      delay: indice * 50,
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
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
      >
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

          <TouchableOpacity style={styles.coracao} onPress={onFavorito} activeOpacity={0.7}>
            <Ionicons
              name={favorito ? 'heart' : 'heart-outline'}
              size={18}
              color={favorito ? ROSA : BRANCO}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardTitulo} numberOfLines={1}>
            {jogo.title}
          </Text>
          {jogo.console ? <Text style={styles.cardConsole}>{jogo.console}</Text> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Botão da barra de baixo
function ItemBarra({ icone, iconeAtivo, texto, ativo, onPress }) {
  return (
    <TouchableOpacity style={styles.barraItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.barraIcone, ativo && styles.barraIconeAtivo]}>
        <Ionicons
          name={ativo ? iconeAtivo : icone}
          size={24}
          color={ativo ? BRANCO : TEXTO_SUAVE}
        />
      </View>
      <Text style={[styles.barraTexto, ativo && styles.barraTextoAtivo]}>{texto}</Text>
    </TouchableOpacity>
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
  const [atualizando, setAtualizando] = useState(false);

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

  let textoVazio = 'Nenhum save ainda';
  if (showCards) {
    textoVazio =
      activeTab === 'Recent' && recentes.length === 0 ? 'Nenhum jogo recente' : 'Nenhum jogo encontrado';
  }

  // Painel da conta abre e fecha com animação
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

  function limparRecentes() {
    setRecentes([]);
    AsyncStorage.removeItem(RECENTES_KEY).catch(() => {});
    setMenuOpen(false);
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

  function irParaGames() {
    setMenuOpen(false);
    setActiveTab('Games');
  }

  function irParaAmigos() {
    setMenuOpen(false);
    navigation.navigate('Friends');
  }

  const menuDeslizar = menuAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });

  // espera a fonte carregar
  if (!fontesProntas) {
    return <View style={{ flex: 1, backgroundColor: FUNDO_TOPO }} />;
  }

  return (
    <LinearGradient colors={[FUNDO_TOPO, FUNDO_BASE]} style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Cabeçalho */}
        <View style={styles.cabecalho}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} />
          <Text style={styles.titulo}>archv.rooms</Text>
        </View>

        {/* Abas */}
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {NOME_ABA[tab]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {erro !== '' && <Text style={styles.erro}>{erro}</Text>}

        {/* Busca e filtros */}
        {showCards && (
          <>
            <View style={styles.busca}>
              <Ionicons name="search" size={20} color={TEXTO_SUAVE} />
              <TextInput
                style={styles.buscaInput}
                placeholder="Buscar jogo"
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
                    {c === 'All' ? 'Todos' : c === 'Favorites' ? 'Favoritos' : c}
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
          <View style={styles.empty}>
            <View style={styles.emptyIcone}>
              <Ionicons
                name={showCards ? 'game-controller-outline' : 'save-outline'}
                size={34}
                color={TEXTO_SUAVE}
              />
            </View>
            <Text style={styles.emptyText}>{textoVazio}</Text>
          </View>
        )}
      </View>

      {/* Barra de baixo flutuante */}
      <View style={styles.barra}>
        <ItemBarra
          icone="game-controller-outline"
          iconeAtivo="game-controller"
          texto="Jogos"
          ativo={!menuOpen}
          onPress={irParaGames}
        />
        <ItemBarra
          icone="people-outline"
          iconeAtivo="people"
          texto="Amigos"
          ativo={false}
          onPress={irParaAmigos}
        />
        <ItemBarra
          icone="albums-outline"
          iconeAtivo="albums"
          texto="Salas"
          ativo={false}
          onPress={() => setMenuOpen(false)}
        />
        <ItemBarra
          icone="person-circle-outline"
          iconeAtivo="person-circle"
          texto="Conta"
          ativo={menuOpen}
          onPress={() => setMenuOpen(!menuOpen)}
        />
      </View>

      {/* Fecha o painel ao tocar fora */}
      {menuOpen && (
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />
      )}

      {/* Painel da conta */}
      <Animated.View
        pointerEvents={menuOpen ? 'auto' : 'none'}
        style={[
          styles.menuWrapper,
          { opacity: menuAnim, transform: [{ translateY: menuDeslizar }] },
        ]}
      >
        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings-outline" size={20} color={BRANCO} />
            <Text style={styles.menuText}>Ajustes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="information-circle-outline" size={20} color={BRANCO} />
            <Text style={styles.menuText}>Sobre</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={limparRecentes}>
            <Ionicons name="time-outline" size={20} color={BRANCO} />
            <Text style={styles.menuText}>Limpar recentes</Text>
          </TouchableOpacity>
          <View style={styles.menuDivisor} />
          <TouchableOpacity style={styles.menuItem} onPress={handleExit}>
            <Ionicons name="log-out-outline" size={20} color={ERRO} />
            <Text style={[styles.menuText, { color: ERRO }]}>Sair</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
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
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: ROXO_BOTAO,
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
    backgroundColor: SUPERFICIE,
    borderRadius: 18,
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
    paddingBottom: 130,
  },
  cardWrap: {
    width: '48%',
    marginBottom: 16,
  },
  card: {
    backgroundColor: SUPERFICIE,
    borderRadius: 22,
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
  coracao: {
    position: 'absolute',
    top: 8,
    right: 8,
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

  // Barra de baixo flutuante
  barra: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: Platform.OS === 'ios' ? 28 : 16,
    flexDirection: 'row',
    backgroundColor: 'rgba(36,29,60,0.98)',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  barraItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  barraIcone: {
    width: 56,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barraIconeAtivo: {
    backgroundColor: ROXO_BOTAO,
  },
  barraTexto: {
    fontFamily: TEXTO_SEMI,
    color: TEXTO_SUAVE,
    fontSize: 13,
  },
  barraTextoAtivo: {
    color: BRANCO,
    fontFamily: TEXTO_BOLD,
  },

  // Painel da conta (aparece em cima do botão Conta)
  menuWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 112 : 100,
    right: 20,
    width: 210,
  },
  menu: {
    backgroundColor: SUPERFICIE_CLARA,
    borderRadius: 20,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuText: {
    fontFamily: TEXTO_SEMI,
    color: BRANCO,
    fontSize: 17,
  },
  menuDivisor: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 4,
    marginHorizontal: 14,
  },
});