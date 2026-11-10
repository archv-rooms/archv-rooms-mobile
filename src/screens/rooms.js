import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
  Image,
  Dimensions,
  Animated,
  Easing,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { useFonts } from 'expo-font';
import { MOCK_ROOMS, TEST_GAMES, TEST_FRIENDS } from '../services/mock';
import { vibrate } from '../services/settings';
import { takeLobbyLeave } from './room';

const NATIVE = Platform.OS !== 'web';
const FONT_SEMI = 'Rajdhani_600SemiBold';
const FONT_BOLD = 'Rajdhani_700Bold';

const BG_TOP = '#14111F';
const BG_BOTTOM = '#221B38';
const SURFACE = '#2D2545';
const SURFACE_LIGHT = '#3A3058';
const ACCENT = '#8E7CF0';
const BUTTON_PURPLE = '#6A5BD6';
const WHITE = '#FFFFFF';
const TEXT_MUTED = '#B4AACB';
const SOFT = '#C4BAFF';
const GREEN = '#4ADE80';
const RED = '#FF8A9B';

const GAMES = TEST_GAMES.map((g) => g.title);
const FRIEND_USERNAMES = TEST_FRIENDS.map((f) => f.username);

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

function getCover(name) {
  const found = TEST_GAMES.find((g) => g.title === name);
  return found ? found.image : null;
}

// Só o estado usa cor (aberta, cheia, na sala). Os jogos não têm mais cor própria.
function getStatus(joined, full) {
  if (joined) return { label: 'NA SALA', color: SOFT, pulse: false };
  if (full) return { label: 'CHEIA', color: RED, pulse: false };
  return { label: 'ABERTA', color: GREEN, pulse: true };
}

function hostLabel(room) {
  return room.host === 'você' ? 'Sua sala' : 'Sala de ' + room.host;
}

// ---------- Animações reutilizáveis ----------

// Botão que encolhe ao tocar e volta com mola
function PressableScale({ onPress, wrapStyle, style, children, scale = 0.93 }) {
  const value = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(value, { toValue: scale, useNativeDriver: NATIVE, speed: 50, bounciness: 0 }).start();
  }

  function pressOut() {
    Animated.spring(value, { toValue: 1, useNativeDriver: NATIVE, speed: 18, bounciness: 14 }).start();
  }

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={wrapStyle}>
      <Animated.View style={[style, { transform: [{ scale: value }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

// Aparece com fade e sobe com mola, com atraso opcional
function FadeIn({ delay = 0, style, children }) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(value, { toValue: 1, useNativeDriver: NATIVE, tension: 70, friction: 10 }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
          transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// Valor que sobe e desce devagar
function useFloat(amplitude, duration) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(value, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return value.interpolate({ inputRange: [0, 1], outputRange: [-amplitude, amplitude] });
}

// Bolinha de status; quando pulse é true, ganha um anel que expande
function LiveDot({ color, size = 7, pulse = false }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pulse) return undefined;
    const loop = Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE })
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {pulse && (
        <Animated.View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
            transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }) }],
          }}
        />
      )}
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}

// Capa com fallback neutro; com zoom, a imagem "respira" devagar
function Cover({ uri, style, iconSize = 28, zoom = false }) {
  const [failed, setFailed] = useState(false);
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!zoom) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(scale, { toValue: 0, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [zoom]);

  if (!uri || failed) {
    return (
      <LinearGradient
        colors={[SURFACE_LIGHT, SURFACE]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[style, { alignItems: 'center', justifyContent: 'center' }]}
      >
        <Ionicons name="game-controller" size={iconSize} color={WHITE} style={{ opacity: 0.35 }} />
      </LinearGradient>
    );
  }

  if (!zoom) {
    return <Image source={{ uri }} style={style} resizeMode="cover" onError={() => setFailed(true)} />;
  }

  return (
    <Animated.View
      style={[style, { transform: [{ scale: scale.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }) }] }]}
    >
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setFailed(true)} />
    </Animated.View>
  );
}

// ---------- Peças da tela ----------

// Avatares sobrepostos (o primeiro é o anfitrião)
function Avatars({ room, size = 26 }) {
  const hostInitial = (room.host || '?').charAt(0).toUpperCase();
  return (
    <View style={{ flexDirection: 'row' }}>
      {Array.from({ length: room.maxPlayers }).map((_, i) => {
        const filled = i < room.players;
        return (
          <View
            key={i}
            style={[
              styles.avatar,
              { width: size, height: size, borderRadius: size / 2 },
              i > 0 && { marginLeft: -8 },
              filled ? (i === 0 ? styles.avatarHost : styles.avatarFilled) : styles.avatarEmpty,
            ]}
          >
            {filled &&
              (i === 0 ? (
                <Text style={styles.avatarText}>{hostInitial}</Text>
              ) : (
                <Ionicons name="person" size={size * 0.45} color={WHITE} />
              ))}
          </View>
        );
      })}
    </View>
  );
}

// Botão Entrar / Sair / Cheia. compact vira um botão redondo só com ícone
function JoinButton({ joined, full, onJoin, onLeave, compact }) {
  if (joined) {
    return (
      <PressableScale
        onPress={onLeave}
        style={[compact ? styles.iconButton : styles.joinButton, styles.leaveButton]}
      >
        <Ionicons name="exit-outline" size={compact ? 20 : 16} color={RED} />
        {!compact && <Text style={[styles.joinText, { color: RED }]}>Sair</Text>}
      </PressableScale>
    );
  }
  return (
    <PressableScale
      onPress={full ? undefined : onJoin}
      style={[
        compact ? styles.iconButton : styles.joinButton,
        full ? styles.buttonOff : styles.buttonOn,
      ]}
    >
      <Ionicons
        name={full ? 'lock-closed' : 'play'}
        size={compact ? 18 : 14}
        color={full ? TEXT_MUTED : WHITE}
        style={!full && compact ? { marginLeft: 2 } : null}
      />
      {!compact && <Text style={[styles.joinText, full && { color: TEXT_MUTED }]}>{full ? 'Cheia' : 'Entrar'}</Text>}
    </PressableScale>
  );
}

