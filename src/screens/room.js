import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { useFonts } from 'expo-font';
import api from '../services/api';
import { vibrate } from '../services/settings';
import { getAccent, avatarColor } from '../services/roomHelpers';
import { showAlert } from '../components/AppModal';
import Cover from '../components/Cover';
import MemberRow, { EmptySlot } from '../components/MemberRow';
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
  RED,
  AMBER,
} from '../constants/palette';

const HOST_STEPS = [
  {
    title: 'Inicie o jogo',
    text: 'Quando todos estiverem prontos, toque em "Iniciar jogo". O jogo abre para todos.',
  },
  {
    title: 'Abra o Netplay',
    text: 'Dentro do jogo, abra o menu do emulador (as três linhas no canto da tela) e toque em Netplay.',
  },
  {
    title: 'Crie a sala',
    text: 'Toque em "Criar uma Sala", escolha um nome e uma senha e coloque seu nome de jogador.',
  },
  {
    title: 'Avise os amigos',
    text: 'Antes de iniciar, combine o nome e a senha no chat do Lobby para os outros entrarem.',
  },
];

const GUEST_STEPS = [
  {
    title: 'Marque "Estou pronto"',
    text: 'Toque no botão e espere o dono da sala iniciar o jogo.',
  },
  {
    title: 'Abra o Netplay',
    text: 'Quando o jogo abrir, abra o menu do emulador (as três linhas no canto da tela) e toque em Netplay.',
  },
  {
    title: 'Entre na sala',
    text: 'Na aba "Salas", toque na sala que o dono criou e digite a senha que ele combinou no chat.',
  },
  {
    title: 'Jogue',
    text: 'Quando todos entrarem, o dono começa a partida e vocês jogam juntos.',
  },
];

