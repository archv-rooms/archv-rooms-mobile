import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../services/api';
import { TEST_MODE } from '../services/mock';
import { vibrate } from '../services/settings';
import {
  listFriends,
  listPending,
  searchUsers,
  sendFriendRequest,
  respondToRequest,
} from '../services/friends';
import { colorFor, statusInfo, OFFLINE_DOT } from '../services/friendHelpers';
import PressableScale from '../components/PressableScale';
import FadeIn from '../components/FadeIn';
import AnimatedRow from '../components/AnimatedRow';
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
  ERROR,
} from '../constants/palette';

const NATIVE = Platform.OS !== 'web';

// Cor usada só nesta tela
const REQUEST_BG = '#352C5E';

// Brilho roxo: no Android (elevation) vira mancha escura, então só usamos nas outras plataformas
const GLOW =
  Platform.OS === 'android'
    ? {}
    : {
        shadowColor: ACCENT,
        shadowOpacity: 0.5,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
      };

const STATUS_ORDER = { playing: 0, online: 1, offline: 2 };

// Avatar: colored ring + dot when the friend is online/playing, faded when offline
function Avatar({ name, size = 42, info }) {
  const color = colorFor(name);
  const offline = info && info.dot === OFFLINE_DOT;
  const ring = info && !offline;
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color + (offline ? '18' : '30'),
            borderColor: ring ? color : color + (offline ? '33' : '66'),
            borderWidth: ring ? 2.5 : 1.5,
          },
        ]}
      >
        <Text
          style={[
            styles.avatarText,
            { color, fontSize: Math.round(size * 0.48), opacity: offline ? 0.55 : 1 },
          ]}
        >
          {(name || '?').trim().charAt(0).toUpperCase()}
        </Text>
      </View>
      {info && <View style={[styles.onlineDot, { backgroundColor: info.dot }]} />}
    </View>
  );
}

// Section title with a counter (same look in every section)
function SectionHeader({ title, count, highlight, onPress, open }) {
  const content = (
    <View style={styles.sectionHeader}>
      <Text style={styles.section}>{title}</Text>
      <View style={[styles.badge, highlight && styles.badgeHighlight]}>
        <Text style={[styles.badgeText, !highlight && { color: TEXT_MUTED }]}>{count}</Text>
      </View>
      {onPress && (
        <View style={styles.chevronWrap}>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={TEXT_MUTED} />
        </View>
      )}
    </View>
  );
  if (!onPress) return content;
  return <Pressable onPress={onPress}>{content}</Pressable>;
}

