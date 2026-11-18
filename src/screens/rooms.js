import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { useFonts } from 'expo-font';
import { MOCK_ROOMS } from '../services/mock';
import { vibrate } from '../services/settings';
import { takeLobbyLeave } from '../services/lobbyLeave';
import { FRIEND_USERNAMES, getCover, getStatus, hostLabel } from '../services/roomHelpers';
import PressableScale from '../components/PressableScale';
import FadeIn from '../components/FadeIn';
import Cover from '../components/Cover';
import LiveDot from '../components/LiveDot';
import RoomAvatars from '../components/RoomAvatars';
import JoinButton from '../components/JoinButton';
import CreateRoomModal from '../components/CreateRoomModal';
import useFloat from '../hooks/useFloat';
import {
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
  GREEN,
} from '../constants/palette';

const NATIVE = Platform.OS !== 'web';

const FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'open', label: 'Abertas' },
  { key: 'friends', label: 'Amigos' },
];

const SECTION_TITLE = {
  all: 'Todas as salas',
  open: 'Salas abertas',
  friends: 'Salas de amigos',
};

function EmptyState({ onCreate }) {
  const float = useFloat(6, 1600);
  return (
    <FadeIn style={styles.empty}>
      <Animated.View style={[styles.emptyIcon, { transform: [{ translateY: float }] }]}>
        <Ionicons name="game-controller-outline" size={34} color={TEXT_MUTED} />
      </Animated.View>
      <Text style={styles.emptyText}>Nenhuma sala por aqui</Text>
      <PressableScale onPress={onCreate} style={styles.emptyButton} scale={0.92}>
        <Ionicons name="add" size={18} color={WHITE} />
        <Text style={styles.createText}>Criar sala</Text>
      </PressableScale>
    </FadeIn>
  );
}