export default function LobbyScreen({ navigation, route }) {
  const [fontsLoaded] = useFonts({ Rajdhani_600SemiBold, Rajdhani_700Bold });
  const [room, setRoom] = useState(route.params.room);
  const [readyIds, setReadyIds] = useState([]);
  const [messages, setMessages] = useState([]);
  const [meId, setMeId] = useState(null);
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const leftRef = useRef(false);
  const closedRef = useRef(false);
  const handledRef = useRef(undefined);
  const activeRef = useRef(true);

  const isHost = !!room.isHost;
  const accent = getAccent(room.game);

  function openGame(r) {
    if (!r.fileUrl) {
      showAlert('Erro', 'O arquivo deste jogo não está disponível.');
      return;
    }
    vibrate(40);
    navigation.navigate('Game', {
      game: {
        id: r.gameId,
        title: r.game,
        console: r.console,
        image: r.image,
        fileUrl: r.fileUrl,
      },
    });
  }

  function applyState(d) {
    setRoom(d.room);
    setReadyIds(d.ready || []);
    setMessages(d.messages || []);
    setMeId(d.me);
  }

  async function refresh() {
    try {
      const res = await api.get('/rooms/' + room.id + '/state');
      if (!activeRef.current) return;
      const d = res.data.data;
      applyState(d);
      if (handledRef.current === undefined) {
        handledRef.current = d.startedAt || null;
      } else if (d.startedAt && d.startedAt !== handledRef.current) {
        handledRef.current = d.startedAt;
        openGame(d.room);
      }
    } catch (e) {
      const status = e && e.response && e.response.status;
      if ((status === 404 || status === 403) && !closedRef.current && !leftRef.current) {
        closedRef.current = true;
        showAlert('Sala fechada', 'A sala foi fechada.');
        navigation.goBack();
      }
    }
  }

  // Atualiza a sala a cada 2 segundos
  useEffect(() => {
    activeRef.current = true;
    refresh();
    const timer = setInterval(refresh, 2000);
    return () => {
      activeRef.current = false;
      clearInterval(timer);
    };
  }, []);

  // Ao sair da tela (botão, seta ou voltar do Android), sai da sala na API
  useEffect(() => {
    return navigation.addListener('beforeRemove', () => {
      if (leftRef.current) return;
      leftRef.current = true;
      api.post('/rooms/' + room.id + '/leave').catch(() => {});
    });
  }, []);

  function leave() {
    if (isHost && Platform.OS !== 'web') {
      showAlert('Fechar sala', 'Como você é o dono, sair fecha a sala para todos.', [
        { text: 'Ficar', style: 'cancel' },
        { text: 'Fechar sala', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
      return;
    }
    navigation.goBack();
  }

  async function toggleReady() {
    vibrate(20);
    const next = !readyIds.includes(meId);
    try {
      const res = await api.post('/rooms/' + room.id + '/ready', { ready: next });
      applyState(res.data.data);
    } catch (e) {
      showAlert('Erro', 'Não foi possível marcar pronto.');
    }
  }

  async function startGame() {
    try {
      const res = await api.post('/rooms/' + room.id + '/start');
      const d = res.data.data;
      handledRef.current = d.startedAt;
      applyState(d);
      openGame(d.room);
    } catch (e) {
      const msg = e && e.response && e.response.data && e.response.data.message;
      showAlert('Erro', msg || 'Não foi possível iniciar.');
    }
  }

  async function send() {
    const content = text.trim();
    if (!content) return;
    vibrate(15);
    setText('');
    try {
      const res = await api.post('/rooms/' + room.id + '/messages', { content });
      applyState(res.data.data);
    } catch (e) {
      showAlert('Erro', 'Não foi possível enviar a mensagem.');
    }
  }

  function openHelp() {
    vibrate(15);
    setShowHelp(true);
  }

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: BG_TOP }} />;

  const members = (room.members || []).map((m) => ({
    id: m.id,
    name: m.username || m.name || 'jogador',
    isHost: m.id === room.hostId,
    isMe: m.id === meId,
    ready: readyIds.includes(m.id),
  }));
  members.sort((a, b) => (b.isHost ? 1 : 0) - (a.isHost ? 1 : 0));

  const others = members.filter((m) => !m.isHost);
  const me = members.find((m) => m.isMe);
  const allReady = others.length > 0 && others.every((m) => m.ready);
  const canStart = isHost && allReady;
  const full = members.length >= room.maxPlayers;

  let status = { label: 'AGUARDANDO', color: AMBER };
  if (allReady) status = { label: 'TODOS PRONTOS', color: GREEN };
  else if (full) status = { label: 'SALA CHEIA', color: RED };

  let hint;
  if (isHost) {
    if (members.length < 2) hint = 'Aguardando outro jogador entrar';
    else if (!allReady) hint = 'Aguardando todos ficarem prontos';
    else hint = 'Todos prontos!';
  } else {
    hint = me && me.ready ? 'Aguardando o anfitrião iniciar' : 'Toque em "Estou pronto" quando quiser jogar';
  }

  const steps = isHost ? HOST_STEPS : GUEST_STEPS;
  const slots = Array.from({ length: room.maxPlayers }).map((_, i) => members[i] || null);
  const recent = messages.slice(-5);

  return (
    <LinearGradient colors={[BG_TOP, BG_BOTTOM]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 12 }}
        >
          <View style={[styles.hero, { borderColor: accent + '66' }]}>
            <Cover uri={room.image} accent={accent} iconSize={56} style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={['rgba(20,17,31,0.55)', 'transparent', 'rgba(20,17,31,0.94)']}
              locations={[0, 0.4, 1]}
              style={StyleSheet.absoluteFill}
            />

            <Pressable onPress={leave} style={styles.back}>
              <Ionicons name="arrow-back" size={22} color={WHITE} />
            </Pressable>

            <View style={styles.statusWrap}>
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>

            <View style={styles.heroInfo}>
              <Text style={styles.heroGame} numberOfLines={1}>{room.game}</Text>
              <Text style={styles.heroSub} numberOfLines={1}>
                {isHost ? 'Sua sala' : 'Sala de ' + room.host}
              </Text>
            </View>
          </View>

          <View style={styles.sectionRow}>
            <Text style={styles.section}>JOGADORES</Text>
            <Text style={styles.sectionCount}>
              {members.length}/{room.maxPlayers}
            </Text>
          </View>

          {slots.map((member, i) =>
            member ? <MemberRow key={member.id} member={member} /> : <EmptySlot key={'empty-' + i} />
          )}

          <Text style={[styles.section, { marginTop: 16, marginBottom: 8 }]}>CHAT</Text>
          <View style={styles.chat}>
            {recent.length === 0 && <Text style={styles.systemText}>Nenhuma mensagem ainda</Text>}
            {recent.map((m) => (
              <View key={m.id} style={styles.chatLine}>
                <Text style={[styles.chatFrom, { color: m.userId === meId ? '#C4BAFF' : avatarColor(m.from) }]}>
                  {m.userId === meId ? 'você' : m.from}
                </Text>
                <Text style={styles.chatText}>{m.text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, focused && styles.inputFocused]}
            placeholder="Mensagem para a sala"
            placeholderTextColor={TEXT_MUTED}
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            returnKeyType="send"
          />
          <Pressable
            style={[styles.sendButton, text.trim() === '' && styles.sendButtonOff]}
            onPress={send}
            disabled={text.trim() === ''}
          >
            <Ionicons name="send" size={16} color={text.trim() === '' ? TEXT_MUTED : WHITE} />
          </Pressable>
        </View>

        <Text style={styles.hint}>{hint}</Text>

        <Pressable style={styles.helpButton} onPress={openHelp}>
          <Ionicons name="help-circle-outline" size={18} color={ACCENT} />
          <Text style={styles.helpText}>Como jogar online</Text>
        </Pressable>

        <View style={styles.actions}>
          <Pressable style={styles.leaveButton} onPress={leave}>
            <Ionicons name="exit-outline" size={18} color={RED} />
            <Text style={styles.leaveText}>Sair</Text>
          </Pressable>

          {isHost ? (
            <Pressable
              style={[styles.mainButton, { backgroundColor: accent }, !canStart && styles.mainButtonOff]}
              onPress={startGame}
              disabled={!canStart}
            >
              <Ionicons name="play" size={18} color={canStart ? WHITE : TEXT_MUTED} />
              <Text style={[styles.mainText, !canStart && { color: TEXT_MUTED }]}>Iniciar jogo</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[
                styles.mainButton,
                me && me.ready ? styles.mainButtonReady : { backgroundColor: accent },
              ]}
              onPress={toggleReady}
            >
              <Ionicons
                name={me && me.ready ? 'close-circle-outline' : 'checkmark-circle'}
                size={18}
                color={me && me.ready ? GREEN : WHITE}
              />
              <Text style={[styles.mainText, me && me.ready && { color: GREEN }]}>
                {me && me.ready ? 'Cancelar' : 'Estou pronto'}
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showHelp}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHelp(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Como jogar online</Text>
                <Text style={styles.cardSub}>
                  {isHost ? 'Passos para o dono da sala' : 'Passos para quem entra na sala'}
                </Text>
              </View>
              <Pressable onPress={() => setShowHelp(false)} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={WHITE} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              {steps.map((step, i) => (
                <View key={step.title} style={styles.step}>
                  <View style={[styles.stepNumber, { backgroundColor: accent }]}>
                    <Text style={styles.stepNumberText}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepText}>{step.text}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <Pressable
              style={[styles.understoodButton, { backgroundColor: accent }]}
              onPress={() => setShowHelp(false)}
            >
              <Text style={styles.mainText}>Entendi</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  hero: {
    height: 170,
    backgroundColor: SURFACE,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  back: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(20,17,31,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusWrap: {
    position: 'absolute',
    top: 24,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: {
    fontFamily: FONT_BOLD,
    fontSize: 12,
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  heroInfo: { paddingHorizontal: 16, paddingBottom: 14 },
  heroGame: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 28, lineHeight: 30 },
  heroSub: { fontFamily: FONT_SEMI, color: '#D6CEE8', fontSize: 14, marginTop: 1 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 8,
  },
  section: { fontFamily: FONT_BOLD, color: TEXT_MUTED, fontSize: 14, letterSpacing: 1.5 },
  sectionCount: { fontFamily: FONT_BOLD, color: TEXT_MUTED, fontSize: 14 },
  chat: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
    minHeight: 60,
  },
  systemText: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 13, textAlign: 'center' },
  chatLine: { flexDirection: 'row', gap: 8 },
  chatFrom: { fontFamily: FONT_BOLD, fontSize: 15 },
  chatText: { flex: 1, fontFamily: FONT_SEMI, color: WHITE, fontSize: 15 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: SURFACE,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 16,
    color: WHITE,
    fontFamily: FONT_SEMI,
    fontSize: 16,
  },
  inputFocused: { borderColor: ACCENT, backgroundColor: SURFACE_LIGHT },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BUTTON_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonOff: { backgroundColor: SURFACE },
  hint: {
    fontFamily: FONT_SEMI,
    color: TEXT_MUTED,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  helpText: { fontFamily: FONT_BOLD, color: ACCENT, fontSize: 15 },
  actions: { flexDirection: 'row', gap: 10 },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 26,
    backgroundColor: 'rgba(255,138,155,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,138,155,0.4)',
  },
  leaveText: { fontFamily: FONT_BOLD, color: RED, fontSize: 16 },
  mainButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 26,
    backgroundColor: BUTTON_PURPLE,
  },
  mainButtonOff: { backgroundColor: 'rgba(255,255,255,0.08)' },
  mainButtonReady: {
    backgroundColor: 'rgba(74,222,128,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.4)',
  },
  mainText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 17 },

  // ---------- Janela "Como jogar online" ----------
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,8,18,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: SURFACE,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 22 },
  cardSub: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 14, marginTop: 2 },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  step: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 16 },
  stepTitle: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 17 },
  stepText: {
    fontFamily: FONT_SEMI,
    color: TEXT_MUTED,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  understoodButton: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});