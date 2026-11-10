import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Modal, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { useFonts } from 'expo-font';
import { MOCK_ROOMS, TEST_GAMES, TEST_FRIENDS } from '../services/mock';
import { vibrate } from '../services/settings';

const FONT_SEMI = 'Rajdhani_600SemiBold';
const FONT_BOLD = 'Rajdhani_700Bold';

const BG_TOP = '#14111F';
const BG_BOTTOM = '#221B38';
const SURFACE = '#2D2545';
const BUTTON_PURPLE = '#6A5BD6';
const WHITE = '#FFFFFF';
const TEXT_MUTED = '#B4AACB';
const GREEN = '#4ADE80';
const RED = '#FF8A9B';

const GAMES = TEST_GAMES.map((g) => g.title);
const FRIEND_USERNAMES = TEST_FRIENDS.map((f) => f.username);

const FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'open', label: 'Abertas' },
  { key: 'friends', label: 'Amigos' },
];

// Cor de destaque de cada jogo (sempre a mesma para o mesmo nome)
const ACCENTS = ['#8B7BFF', '#F0649A', '#F5A524', '#2FC4DB', '#4ADE80', '#FB7C3C'];

function getAccent(name) {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return ACCENTS[sum % ACCENTS.length];
}

function getCover(name) {
  const found = TEST_GAMES.find((g) => g.title === name);
  return found ? found.image : null;
}

function getConsole(name) {
  const found = TEST_GAMES.find((g) => g.title === name);
  return found ? found.console : null;
}

function getStatus(joined, full) {
  if (joined) return { label: 'NA SALA', color: '#C4BAFF' };
  if (full) return { label: 'CHEIA', color: RED };
  return { label: 'ABERTA', color: GREEN };
}

// Capa com fallback caso a imagem não carregue
function Cover({ uri, accent, style, iconSize = 28 }) {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) {
    return (
      <LinearGradient
        colors={[accent + '99', SURFACE]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[style, { alignItems: 'center', justifyContent: 'center' }]}
      >
        <Ionicons name="game-controller" size={iconSize} color={WHITE} style={{ opacity: 0.5 }} />
      </LinearGradient>
    );
  }
  return <Image source={{ uri }} style={style} resizeMode="cover" onError={() => setFailed(true)} />;
}

// Etiquetinha do console (NES, SFC, GB)
function ConsoleBadge({ label, style }) {
  if (!label) return null;
  return (
    <View style={[styles.consoleBadge, style]}>
      <Text style={styles.consoleBadgeText}>{label}</Text>
    </View>
  );
}