export default function RoomsScreen({ route, navigation }) {
  const [fontsLoaded] = useFonts({ Rajdhani_600SemiBold, Rajdhani_700Bold });
  const [rooms, setRooms] = useState(MOCK_ROOMS);
  const [joinedIds, setJoinedIds] = useState([]);
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [carouselW, setCarouselW] = useState(Dimensions.get('window').width - 40);
  const [tabsWidth, setTabsWidth] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const carouselRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const filterAnim = useRef(new Animated.Value(0)).current;

  const inviteName = route?.params?.invite;
  const inviteTs = route?.params?.ts;

  // Chegou um convite vindo da tela de Amigos: cria a sala, avisa e abre o lobby
  useEffect(() => {
    if (!inviteName) return undefined;
    const room = {
      id: 'r' + Date.now(),
      game: 'Street Fighter II',
      host: 'você',
      players: 1,
      maxPlayers: 2,
    };
    setRooms((list) => [room, ...list]);
    setJoinedIds((list) => [...list, room.id]);
    setNotice('Convite enviado para ' + inviteName);
    vibrate(40);
    navigation.navigate('Lobby', { room, invited: inviteName });
    const timer = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(timer);
  }, [inviteName, inviteTs]);

  // Voltou do lobby: atualiza a lista (sala fechada ou vaga liberada)
  useFocusEffect(
    useCallback(() => {
      const left = takeLobbyLeave();
      if (!left) return;
      if (left.closed) {
        setRooms((list) => list.filter((r) => r.id !== left.id));
      } else {
        setRooms((list) => list.map((r) => (r.id === left.id ? { ...r, players: left.players } : r)));
      }
      setJoinedIds((list) => list.filter((j) => j !== left.id));
    }, [])
  );

  // Quando entra/sai de uma sala, o carrossel volta pro primeiro destaque
  useEffect(() => {
    const node = carouselRef.current;
    if (node && node.scrollTo) node.scrollTo({ x: 0, animated: false });
  }, [joinedIds.length]);

  // A pílula do filtro desliza
  const filterIndex = FILTERS.findIndex((f) => f.key === filter);
  useEffect(() => {
    Animated.spring(filterAnim, {
      toValue: filterIndex,
      useNativeDriver: NATIVE,
      tension: 140,
      friction: 14,
    }).start();
  }, [filterIndex]);

  function openCreate() {
    vibrate(30);
    setShowCreate(true);
  }

  // Cria a sala e abre o lobby como dono
  function confirmCreate(game, maxPlayers) {
    vibrate(30);
    const room = {
      id: 'r' + Date.now(),
      game,
      host: 'você',
      players: 1,
      maxPlayers,
    };
    setRooms([room, ...rooms]);
    setJoinedIds([...joinedIds, room.id]);
    setShowCreate(false);
    navigation.navigate('Lobby', { room });
  }

  // Entra na sala e abre o lobby
  function joinRoom(id) {
    const room = rooms.find((r) => r.id === id);
    if (!room || room.players >= room.maxPlayers) return;
    vibrate(30);
    const updated = { ...room, players: room.players + 1 };
    setRooms(rooms.map((r) => (r.id === id ? updated : r)));
    setJoinedIds([...joinedIds, id]);
    navigation.navigate('Lobby', { room: updated });
  }

  // Sair: se a sala é sua, ela é fechada; senão só libera a vaga
  function leaveRoom(id) {
    vibrate(30);
    const room = rooms.find((r) => r.id === id);
    if (!room) return;
    if (room.host === 'você') {
      setRooms(rooms.filter((r) => r.id !== id));
    } else {
      setRooms(rooms.map((r) => (r.id === id ? { ...r, players: Math.max(1, r.players - 1) } : r)));
    }
    setJoinedIds(joinedIds.filter((j) => j !== id));
  }

  function changeFilter(key) {
    if (key === filter) return;
    vibrate(15);
    setFilter(key);
  }

  // Puxar para atualizar (por enquanto simulado; troque pelo fetch real quando tiver API)
  function onRefresh() {
    setRefreshing(true);
    vibrate(20);
    setTimeout(() => {
      setAnimKey((k) => k + 1);
      setRefreshing(false);
    }, 900);
  }

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: BG_TOP }} />;

  // ---------- Destaques (até 3): sua sala, salas de amigos com vaga, salas mais cheias ----------
  const isOpen = (r) => r.players < r.maxPlayers;
  const isFriend = (r) => FRIEND_USERNAMES.includes(r.host);

  const featuredList = [];
  const addFeatured = (r) => {
    if (r && featuredList.length < 3 && !featuredList.some((f) => f.id === r.id)) featuredList.push(r);
  };
  rooms.filter((r) => joinedIds.includes(r.id)).forEach(addFeatured);
  rooms.filter((r) => isFriend(r) && isOpen(r)).forEach(addFeatured);
  rooms
    .filter(isOpen)
    .sort((a, b) => b.players / b.maxPlayers - a.players / a.maxPlayers)
    .forEach(addFeatured);
  rooms.forEach(addFeatured);

  const counts = {
    all: rooms.length,
    open: rooms.filter(isOpen).length,
    friends: rooms.filter(isFriend).length,
  };

  const list = rooms.filter((r) => {
    if (filter === 'open') return isOpen(r);
    if (filter === 'friends') return isFriend(r);
    return true;
  });

  const tabWidth = tabsWidth > 0 ? (tabsWidth - 8) / FILTERS.length : 0;
  const pillTranslate = filterAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, tabWidth, tabWidth * 2],
  });

  function renderFeatured(room, i) {
    const joined = joinedIds.includes(room.id);
    const full = room.players >= room.maxPlayers;
    const status = getStatus(joined, full);

    const range = [(i - 1) * carouselW, i * carouselW, (i + 1) * carouselW];
    const cardScale = scrollX.interpolate({ inputRange: range, outputRange: [0.92, 1, 0.92], extrapolate: 'clamp' });
    const cardOpacity = scrollX.interpolate({ inputRange: range, outputRange: [0.55, 1, 0.55], extrapolate: 'clamp' });

    return (
      <View key={room.id} style={{ width: carouselW }}>
        <Animated.View style={{ opacity: cardOpacity, transform: [{ scale: cardScale }] }}>
          <View style={styles.featured}>
            <Cover uri={getCover(room.game)} iconSize={56} zoom style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={['rgba(20,17,31,0.6)', 'transparent', 'rgba(20,17,31,0.95)']}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            <View style={styles.featuredStatus}>
              <LiveDot color={status.color} pulse={status.pulse} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>

            <View style={styles.featuredContent}>
              <Text style={styles.featuredGame} numberOfLines={1}>{room.game}</Text>
              <View style={styles.featuredBottom}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sub} numberOfLines={1}>{hostLabel(room)}</Text>
                  <View style={styles.avatarsWrap}>
                    <RoomAvatars room={room} size={26} />
                    <Text style={styles.count}>
                      {room.players}/{room.maxPlayers}
                    </Text>
                  </View>
                </View>
                <JoinButton
                  joined={joined}
                  full={full}
                  onJoin={() => joinRoom(room.id)}
                  onLeave={() => leaveRoom(room.id)}
                />
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <LinearGradient colors={[BG_TOP, BG_BOTTOM]} style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* ---------- Cabeçalho ---------- */}
        <FadeIn style={styles.header}>
          <View>
            <Text style={styles.title}>Salas</Text>
            <View style={styles.subtitleRow}>
              <LiveDot color={GREEN} size={6} pulse={counts.open > 0} />
              <Text style={styles.subtitle}>
                {counts.open === 1 ? '1 sala aberta agora' : counts.open + ' salas abertas agora'}
              </Text>
            </View>
          </View>
          <PressableScale onPress={openCreate} style={styles.createButton} scale={0.92}>
            <Ionicons name="add" size={18} color={WHITE} />
            <Text style={styles.createText}>Criar sala</Text>
          </PressableScale>
        </FadeIn>

        {notice !== '' && (
          <FadeIn key={notice}>
            <View style={styles.notice}>
              <Ionicons name="checkmark-circle" size={20} color={GREEN} />
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          </FadeIn>
        )}

        {/* ---------- Filtros: pílula que desliza (fixos, fora do scroll) ---------- */}
        <FadeIn delay={80}>
          <View style={styles.tabs} onLayout={(e) => setTabsWidth(e.nativeEvent.layout.width)}>
            <Animated.View style={[styles.tabPill, { width: tabWidth, transform: [{ translateX: pillTranslate }] }]} />
            {FILTERS.map((f) => {
              const active = f.key === filter;
              return (
                <PressableScale
                  key={f.key}
                  wrapStyle={{ flex: 1 }}
                  style={styles.tab}
                  onPress={() => changeFilter(f.key)}
                  scale={0.92}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{f.label}</Text>
                  <View style={[styles.tabCount, active && styles.tabCountActive]}>
                    <Text style={[styles.tabCountText, active && { color: WHITE }]}>{counts[f.key]}</Text>
                  </View>
                </PressableScale>
              );
            })}
          </View>
        </FadeIn>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={WHITE}
              colors={[BUTTON_PURPLE]}
              progressBackgroundColor={SURFACE}
            />
          }
        >
          {/* ---------- Destaques ---------- */}
          {featuredList.length > 0 && (
            <FadeIn delay={160}>
              <Text style={[styles.section, { marginTop: 18 }]}>EM DESTAQUE</Text>
              <View style={styles.carouselWrap} onLayout={(e) => setCarouselW(e.nativeEvent.layout.width)}>
                <Animated.ScrollView
                  ref={carouselRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  scrollEventThrottle={16}
                  onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                    useNativeDriver: NATIVE,
                  })}
                >
                  {featuredList.map(renderFeatured)}
                </Animated.ScrollView>

                {featuredList.length > 1 && (
                  <View style={styles.dots} pointerEvents="none">
                    {featuredList.map((r, i) => {
                      const range = [(i - 1) * carouselW, i * carouselW, (i + 1) * carouselW];
                      return (
                        <Animated.View
                          key={r.id}
                          style={[
                            styles.dot,
                            {
                              opacity: scrollX.interpolate({
                                inputRange: range,
                                outputRange: [0.4, 1, 0.4],
                                extrapolate: 'clamp',
                              }),
                              transform: [
                                {
                                  scaleX: scrollX.interpolate({
                                    inputRange: range,
                                    outputRange: [1, 2.6, 1],
                                    extrapolate: 'clamp',
                                  }),
                                },
                              ],
                            },
                          ]}
                        />
                      );
                    })}
                  </View>
                )}
              </View>
            </FadeIn>
          )}

          {/* ---------- Lista ---------- */}
          <View style={styles.sectionRow}>
            <Text style={styles.section}>{SECTION_TITLE[filter].toUpperCase()}</Text>
            <Text style={styles.sectionCount}>{list.length}</Text>
          </View>

          {list.map((room, index) => {
            const joined = joinedIds.includes(room.id);
            const full = room.players >= room.maxPlayers;
            const status = getStatus(joined, full);

            return (
              <FadeIn key={filter + '-' + animKey + '-' + room.id} delay={Math.min(index, 8) * 60}>
                <View style={styles.row}>
                  <Cover uri={getCover(room.game)} style={styles.thumb} iconSize={22} />

                  <View style={styles.rowInfo}>
                    <Text style={styles.rowGame} numberOfLines={1}>{room.game}</Text>
                    <View style={styles.rowMeta}>
                      <LiveDot color={status.color} size={6} pulse={status.pulse} />
                      <Text style={styles.rowHost} numberOfLines={1}>{hostLabel(room)}</Text>
                      <View style={styles.countPill}>
                        <Ionicons name="people" size={12} color={TEXT_MUTED} />
                        <Text style={styles.countPillText}>
                          {room.players}/{room.maxPlayers}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {full && !joined ? (
                    <View style={styles.lockedIcon}>
                      <Ionicons name="lock-closed" size={16} color={TEXT_MUTED} />
                    </View>
                  ) : (
                    <JoinButton
                      compact
                      joined={joined}
                      full={full}
                      onJoin={() => joinRoom(room.id)}
                      onLeave={() => leaveRoom(room.id)}
                    />
                  )}
                </View>
              </FadeIn>
            );
          })}

          {list.length === 0 && <EmptyState onCreate={openCreate} />}
        </ScrollView>

        <CreateRoomModal
          visible={showCreate}
          onClose={() => setShowCreate(false)}
          onConfirm={confirmCreate}
        />
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

  // ---------- Cabeçalho ----------
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 28, letterSpacing: 0.5, lineHeight: 30 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  subtitle: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 14 },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BUTTON_PURPLE,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  createText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 15 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(74,222,128,0.14)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  noticeText: { fontFamily: FONT_BOLD, color: GREEN, fontSize: 16 },

  // ---------- Filtros ----------
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
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabText: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 15 },
  tabTextActive: { color: WHITE, fontFamily: FONT_BOLD },
  tabCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.22)' },
  tabCountText: { fontFamily: FONT_BOLD, color: TEXT_MUTED, fontSize: 12 },

  // ---------- Seções ----------
  section: { fontFamily: FONT_BOLD, color: TEXT_MUTED, fontSize: 13, letterSpacing: 1.5 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  sectionCount: { fontFamily: FONT_BOLD, color: TEXT_MUTED, fontSize: 13 },

  // ---------- Destaque / carrossel ----------
  carouselWrap: { marginTop: 10, marginBottom: 20 },
  featured: {
    height: 176,
    backgroundColor: SURFACE,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  featuredStatus: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  statusText: {
    fontFamily: FONT_BOLD,
    fontSize: 12,
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  featuredContent: { paddingHorizontal: 16, paddingBottom: 14 },
  featuredGame: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 26, lineHeight: 28 },
  featuredBottom: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 4 },
  sub: { fontFamily: FONT_SEMI, color: '#D6CEE8', fontSize: 14 },
  avatarsWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  count: { fontFamily: FONT_BOLD, color: '#D6CEE8', fontSize: 14 },

  dots: {
    position: 'absolute',
    top: 18,
    right: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: WHITE },

  // ---------- Lista ----------
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 10,
    marginBottom: 10,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: SURFACE_LIGHT,
  },
  rowInfo: { flex: 1 },
  rowGame: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 17 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  rowHost: { flexShrink: 1, fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 13 },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 2,
  },
  countPillText: { fontFamily: FONT_BOLD, color: TEXT_MUTED, fontSize: 12 },
  lockedIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ---------- Estado vazio ----------
  empty: { alignItems: 'center', gap: 12, paddingVertical: 30 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 17 },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BUTTON_PURPLE,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 4,
  },
});