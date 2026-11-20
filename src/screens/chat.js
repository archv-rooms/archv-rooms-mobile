import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { useFonts } from 'expo-font';
import { vibrate } from '../services/settings';
import {
  conectar as connect,
  desconectar as disconnect,
  entrarNaConversa as joinConversation,
  sairDaConversa as leaveConversation,
  abrirConversa as openConversation,
  buscarMensagens as fetchMessages,
  enviarMensagem as sendMessage,
} from '../services/chat';
import { colorFor, statusInfo } from '../services/friendHelpers';
import FadeIn from '../components/FadeIn';
import { Avatar } from './profile';
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
  ERROR,
} from '../constants/palette';

function formatTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

// Botão de enviar com efeito leve ao toque
function SendButton({ onPress, enabled }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.9, { damping: 18, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 18, stiffness: 300 }); }}
      onPress={onPress}
      disabled={!enabled}
    >
      <Animated.View style={[styles.sendButton, !enabled && styles.sendButtonOff, animatedStyle]}>
        <Ionicons name="send" size={18} color={enabled ? WHITE : TEXT_MUTED} />
      </Animated.View>
    </Pressable>
  );
}

export default function ChatScreen({ navigation, route }) {
  const { friend } = route.params;
  const [fontsLoaded] = useFonts({ Rajdhani_600SemiBold, Rajdhani_700Bold });
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState(false);
  const conversationId = useRef(null);
  const listRef = useRef(null);

  const name = friend.username || friend.name || 'User';
  const color = colorFor(name);
  const photo = friend.avatar || null;
  const info = statusInfo(friend);
  const offline = friend.status === 'offline';
  const canSend = text.trim() !== '' && !error;

  useEffect(() => {
    async function start() {
      try {
        const conversation = await openConversation(friend.id);
        conversationId.current = conversation.id;

        // New messages arrive here; ignore duplicates and other conversations
        connect((message) => {
          if (message.conversationId !== conversationId.current) return;
          setMessages((current) =>
            current.some((m) => m.id === message.id) ? current : [...current, message]
          );
        });
        joinConversation(conversation.id);

        setMessages(await fetchMessages(conversation.id));
      } catch (e) {
        setError(true);
      }
    }
    start();

    return () => {
      if (conversationId.current) leaveConversation(conversationId.current);
      disconnect();
    };
  }, []);

  async function send() {
    const content = text.trim();
    if (!content || !conversationId.current) return;
    vibrate(15);
    setText('');
    try {
      await sendMessage(conversationId.current, content);
    } catch (e) {}
  }

  function inviteToRoom() {
    vibrate(30);
    navigation.navigate('Rooms', { invite: name, ts: Date.now() });
  }

  function renderMessage({ item, index }) {
    const isMine = item.senderId !== friend.id;
    const prev = messages[index - 1];
    const next = messages[index + 1];
    const sameSenderAsPrev = prev && (prev.senderId !== friend.id) === isMine;
    const lastOfGroup = !next || (next.senderId !== friend.id) !== isMine;
    const time = formatTime(item.createdAt);

    return (
      <Animated.View
        entering={FadeInDown.duration(240)}
        style={[
          styles.messageRow,
          isMine ? styles.rowMine : styles.rowTheirs,
          { marginTop: sameSenderAsPrev ? 3 : 10 },
        ]}
      >
        {!isMine && (
          <View style={styles.sideSlot}>
            {lastOfGroup && <Avatar profile={{ name, color, photo }} size={28} />}
          </View>
        )}
        <View style={[styles.bubble, isMine ? styles.mine : styles.theirs]}>
          <Text style={styles.bubbleText}>{item.content}</Text>
          {time !== '' && (
            <Text style={[styles.time, isMine && { color: 'rgba(255,255,255,0.7)' }]}>{time}</Text>
          )}
        </View>
      </Animated.View>
    );
  }

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: BG_TOP }} />;

  return (
    <LinearGradient colors={[BG_TOP, BG_BOTTOM]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ---------- Cabeçalho ---------- */}
        <FadeIn style={styles.top}>
          <Pressable onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={WHITE} />
          </Pressable>

          <View style={{ width: 42, height: 42 }}>
            <Avatar
              profile={{
                name,
                photo,
                color: info && !offline ? color : color + '66',
              }}
              size={42}
            />
            {info && <View style={[styles.statusDot, { backgroundColor: info.dot }]} />}
          </View>

          <View style={styles.titleWrap}>
            <Text style={styles.title} numberOfLines={1}>{name}</Text>
            {info && (
              <Text style={[styles.status, { color: info.color }]} numberOfLines={1}>
                {info.label}
              </Text>
            )}
          </View>

          {!offline && (
            <Pressable onPress={inviteToRoom} style={styles.playButton}>
              <Ionicons name="game-controller" size={16} color={WHITE} />
              <Text style={styles.playText}>Jogar</Text>
            </Pressable>
          )}
        </FadeIn>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={ERROR} />
            <Text style={styles.errorText}>Não foi possível abrir a conversa</Text>
          </View>
        )}

        {/* ---------- Mensagens ---------- */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          renderItem={renderMessage}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
          ListEmptyComponent={
            !error ? (
              <FadeIn style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="chatbubbles-outline" size={34} color={TEXT_MUTED} />
                </View>
                <Text style={styles.emptyText}>Diga oi para {name}</Text>
              </FadeIn>
            ) : null
          }
        />

        {/* ---------- Campo de mensagem ---------- */}
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, focused && styles.inputFocused]}
            placeholder="Mensagem"
            placeholderTextColor={TEXT_MUTED}
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            returnKeyType="send"
          />
          <SendButton onPress={send} enabled={canSend} />
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: Platform.OS === 'ios' ? 28 : 24,
  },

  top: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: BG_TOP,
  },
  titleWrap: { flex: 1, justifyContent: 'center' },
  title: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 22 },
  status: { fontFamily: FONT_SEMI, fontSize: 13, marginTop: 1 },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: BUTTON_PURPLE,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  playText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 15 },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,154,168,0.12)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  errorText: { fontFamily: FONT_SEMI, color: ERROR, fontSize: 14 },

  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '86%' },
  rowMine: { alignSelf: 'flex-end' },
  rowTheirs: { alignSelf: 'flex-start' },
  sideSlot: { width: 28 },

  bubble: {
    flexShrink: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 6,
  },
  mine: {
    backgroundColor: BUTTON_PURPLE,
    borderBottomRightRadius: 6,
  },
  theirs: {
    backgroundColor: SURFACE_LIGHT,
    borderBottomLeftRadius: 6,
  },
  bubbleText: { fontFamily: FONT_SEMI, color: WHITE, fontSize: 17 },
  time: {
    fontFamily: FONT_SEMI,
    color: TEXT_MUTED,
    fontSize: 11,
    alignSelf: 'flex-end',
    marginTop: 2,
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 18, textAlign: 'center' },

  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: SURFACE,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 18,
    color: WHITE,
    fontFamily: FONT_SEMI,
    fontSize: 17,
  },
  inputFocused: { borderColor: ACCENT, backgroundColor: SURFACE_LIGHT },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BUTTON_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonOff: { backgroundColor: SURFACE },
});