// Selo de marcado no modal, aparece com um "pop"
function TileCheck() {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: NATIVE, speed: 16, bounciness: 18 }).start();
  }, []);
  return (
    <Animated.View style={[styles.tileCheck, { transform: [{ scale }] }]}>
      <Ionicons name="checkmark" size={14} color={WHITE} />
    </Animated.View>
  );
}

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
  const [selectedGame, setSelectedGame] = useState(GAMES[0]);
  const [selectedMax, setSelectedMax] = useState(2);
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
    setSelectedGame(GAMES[0]);
    setSelectedMax(2);
    setShowCreate(true);
  }

  // Cria a sala e abre o lobby como dono
  function confirmCreate() {
    vibrate(30);
    const room = {
      id: 'r' + Date.now(),
      game: selectedGame,
      host: 'você',
      players: 1,
      maxPlayers: selectedMax,
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
                    <Avatars room={room} size={26} />
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

        {/* ---------- Modal criar sala ---------- */}
        <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Criar sala</Text>

              <Text style={styles.modalLabel}>JOGO</Text>
              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                <View style={styles.grid}>
                  {GAMES.map((g) => {
                    const active = g === selectedGame;
                    return (
                      <PressableScale
                        key={g}
                        wrapStyle={styles.tileWrap}
                        onPress={() => {
                          vibrate(15);
                          setSelectedGame(g);
                        }}
                        style={[styles.tile, active && styles.tileActive]}
                        scale={0.95}
                      >
                        <Cover uri={getCover(g)} iconSize={30} style={StyleSheet.absoluteFill} />
                        <LinearGradient
                          colors={['transparent', 'rgba(20,17,31,0.92)']}
                          locations={[0.25, 1]}
                          style={StyleSheet.absoluteFill}
                          pointerEvents="none"
                        />
                        {active && <TileCheck />}
                        <Text style={styles.tileText} numberOfLines={2}>{g}</Text>
                      </PressableScale>
                    );
                  })}
                </View>
              </ScrollView>

              <Text style={styles.modalLabel}>JOGADORES</Text>
              <View style={styles.maxRow}>
                {[2, 3, 4].map((n) => {
                  const active = n === selectedMax;
                  return (
                    <PressableScale
                      key={n}
                      wrapStyle={{ flex: 1 }}
                      onPress={() => {
                        vibrate(15);
                        setSelectedMax(n);
                      }}
                      style={[styles.maxChip, active && styles.maxChipActive]}
                      scale={0.92}
                    >
                      <Text style={[styles.optionText, active && { color: WHITE }]}>{n}</Text>
                    </PressableScale>
                  );
                })}
              </View>

              <View style={styles.modalActions}>
                <PressableScale onPress={() => setShowCreate(false)} style={styles.cancelButton} scale={0.95}>
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </PressableScale>
                <PressableScale wrapStyle={{ flex: 1 }} onPress={confirmCreate} style={styles.confirmButton} scale={0.96}>
                  <Text style={styles.modalButtonText}>Criar</Text>
                </PressableScale>
              </View>
            </View>
          </View>
        </Modal>
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

  // ---------- Avatares ----------
  avatar: {
    borderWidth: 2,
    borderColor: '#1B1630',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHost: { backgroundColor: BUTTON_PURPLE },
  avatarFilled: { backgroundColor: SURFACE_LIGHT },
  avatarEmpty: { backgroundColor: 'rgba(255,255,255,0.08)' },
  avatarText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 12 },

  // ---------- Botões entrar / sair ----------
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOn: { backgroundColor: BUTTON_PURPLE },
  buttonOff: { backgroundColor: 'rgba(255,255,255,0.08)' },
  leaveButton: {
    backgroundColor: 'rgba(255,138,155,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,138,155,0.4)',
  },
  joinText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 15 },

  // ---------- Modal ----------
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: BG_BOTTOM,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 14,
  },
  modalTitle: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 24, marginBottom: 4 },
  modalLabel: {
    fontFamily: FONT_BOLD,
    color: TEXT_MUTED,
    fontSize: 13,
    letterSpacing: 1.5,
    marginTop: 14,
    marginBottom: 8,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tileWrap: { width: '48.5%', marginBottom: 10 },
  tile: {
    height: 92,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: SURFACE,
  },
  tileActive: { borderColor: ACCENT },
  tileText: {
    fontFamily: FONT_BOLD,
    color: WHITE,
    fontSize: 15,
    lineHeight: 17,
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  tileCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BUTTON_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  optionText: { fontFamily: FONT_BOLD, color: TEXT_MUTED, fontSize: 16 },
  maxRow: { flexDirection: 'row', gap: 10 },
  maxChip: {
    height: 44,
    borderRadius: 14,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maxChipActive: { backgroundColor: BUTTON_PURPLE },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 18,
    height: 48,
    justifyContent: 'center',
  },
  confirmButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BUTTON_PURPLE,
    borderRadius: 16,
    height: 48,
  },
  modalButtonText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 16 },
});