function AddButton({ sent, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (sent) {
      scale.setValue(0.7);
      Animated.spring(scale, { toValue: 1, useNativeDriver: NATIVE, speed: 14, bounciness: 20 }).start();
    }
  }, [sent]);

  return (
    <PressableScale onPress={onPress} disabled={sent} scale={0.88}>
      <Animated.View style={[styles.button, sent && styles.buttonSent, { transform: [{ scale }] }]}>
        {sent && <Ionicons name="checkmark" size={16} color={GREEN} />}
        <Text style={[styles.buttonText, sent && { color: GREEN }]}>{sent ? 'Enviado' : 'Adicionar'}</Text>
      </Animated.View>
    </PressableScale>
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

export default function FriendsScreen({ navigation }) {
  const [fontsLoaded] = useFonts({ Rajdhani_600SemiBold, Rajdhani_700Bold });

  const [loggedIn, setLoggedIn] = useState(true);
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const focusAnim = useRef(new Animated.Value(0)).current;

  async function load() {
    try {
      setFriends(await listFriends());
      setPending(await listPending());
    } catch (e) {}
  }

  useEffect(() => {
    async function start() {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token && !TEST_MODE) {
        setLoggedIn(false);
        return;
      }
      load();
    }
    start();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    vibrate(20);
    await load();
    setAnimKey((k) => k + 1);
    setRefreshing(false);
  }

  async function handleSearch(text) {
    setSearch(text);
    if (!text.trim()) {
      setResults([]);
      return;
    }
    try {
      setResults(await searchUsers(text));
    } catch (e) {}
  }

  function toggleSearch() {
    vibrate(15);
    if (searchOpen) {
      setSearchOpen(false);
      handleSearch('');
    } else {
      setSearchOpen(true);
    }
  }

  async function sendRequest(id) {
    vibrate(30);
    try {
      await sendFriendRequest(id);
      setResults(results.map((u) => (u.id === id ? { ...u, requestSent: true } : u)));
    } catch (e) {}
  }

  async function answerRequest(id, status) {
    vibrate(30);
    try {
      await respondToRequest(id, status);
      if (TEST_MODE) {
        setPending((list) => list.filter((item) => item.id !== id));
        return;
      }
      load();
    } catch (e) {}
  }

  function displayName(user) {
    return user.username || user.name || 'User';
  }

  // Opens Rooms and creates a room for this friend
  function inviteToRoom(friend) {
    vibrate(30);
    navigation.navigate('Rooms', { invite: displayName(friend), ts: Date.now() });
  }

  function focusSearch() {
    Animated.timing(focusAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  }

  function blurSearch() {
    Animated.timing(focusAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  }

  const searchBorder = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(142,124,240,0)', ACCENT],
  });
  const searchBackground = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SURFACE, SURFACE_LIGHT],
  });

  const searching = search.trim() !== '';

  // Playing first, then online, then offline
  const sortedFriends = [...friends].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3)
  );
  const onlineCount = friends.filter((f) => f.status === 'online' || f.status === 'playing').length;

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: BG_TOP }} />;

  return (
    <LinearGradient colors={[BG_TOP, BG_BOTTOM]} style={{ flex: 1 }}>
      <View style={styles.container}>
        <FadeIn style={styles.top}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Amigos</Text>
            {loggedIn && friends.length > 0 && (
              <View style={styles.summary}>
                <View style={[styles.summaryDot, onlineCount === 0 && { backgroundColor: OFFLINE_DOT }]} />
                <Text style={styles.summaryText}>
                  {onlineCount === 0 ? 'Ninguém online agora' : onlineCount + ' online agora'}
                </Text>
              </View>
            )}
          </View>
          {loggedIn && (
            <PressableScale onPress={toggleSearch} style={styles.searchToggle} scale={0.88}>
              <Ionicons name={searchOpen ? 'close' : 'search'} size={20} color={WHITE} />
            </PressableScale>
          )}
        </FadeIn>

        {!loggedIn ? (
          <EmptyState icon="lock-closed-outline" text="Entre na sua conta para ver seus amigos" />
        ) : (
          <>
            {searchOpen && (
              <FadeIn style={{ marginBottom: 4 }}>
                <Animated.View
                  style={[styles.search, { borderColor: searchBorder, backgroundColor: searchBackground }]}
                >
                  <Ionicons name="search" size={18} color={TEXT_MUTED} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar usuários"
                    placeholderTextColor={TEXT_MUTED}
                    value={search}
                    onChangeText={handleSearch}
                    onFocus={focusSearch}
                    onBlur={blurSearch}
                    autoCapitalize="none"
                    autoFocus
                  />
                  {search !== '' && (
                    <PressableScale onPress={() => handleSearch('')} scale={0.8}>
                      <Ionicons name="close-circle" size={20} color={TEXT_MUTED} />
                    </PressableScale>
                  )}
                </Animated.View>
              </FadeIn>
            )}

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
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
              {searching && <SectionHeader title="Resultados" count={results.length} />}

              {searching &&
                results.map((user, i) => (
                  <AnimatedRow key={'search-' + user.id} index={i}>
                    <View style={styles.row}>
                      <Avatar name={displayName(user)} />
                      <Text style={styles.name} numberOfLines={1}>
                        {displayName(user)}
                      </Text>
                      <AddButton sent={!!user.requestSent} onPress={() => sendRequest(user.id)} />
                    </View>
                  </AnimatedRow>
                ))}

              {searching && results.length === 0 && (
                <EmptyState key="no-results" icon="person-outline" text="Nenhum usuário encontrado" />
              )}

              {!searching && pending.length > 0 && (
                <>
                  <SectionHeader
                    title="Pedidos"
                    count={pending.length}
                    highlight
                    open={pendingOpen}
                    onPress={() => {
                      vibrate(15);
                      setPendingOpen(!pendingOpen);
                    }}
                  />
                  {pendingOpen &&
                    pending.map((request, i) => {
                      const name = displayName(request.sender || request.user || request);
                      return (
                        <AnimatedRow key={'request-' + animKey + '-' + request.id} index={i}>
                          <View style={[styles.row, styles.rowRequest]}>
                            <Avatar name={name} size={36} />
                            <Text style={styles.name} numberOfLines={1}>
                              {name}
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                              <PressableScale
                                onPress={() => answerRequest(request.id, 'accepted')}
                                style={[styles.iconButton, { backgroundColor: BUTTON_PURPLE }]}
                                scale={0.8}
                              >
                                <Ionicons name="checkmark" size={18} color={WHITE} />
                              </PressableScale>
                              <PressableScale
                                onPress={() => answerRequest(request.id, 'rejected')}
                                style={[styles.iconButton, { backgroundColor: SURFACE_LIGHT }]}
                                scale={0.8}
                              >
                                <Ionicons name="close" size={18} color={ERROR} />
                              </PressableScale>
                            </View>
                          </View>
                        </AnimatedRow>
                      );
                    })}
                </>
              )}

              {!searching && (
                <>
                  <SectionHeader title="Amigos" count={friends.length} />
                  {friends.length === 0 && (
                    <EmptyState key="no-friends" icon="people-outline" text="Nenhum amigo ainda" />
                  )}
                  {sortedFriends.map((friend, i) => {
                    const info = statusInfo(friend);
                    const offline = friend.status === 'offline';
                    return (
                      <AnimatedRow key={'friend-' + animKey + '-' + friend.id} index={i}>
                        <PressableScale
                          style={[styles.row, offline && styles.rowOffline]}
                          onPress={() => navigation.navigate('Chat', { friend })}
                          scale={0.97}
                        >
                          <Avatar name={displayName(friend)} info={info} />
                          <View style={styles.friendInfo}>
                            <Text style={styles.nameInline} numberOfLines={1}>
                              {displayName(friend)}
                            </Text>
                            {info && (
                              <Text style={[styles.status, { color: info.color }]} numberOfLines={1}>
                                {info.label}
                              </Text>
                            )}
                          </View>
                          {!offline && (
                            <PressableScale
                              onPress={() => inviteToRoom(friend)}
                              style={styles.playButton}
                              scale={0.88}
                            >
                              <Ionicons name="game-controller" size={16} color={WHITE} />
                              <Text style={styles.buttonText}>Jogar</Text>
                            </PressableScale>
                          )}
                          <Ionicons name="chatbubble-outline" size={20} color={TEXT_MUTED} />
                        </PressableScale>
                      </AnimatedRow>
                    );
                  })}
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

  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingRight: 56,
  },
  title: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 28, letterSpacing: 0.5 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN },
  summaryText: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 14 },
  searchToggle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: { flex: 1, height: '100%', color: WHITE, fontFamily: FONT_SEMI, fontSize: 17 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 10 },
  section: {
    fontFamily: FONT_BOLD,
    color: TEXT_MUTED,
    fontSize: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: SURFACE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeHighlight: {
    backgroundColor: BUTTON_PURPLE,
    ...GLOW,
  },
  badgeText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 12 },
  chevronWrap: { flex: 1, alignItems: 'flex-end' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    height: 64,
    marginBottom: 10,
  },
  rowOffline: { opacity: 0.6 },
  rowRequest: {
    height: 54,
    borderRadius: 18,
    marginBottom: 8,
    paddingHorizontal: 12,
    backgroundColor: REQUEST_BG,
    borderColor: 'rgba(142,124,240,0.6)',
    ...GLOW,
  },

  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: FONT_BOLD },
  onlineDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: SURFACE,
  },

  // Nome sozinho na linha (ocupa o espaço do meio)
  name: { flex: 1, fontFamily: FONT_BOLD, color: WHITE, fontSize: 18 },
  // Nome dentro da coluna nome + status (sem flex, para não esticar na vertical)
  friendInfo: { flex: 1, justifyContent: 'center' },
  nameInline: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 18 },
  status: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 13, marginTop: 1 },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BUTTON_PURPLE,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: BUTTON_PURPLE,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  buttonSent: { backgroundColor: 'rgba(74,222,128,0.14)' },
  buttonText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 15 },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 50 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 18, textAlign: 'center' },
});