import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Animated,
  Image,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Rajdhani_500Medium, Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { useFonts } from 'expo-font';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { TEST_MODE, TEST_GAMES } from '../services/mock';
import { listSaves, removeSave } from '../services/saves';
import { loadProfile, DEFAULT_PROFILE } from '../services/profile';
import { Avatar } from './profile';
import { showAlert } from '../components/AppModal';
import PressableScale from '../components/PressableScale';
import FadeIn from '../components/FadeIn';
import useFloat from '../hooks/useFloat';
import {
  FONT,
  FONT_SEMI,
  FONT_BOLD,
  BG_TOP,
  BG_BOTTOM,
  SURFACE,
  SURFACE_LIGHT,
  ACCENT,
  BUTTON_PURPLE,
  WHITE,
  TEXT_MUTED,
  PINK,
  ERROR,
  consoleColor,
} from '../constants/palette';

const TABS = ['Recent', 'Games', 'Saves'];
const TAB_LABEL = { Recent: 'Recentes', Games: 'Jogos', Saves: 'Saves' };
const NATIVE = Platform.OS !== 'web';

const FAVORITES_KEY = 'favoritos';
const RECENTS_KEY = 'recentes';
const MAX_RECENTS = 10;

// Placeholder cards, shown only while the API has not answered
const SAMPLE_GAMES = [1, 2, 3, 4, 5, 6].map((n) => ({
  id: 'sample-' + n,
  title: 'Game ' + n,
  sample: true,
}));

// Heart that pops when favorited
function HeartButton({ favorite, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (favorite) {
      scale.setValue(0.6);
      Animated.spring(scale, { toValue: 1, useNativeDriver: NATIVE, speed: 14, bounciness: 22 }).start();
    }
  }, [favorite]);

  return (
    <PressableScale onPress={onPress} wrapStyle={styles.heartWrap} style={styles.heart} scale={0.8}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons
          name={favorite ? 'heart' : 'heart-outline'}
          size={18}
          color={favorite ? PINK : WHITE}
        />
      </Animated.View>
    </PressableScale>
  );
}