// Avatares sobrepostos (o primeiro é o anfitrião)
function Avatars({ room, accent, size = 30 }) {
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
              i > 0 && { marginLeft: -10 },
              filled ? { backgroundColor: accent } : styles.avatarEmpty,
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

// Botão Entrar / Sair / Cheia
function JoinButton({ joined, full, accent, onJoin, onLeave, compact }) {
  if (joined) {
    return (
      <Pressable
        onPress={onLeave}
        style={[styles.joinButton, compact && styles.joinButtonCompact, styles.joinButtonLeave]}
      >
        <Ionicons name="exit-outline" size={16} color={RED} />
        <Text style={[styles.joinText, { color: RED }]}>Sair</Text>
      </Pressable>
    );
  }
  return (
    <Pressable
      disabled={full}
      onPress={onJoin}
      style={[
        styles.joinButton,
        compact && styles.joinButtonCompact,
        !full && { backgroundColor: accent },
        full && styles.joinButtonOff,
      ]}
    >
      <Ionicons name={full ? 'lock-closed' : 'play'} size={14} color={full ? TEXT_MUTED : WHITE} />
      <Text style={[styles.joinText, full && { color: TEXT_MUTED }]}>{full ? 'Cheia' : 'Entrar'}</Text>
    </Pressable>
  );
}

export default function RoomsScreen({ route }) {
  const [fontsLoaded] = useFonts({ Rajdhani_600SemiBold, Rajdhani_700Bold });
  const [rooms, setRooms] = useState(MOCK_ROOMS);
  const [joinedIds, setJoinedIds] = useState([]);
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedGame, setSelectedGame] = useState(GAMES[0]);
  const [selectedMax, setSelectedMax] = useState(2);
  const [carouselW, setCarouselW] = useState(Dimensions.get('window').width - 40);
  const [page, setPage] = useState(0);
  const carouselRef = useRef(null);

  const inviteName = route?.params?.invite;
  const inviteTs = route?.params?.ts;

  // Chegou um convite vindo da tela de Amigos: cria a sala e avisa
  useEffect(() => {
    if (!inviteName) return;
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
    const timer = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(timer);
  }, [inviteName, inviteTs]);

  // Quando entra/sai de uma sala, o carrossel volta pro primeiro destaque
  useEffect(() => {
    if (carouselRef.current) carouselRef.current.scrollTo({ x: 0, animated: false });
    setPage(0);
  }, [joinedIds.length]);

  function openCreate() {
    vibrate(30);
    setSelectedGame(GAMES[0]);
    setSelectedMax(2);
    setShowCreate(true);
  }

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
  }

  function joinRoom(id) {
    vibrate(30);
    setRooms(rooms.map((r) => (r.id === id && r.players < r.maxPlayers ? { ...r, players: r.players + 1 } : r)));
    setJoinedIds([...joinedIds, id]);
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
    vibrate(15);
    setFilter(key);
  }

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: BG_TOP }} />;

  // ---------- Destaques (até 3): sua sala, salas de amigos com vaga, salas mais cheias ----------
  const isOpen = (r) => r.players < r.maxPlayers;
  const featuredList = [];
  const addFeatured = (r) => {
    if (r && featuredList.length < 3 && !featuredList.some((f) => f.id === r.id)) featuredList.push(r);
  };
  rooms.filter((r) => joinedIds.includes(r.id)).forEach(addFeatured);
  rooms.filter((r) => FRIEND_USERNAMES.includes(r.host) && isOpen(r)).forEach(addFeatured);
  rooms
    .filter(isOpen)
    .sort((a, b) => b.players / b.maxPlayers - a.players / a.maxPlayers)
    .forEach(addFeatured);
  rooms.forEach(addFeatured);

  const activePage = Math.min(page, Math.max(featuredList.length - 1, 0));

  // ---------- Lista filtrada ----------
  const list = rooms.filter((r) => {
    if (filter === 'open') return isOpen(r);
    if (filter === 'friends') return FRIEND_USERNAMES.includes(r.host);
    return true;
  });

  function renderFeatured(room) {
    const joined = joinedIds.includes(room.id);
    const full = room.players >= room.maxPlayers;
    const accent = getAccent(room.game);
    const status = getStatus(joined, full);

    return (
      <View key={room.id} style={{ width: carouselW }}>
        <View style={[styles.featured, { borderColor: accent + '66' }]}>
          <View style={styles.featuredCover}>
            <Cover uri={getCover(room.game)} accent={accent} iconSize={64} style={StyleSheet.absoluteFill} />
            {/* Degradê só na parte de baixo, onde fica o título */}
            <LinearGradient
              colors={['transparent', 'rgba(45,37,69,0.97)']}
              locations={[0.3, 1]}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.featuredStatus}>
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>


            <View style={styles.featuredTitleWrap}>
              <Text style={styles.featuredGame} numberOfLines={2}>{room.game}</Text>
              <Text style={styles.sub} numberOfLines={1}>
                Sala de {room.host} • {room.maxPlayers} jogadores
              </Text>
            </View>
          </View>

          <View style={styles.featuredBottom}>
            <View style={styles.avatarsWrap}>
              <Avatars room={room} accent={accent} size={34} />
              <Text style={styles.count}>
                {room.players}/{room.maxPlayers}
              </Text>
            </View>
            <JoinButton
              joined={joined}
              full={full}
              accent={accent}
              onJoin={() => joinRoom(room.id)}
              onLeave={() => leaveRoom(room.id)}
            />
          </View>
        </View>
      </View>
    );
  }

  const firstIsMine = featuredList[0] && joinedIds.includes(featuredList[0].id) && activePage === 0;

  return (
    <LinearGradient colors={[BG_TOP, BG_BOTTOM]} style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Salas</Text>
          <Pressable style={styles.createButton} onPress={openCreate}>
            <Ionicons name="add" size={18} color={WHITE} />
            <Text style={styles.createText}>Criar sala</Text>
          </Pressable>
        </View>

        {notice !== '' && (
          <View style={styles.notice}>
            <Ionicons name="checkmark-circle" size={20} color={GREEN} />
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
          {/* ---------- Carrossel de destaques ---------- */}
          {featuredList.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>{firstIsMine ? 'SUA SALA' : 'EM DESTAQUE'}</Text>
              <View onLayout={(e) => setCarouselW(e.nativeEvent.layout.width)}>
                <ScrollView
                  ref={carouselRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  scrollEventThrottle={16}
                  onScroll={(e) => {
                    const i = Math.round(e.nativeEvent.contentOffset.x / carouselW);
                    if (i !== page) setPage(i);
                  }}
                >
                  {featuredList.map(renderFeatured)}
                </ScrollView>
              </View>

              {featuredList.length > 1 && (
                <View style={styles.dots}>
                  {featuredList.map((r, i) => (
                    <View key={r.id} style={[styles.dot, i === activePage && styles.dotActive]} />
                  ))}
                </View>
              )}
            </>
          )}

          {/* ---------- Filtros ---------- */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsRow}
          >
            {FILTERS.map((f) => {
              const active = f.key === filter;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => changeFilter(f.key)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && { color: WHITE }]}>{f.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* ---------- Lista compacta ---------- */}
          {list.map((room) => {
            const joined = joinedIds.includes(room.id);
            const full = room.players >= room.maxPlayers;
            const accent = getAccent(room.game);
            const status = getStatus(joined, full);

            return (
              <View key={room.id} style={styles.row}>
                <View style={styles.thumbWrap}>
                  <Cover uri={getCover(room.game)} accent={accent} style={styles.thumb} iconSize={26} />
                </View>

                <View style={styles.rowInfo}>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                  <Text style={styles.rowGame} numberOfLines={1}>{room.game}</Text>
                  <View style={styles.rowMeta}>
                    <Avatars room={room} accent={accent} size={22} />
                    <Text style={styles.rowHost} numberOfLines={1}>
                      {room.players}/{room.maxPlayers} • {room.host}
                    </Text>
                  </View>
                </View>

                <JoinButton
                  compact
                  joined={joined}
                  full={full}
                  accent={accent}
                  onJoin={() => joinRoom(room.id)}
                  onLeave={() => leaveRoom(room.id)}
                />
              </View>
            );
          })}

          {/* ---------- Estado vazio ---------- */}
          {list.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="game-controller-outline" size={40} color={TEXT_MUTED} />
              <Text style={styles.emptyText}>Nenhuma sala por aqui</Text>
              <Pressable style={styles.emptyButton} onPress={openCreate}>
                <Ionicons name="add" size={18} color={WHITE} />
                <Text style={styles.createText}>Criar sala</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* ---------- Modal criar sala ---------- */}
        <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Criar sala</Text>

              <Text style={styles.modalLabel}>Jogo</Text>
              <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                {GAMES.map((g) => {
                  const active = g === selectedGame;
                  return (
                    <Pressable
                      key={g}
                      onPress={() => setSelectedGame(g)}
                      style={[styles.option, active && styles.optionActive]}
                    >
                      <Text style={[styles.optionText, active && { color: WHITE }]}>{g}</Text>
                      {active && <Ionicons name="checkmark-circle" size={20} color={WHITE} />}
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={styles.modalLabel}>Jogadores</Text>
              <View style={styles.maxRow}>
                {[2, 3, 4].map((n) => {
                  const active = n === selectedMax;
                  return (
                    <Pressable
                      key={n}
                      onPress={() => setSelectedMax(n)}
                      style={[styles.maxChip, active && styles.maxChipActive]}
                    >
                      <Text style={[styles.optionText, active && { color: WHITE }]}>{n}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.modalActions}>
                <Pressable style={styles.cancelButton} onPress={() => setShowCreate(false)}>
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </Pressable>
                <Pressable style={styles.confirmButton} onPress={confirmCreate}>
                  <Text style={styles.modalButtonText}>Criar</Text>
                </Pressable>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingRight: 56,
  },
  title: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 28, letterSpacing: 0.5 },
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

  sectionLabel: {
    fontFamily: FONT_BOLD,
    color: TEXT_MUTED,
    fontSize: 12,
    letterSpacing: 1.4,
    marginBottom: 8,
  },

  // ---------- Destaque / carrossel ----------
  featured: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  featuredCover: {
    height: 190,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  featuredStatus: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(20,17,31,0.7)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  featuredTitleWrap: { paddingHorizontal: 16, paddingBottom: 10 },
  featuredGame: {
    fontFamily: FONT_BOLD,
    color: WHITE,
    fontSize: 28,
    lineHeight: 30,
  },
  featuredBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  sub: { fontFamily: FONT_SEMI, color: '#D6CEE8', fontSize: 14, marginTop: 2 },
  avatarsWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  count: { fontFamily: FONT_BOLD, color: '#D6CEE8', fontSize: 15 },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: { width: 18, backgroundColor: BUTTON_PURPLE },

  // ---------- Selo do console ----------
  consoleBadge: {
    backgroundColor: 'rgba(20,17,31,0.78)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  consoleBadgeText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 11, letterSpacing: 0.8 },

  // ---------- Status ----------
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontFamily: FONT_BOLD, fontSize: 12, letterSpacing: 1.2 },

  // ---------- Filtros ----------
  chipsScroll: { flexGrow: 0, marginTop: 16, marginBottom: 14 },
  chipsRow: { flexDirection: 'row', gap: 8, paddingRight: 20 },
  chip: {
    backgroundColor: SURFACE,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: BUTTON_PURPLE },
  chipText: { fontFamily: FONT_BOLD, color: TEXT_MUTED, fontSize: 14 },

  // ---------- Lista compacta ----------
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 10,
    marginBottom: 10,
  },
  thumbWrap: { width: 72, height: 72 },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#3A3158',
  },
  rowInfo: { flex: 1 },
  rowGame: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 18, marginTop: 1 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  rowHost: { flex: 1, fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 13 },

  // ---------- Estado vazio ----------
  empty: { alignItems: 'center', gap: 10, paddingVertical: 30 },
  emptyText: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 16 },
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
    borderColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmpty: { backgroundColor: '#3A3158' },
  avatarText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 13 },

  // ---------- Botão entrar / sair ----------
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BUTTON_PURPLE,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  joinButtonCompact: { paddingHorizontal: 14, paddingVertical: 8 },
  joinButtonLeave: {
    backgroundColor: 'rgba(255,138,155,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,138,155,0.4)',
  },
  joinButtonOff: { backgroundColor: 'rgba(255,255,255,0.08)' },
  joinText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 15 },

  // ---------- Modal ----------
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: BG_BOTTOM,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
  },
  modalTitle: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 24, marginBottom: 12 },
  modalLabel: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 14, marginTop: 12, marginBottom: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SURFACE,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 8,
  },
  optionActive: { backgroundColor: BUTTON_PURPLE },
  optionText: { fontFamily: FONT_BOLD, color: TEXT_MUTED, fontSize: 16 },
  maxRow: { flexDirection: 'row', gap: 10 },
  maxChip: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maxChipActive: { backgroundColor: BUTTON_PURPLE },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  confirmButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BUTTON_PURPLE,
    borderRadius: 16,
    paddingVertical: 10,
  },
  modalButtonText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 15 },
});