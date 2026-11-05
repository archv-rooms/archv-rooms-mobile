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
const GREEN = '#4ADE80';
const ERROR = '#FF9AA8';

const AVATAR_COLORS = ['#8E7CF0', '#FF6B8A', '#3F8CFF', '#FFB23C', '#7CE06B', '#C77CFF', '#FF4D4D'];

// Same name always gets the same color
function colorFor(name) {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

// Value that slowly goes up and down
function useFloat(amplitude, duration) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVE,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVE,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return value.interpolate({ inputRange: [0, 1], outputRange: [-amplitude, amplitude] });
}

// Button that shrinks when pressed and springs back
function PressableScale({ onPress, wrapStyle, style, children, scale = 0.93, disabled }) {
  const value = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(value, { toValue: scale, useNativeDriver: NATIVE, speed: 50, bounciness: 0 }).start();
  }

  function pressOut() {
    Animated.spring(value, { toValue: 1, useNativeDriver: NATIVE, speed: 18, bounciness: 14 }).start();
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
      style={wrapStyle}
    >
      <Animated.View style={[style, { transform: [{ scale: value }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

// Fades in and slides up, with an optional delay
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

// List row that pops in one after another
function AnimatedRow({ index, children }) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(Math.min(index, 8) * 60),
      Animated.spring(value, { toValue: 1, useNativeDriver: NATIVE, tension: 60, friction: 9 }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
        transform: [
          { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
          { scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

function Avatar({ name }) {
  const color = colorFor(name);
  return (
    <View style={[styles.avatar, { backgroundColor: color + '30', borderColor: color + '66' }]}>
      <Text style={[styles.avatarText, { color }]}>{(name || '?').trim().charAt(0).toUpperCase()}</Text>
    </View>
  );
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

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: BG_TOP }} />;

  return (
    <LinearGradient colors={[BG_TOP, BG_BOTTOM]} style={{ flex: 1 }}>
      <View style={styles.container}>
        <FadeIn style={styles.top}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Amigos</Text>
            {loggedIn && (
              <Text style={styles.subtitle}>
                {friends.length} {friends.length === 1 ? 'amigo' : 'amigos'}
                {pending.length > 0 ? '  •  ' + pending.length + ' pedido(s)' : ''}
              </Text>
            )}
          </View>
        </FadeIn>

        {!loggedIn ? (
          <EmptyState icon="lock-closed-outline" text="Entre na sua conta para ver seus amigos" />
        ) : (
          <>
            <FadeIn delay={100}>
              <Animated.View
                style={[styles.search, { borderColor: searchBorder, backgroundColor: searchBackground }]}
              >
                <Ionicons name="search" size={20} color={TEXT_MUTED} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar usuários"
                  placeholderTextColor={TEXT_MUTED}
                  value={search}
                  onChangeText={handleSearch}
                  onFocus={focusSearch}
                  onBlur={blurSearch}
                  autoCapitalize="none"
                />
                {search !== '' && (
                  <PressableScale onPress={() => handleSearch('')} scale={0.8}>
                    <Ionicons name="close-circle" size={20} color={TEXT_MUTED} />
                  </PressableScale>
                )}
              </Animated.View>
            </FadeIn>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 130 }}
            >
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
                  <View style={styles.sectionHeader}>
                    <Text style={styles.section}>Pedidos</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{pending.length}</Text>
                    </View>
                  </View>
                  {pending.map((request, i) => {
                    const name = displayName(request.sender || request.user || request);
                    return (
                      <AnimatedRow key={'request-' + request.id} index={i}>
                        <View style={styles.row}>
                          <Avatar name={name} />
                          <Text style={styles.name} numberOfLines={1}>
                            {name}
                          </Text>
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <PressableScale
                              onPress={() => answerRequest(request.id, 'accepted')}
                              style={[styles.iconButton, { backgroundColor: BUTTON_PURPLE }]}
                              scale={0.8}
                            >
                              <Ionicons name="checkmark" size={20} color={WHITE} />
                            </PressableScale>
                            <PressableScale
                              onPress={() => answerRequest(request.id, 'rejected')}
                              style={[styles.iconButton, { backgroundColor: SURFACE_LIGHT }]}
                              scale={0.8}
                            >
                              <Ionicons name="close" size={20} color={ERROR} />
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
                  <View style={styles.sectionHeader}>
                    <Text style={styles.section}>Amigos</Text>
                  </View>
                  {friends.length === 0 && (
                    <EmptyState key="no-friends" icon="people-outline" text="Nenhum amigo ainda" />
                  )}
                  {friends.map((friend, i) => (
                    <AnimatedRow key={'friend-' + friend.id} index={i}>
                      <PressableScale
                        style={styles.row}
                        onPress={() => navigation.navigate('Chat', { friend })}
                        scale={0.96}
                      >
                        <Avatar name={displayName(friend)} />
                        <Text style={styles.name} numberOfLines={1}>
                          {displayName(friend)}
                        </Text>
                        <PressableScale
                          onPress={() => inviteToRoom(friend)}
                          style={styles.inviteButton}
                          scale={0.88}
                        >
                          <Ionicons name="game-controller" size={16} color={WHITE} />
                          <Text style={styles.buttonText}>Convidar</Text>
                        </PressableScale>
                        <View style={styles.chatIcon}>
                          <Ionicons name="chatbubble" size={16} color={WHITE} />
                        </View>
                      </PressableScale>
                    </AnimatedRow>
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

  top: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  title: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 28, letterSpacing: 0.5 },
  subtitle: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 14, marginTop: -2 },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 50,
  },
  searchInput: { flex: 1, height: '100%', color: WHITE, fontFamily: FONT_SEMI, fontSize: 18 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 22, marginBottom: 10 },
  section: {
    fontFamily: FONT_BOLD,
    color: TEXT_MUTED,
    fontSize: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: BUTTON_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  badgeText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 13 },

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
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: FONT_BOLD, fontSize: 20 },
  name: { flex: 1, fontFamily: FONT_BOLD, color: WHITE, fontSize: 18 },
  chatIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BUTTON_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BUTTON_PURPLE,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: SURFACE_LIGHT,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  buttonSent: { backgroundColor: 'rgba(74,222,128,0.14)' },
  buttonText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 15 },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
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