function GameCard({ game, index, favorite, onPress, onToggleFavorite }) {
  const enter = useRef(new Animated.Value(0)).current;
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(Math.min(index, 8) * 70),
      Animated.spring(enter, { toValue: 1, useNativeDriver: NATIVE, tension: 60, friction: 9 }),
    ]).start();
  }, []);

  const color = consoleColor(game.console);
  const initial = (game.title || '?').trim().charAt(0).toUpperCase();
  const hasImage = game.image && !imageFailed;

  return (
    <Animated.View
      style={[
        styles.cardWrap,
        {
          opacity: enter.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
          transform: [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
            { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
          ],
        },
      ]}
    >
      <PressableScale onPress={onPress} style={styles.card} scale={0.95}>
        <View style={styles.thumb}>
          {hasImage ? (
            <Image
              source={{ uri: game.image }}
              style={styles.thumbImage}
              fadeDuration={0}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <View style={[styles.thumbImage, styles.thumbEmpty, { backgroundColor: color + '30' }]}>
              <Text style={[styles.thumbInitial, { color }]}>{initial}</Text>
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(20,17,31,0.75)']}
            style={styles.thumbShade}
            pointerEvents="none"
          />

          <View style={styles.play} pointerEvents="none">
            <Ionicons name="play" size={14} color={WHITE} style={{ marginLeft: 2 }} />
          </View>

          <HeartButton favorite={favorite} onPress={onToggleFavorite} />
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {game.title}
          </Text>
          {game.console ? <Text style={styles.cardConsole}>{game.console}</Text> : null}
        </View>
      </PressableScale>
    </Animated.View>
  );
}

// "Agora há pouco", "5 min atrás", "2 h atrás", "3 d atrás" or the date
function formatSaveDate(iso) {
  const date = new Date(iso);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'Agora há pouco';
  if (minutes < 60) return minutes + ' min atrás';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + ' h atrás';
  const days = Math.floor(hours / 24);
  if (days < 7) return days + ' d atrás';
  return date.toLocaleDateString('pt-BR');
}

// One row in the Saves tab
function SaveItem({ save, index, onPress, onDelete }) {
  const enter = useRef(new Animated.Value(0)).current;
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(Math.min(index, 8) * 60),
      Animated.spring(enter, { toValue: 1, useNativeDriver: NATIVE, tension: 60, friction: 9 }),
    ]).start();
  }, []);

  const color = consoleColor(save.console);
  const initial = (save.title || '?').trim().charAt(0).toUpperCase();
  const hasImage = save.image && !imageFailed;

  function confirmDelete() {
    showAlert('Apagar save', 'Tem certeza que quer apagar este save?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: onDelete },
    ]);
  }

  return (
    <Animated.View
      style={{
        opacity: enter.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
        transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
      }}
    >
      <PressableScale onPress={onPress} style={styles.saveItem} scale={0.97}>
        <View style={[styles.saveThumb, { backgroundColor: color + '30' }]}>
          {hasImage ? (
            <Image
              source={{ uri: save.image }}
              style={styles.saveThumbImage}
              fadeDuration={0}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <Text style={[styles.saveInitial, { color }]}>{initial}</Text>
          )}
        </View>

        <View style={styles.saveBody}>
          <Text style={styles.saveTitle} numberOfLines={1}>
            {save.title}
          </Text>
          <View style={styles.saveMeta}>
            {save.console ? (
              <View style={[styles.saveBadge, { backgroundColor: color + '30' }]}>
                <Text style={[styles.saveBadgeText, { color }]}>{save.console}</Text>
              </View>
            ) : null}
            <Ionicons name="time-outline" size={14} color={TEXT_MUTED} />
            <Text style={styles.saveDate} numberOfLines={1}>
              {formatSaveDate(save.createdAt)}
            </Text>
          </View>
        </View>

        <View style={styles.saveActions}>
          <View style={styles.savePlay} pointerEvents="none">
            <Ionicons name="play" size={16} color={WHITE} style={{ marginLeft: 2 }} />
          </View>
          <PressableScale onPress={confirmDelete} style={styles.saveDelete} scale={0.8}>
            <Ionicons name="trash-outline" size={18} color={PINK} />
          </PressableScale>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

function EmptyState({ icon, text }) {
  const float = useFloat(6, 1600);

  return (
    <FadeIn style={styles.empty}>
      <Animated.View style={[styles.emptyIcon, { transform: [{ translateY: float }] }]}>
        <Ionicons name={icon} size={34} color={TEXT_MUTED} />
      </Animated.View>
      <Text style={styles.emptyText}>{text}</Text>
    </FadeIn>
  );
}

export default function HomeScreen({ navigation }) {
  const [fontsLoaded] = useFonts({ Rajdhani_500Medium, Rajdhani_600SemiBold, Rajdhani_700Bold });

  const [activeTab, setActiveTab] = useState('Recent');
  const [games, setGames] = useState(SAMPLE_GAMES);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [favorites, setFavorites] = useState([]);
  const [recents, setRecents] = useState([]);
  const [saves, setSaves] = useState([]);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [refreshing, setRefreshing] = useState(false);
  const [tabsWidth, setTabsWidth] = useState(0);

  const tabAnim = useRef(new Animated.Value(0)).current;
  const focusAnim = useRef(new Animated.Value(0)).current;
  const logoFloat = useFloat(3, 2200);

  const showCards = activeTab === 'Recent' || activeTab === 'Games';
  const gameList = Array.isArray(games) ? games : [];

  // Recent tab only shows opened games, newest first
  const source =
    activeTab === 'Recent'
      ? recents.map((id) => gameList.find((g) => g.id === id)).filter(Boolean)
      : gameList;

  const consoles = ['All', 'Favorites', ...new Set(gameList.map((g) => g.console).filter(Boolean))];

  const filtered = source.filter((game) => {
    const matchesName = (game.title || '').toLowerCase().includes(search.trim().toLowerCase());
    let matchesFilter = true;
    if (filter === 'Favorites') matchesFilter = favorites.includes(game.id);
    else if (filter !== 'All') matchesFilter = game.console === filter;
    return matchesName && matchesFilter;
  });

  let emptyText = 'Nenhum save ainda';
  if (showCards) {
    emptyText =
      activeTab === 'Recent' && recents.length === 0 ? 'Nenhum jogo recente' : 'Nenhum jogo encontrado';
  }

  // The tab pill slides
  const tabIndex = TABS.indexOf(activeTab);
  useEffect(() => {
    Animated.spring(tabAnim, {
      toValue: tabIndex,
      useNativeDriver: NATIVE,
      tension: 140,
      friction: 14,
    }).start();
  }, [tabIndex]);

  // Load favorites and recents saved on the device
  useEffect(() => {
    async function loadSaved() {
      try {
        const savedFavorites = await AsyncStorage.getItem(FAVORITES_KEY);
        const savedRecents = await AsyncStorage.getItem(RECENTS_KEY);
        if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
        if (savedRecents) setRecents(JSON.parse(savedRecents));
      } catch (e) {}
    }
    loadSaved();
  }, []);

  // Reload the saves and the profile every time this screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      listSaves().then(setSaves);
      loadProfile().then(setProfile);
    }, [])
  );

  async function loadGames() {
    if (TEST_MODE) {
      setGames(TEST_GAMES);
      return;
    }
    try {
      const res = await api.get('/games');
      const body = res.data;
      let result = [];
      if (Array.isArray(body)) {
        result = body;
      } else if (body && Array.isArray(body.data)) {
        result = body.data;
      } else if (body && body.data && Array.isArray(body.data.games)) {
        result = body.data.games;
      }
      if (result.length > 0) setGames(result);
      setError('');
    } catch (e) {
      const message = e?.response?.data?.message || 'Não foi possível carregar os jogos.';
      setError(message);
    }
  }

  async function refresh() {
    setRefreshing(true);
    await loadGames();
    setSaves(await listSaves());
    setRefreshing(false);
  }

  useEffect(() => {
    loadGames();
  }, []);

  function toggleFavorite(id) {
    const next = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id];
    setFavorites(next);
    AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next)).catch(() => {});
  }

  function saveRecent(id) {
    const next = [id, ...recents.filter((r) => r !== id)].slice(0, MAX_RECENTS);
    setRecents(next);
    AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(next)).catch(() => {});
  }

  async function openGame(game) {
    if (game.sample) {
      setError('Este é um cartão de exemplo. Os jogos reais aparecem quando a API voltar.');
      return;
    }
    try {
      let fullGame = game;
      if (!game.fileUrl) {
        const res = await api.get('/games/' + game.id);
        fullGame = res.data && res.data.data ? res.data.data : game;
      }
      saveRecent(game.id);
      navigation.navigate('Game', { game: fullGame });
    } catch (e) {
      let message = 'Não foi possível abrir o jogo.';
      if (e?.response?.status === 403) {
        message = 'Seu plano não permite acesso a este jogo.';
      } else if (e?.response?.data?.message) {
        message = e.response.data.message;
      }
      setError(message);
    }
  }

  // Opens the game and loads the chosen save into it
  function openSave(save) {
    navigation.navigate('Game', {
      game: {
        id: save.gameId,
        title: save.title,
        console: save.console,
        image: save.image,
        fileUrl: save.fileUrl,
      },
      saveId: save.id,
    });
  }

  async function deleteSave(id) {
    try {
      await removeSave(id);
      setSaves(await listSaves());
    } catch (e) {
      setError('Não foi possível apagar o save.');
    }
  }

  function focusSearch() {
    Animated.timing(focusAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  }

  function blurSearch() {
    Animated.timing(focusAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  }

  const tabWidth = tabsWidth > 0 ? (tabsWidth - 8) / TABS.length : 0;
  const tabTranslate = tabAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, tabWidth, tabWidth * 2],
  });

  const searchBorder = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(142,124,240,0)', ACCENT],
  });
  const searchBackground = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SURFACE, SURFACE_LIGHT],
  });

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: BG_TOP }} />;

  return (
    <LinearGradient colors={[BG_TOP, BG_BOTTOM]} style={{ flex: 1 }}>

      <View style={styles.container}>
        <FadeIn style={styles.header}>
          <Animated.Image
            source={require('../../assets/logo.png')}
            style={[styles.logo, { transform: [{ translateY: logoFloat }] }]}
          />
          <Text style={styles.title}>archv.rooms</Text>

          {/* Seu avatar: abre o perfil */}
          <PressableScale
            wrapStyle={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
            scale={0.88}
          >
            <Avatar profile={profile} size={40} />
          </PressableScale>
        </FadeIn>

        <FadeIn delay={100}>
          <View style={styles.tabs} onLayout={(e) => setTabsWidth(e.nativeEvent.layout.width)}>
            <Animated.View
              style={[styles.tabPill, { width: tabWidth, transform: [{ translateX: tabTranslate }] }]}
            />
            {TABS.map((tab) => (
              <PressableScale
                key={tab}
                wrapStyle={{ flex: 1 }}
                style={styles.tab}
                onPress={() => setActiveTab(tab)}
                scale={0.92}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {TAB_LABEL[tab]}
                </Text>
              </PressableScale>
            ))}
          </View>
        </FadeIn>

        {error !== '' && (
          <FadeIn key={error}>
            <Text style={styles.error}>{error}</Text>
          </FadeIn>
        )}

        {showCards && (
          <>
            <FadeIn delay={200}>
              <Animated.View
                style={[styles.search, { borderColor: searchBorder, backgroundColor: searchBackground }]}
              >
                <Ionicons name="search" size={20} color={TEXT_MUTED} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar jogo"
                  placeholderTextColor={TEXT_MUTED}
                  value={search}
                  onChangeText={setSearch}
                  onFocus={focusSearch}
                  onBlur={blurSearch}
                  autoCapitalize="none"
                />
                {search !== '' && (
                  <PressableScale onPress={() => setSearch('')} scale={0.8}>
                    <Ionicons name="close-circle" size={20} color={TEXT_MUTED} />
                  </PressableScale>
                )}
              </Animated.View>
            </FadeIn>

            <FadeIn delay={280}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filters}
                contentContainerStyle={{ gap: 8 }}
              >
                {consoles.map((name) => (
                  <PressableScale
                    key={name}
                    style={[styles.filter, filter === name && styles.filterActive]}
                    onPress={() => setFilter(name)}
                    scale={0.9}
                  >
                    <Text style={[styles.filterText, filter === name && styles.filterTextActive]}>
                      {name === 'All' ? 'Todos' : name === 'Favorites' ? 'Favoritos' : name}
                    </Text>
                  </PressableScale>
                ))}
              </ScrollView>
            </FadeIn>
          </>
        )}

        {showCards && filtered.length > 0 ? (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                tintColor="#fff"
                colors={[ACCENT]}
              />
            }
          >
            {filtered.map((game, i) => (
              <GameCard
                key={activeTab + String(game.id)}
                game={game}
                index={i}
                favorite={favorites.includes(game.id)}
                onPress={() => openGame(game)}
                onToggleFavorite={() => toggleFavorite(game.id)}
              />
            ))}
          </ScrollView>
        ) : activeTab === 'Saves' && saves.length > 0 ? (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.savesContent}
            showsVerticalScrollIndicator={false}
          >
            {saves.map((save, i) => (
              <SaveItem
                key={save.id}
                save={save}
                index={i}
                onPress={() => openSave(save)}
                onDelete={() => deleteSave(save.id)}
              />
            ))}
          </ScrollView>
        ) : (
          <EmptyState
            key={activeTab + emptyText}
            icon={showCards ? 'game-controller-outline' : 'save-outline'}
            text={emptyText}
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

  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  logo: { width: 36, height: 36, resizeMode: 'contain' },
  title: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 28, letterSpacing: 0.5 },
  profileButton: { marginLeft: 'auto' },

  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 24,
    padding: 4,
  },
  tabPill: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 20,
    backgroundColor: BUTTON_PURPLE,
    shadowColor: ACCENT,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  tab: { alignItems: 'center', paddingVertical: 10, borderRadius: 20 },
  tabText: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 17 },
  tabTextActive: { color: WHITE, fontFamily: FONT_BOLD },

  error: { fontFamily: FONT, color: ERROR, fontSize: 15, marginTop: 12 },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 50,
    marginTop: 14,
  },
  searchInput: { flex: 1, height: '100%', color: WHITE, fontFamily: FONT_SEMI, fontSize: 18 },

  filters: { flexGrow: 0, marginTop: 12 },
  filter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: SURFACE,
  },
  filterActive: { backgroundColor: ACCENT },
  filterText: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 16 },
  filterTextActive: { color: WHITE, fontFamily: FONT_BOLD },

  list: { flex: 1, marginTop: 16 },
  listContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 150,
  },
  savesContent: { paddingBottom: 150 },
  cardWrap: { width: '48%', marginBottom: 16 },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  thumb: { width: '100%', aspectRatio: 1.15 },
  thumbImage: { width: '100%', height: '100%' },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  thumbInitial: { fontFamily: FONT_BOLD, fontSize: 48 },
  thumbShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 54 },
  play: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: BUTTON_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  heartWrap: { position: 'absolute', top: 8, right: 8 },
  heart: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 },
  cardTitle: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 17 },
  cardConsole: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 14, marginTop: 1 },

  saveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  saveThumb: {
    width: 64,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveThumbImage: { width: '100%', height: '100%' },
  saveInitial: { fontFamily: FONT_BOLD, fontSize: 28 },
  saveBody: { flex: 1, gap: 6 },
  saveTitle: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 18 },
  saveMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  saveBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  saveBadgeText: { fontFamily: FONT_BOLD, fontSize: 12, letterSpacing: 0.5 },
  saveDate: { flex: 1, fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 14 },
  saveActions: { alignItems: 'center', gap: 8 },
  savePlay: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BUTTON_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  saveDelete: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,107,138,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingBottom: 100 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 18 },
});