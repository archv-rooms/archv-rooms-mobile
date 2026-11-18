import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { useFonts } from 'expo-font';
import api from '../services/api';
import { vibrate } from '../services/settings';
import { getAccent } from '../services/roomHelpers';
import { showAlert } from '../components/AppModal';
import Cover from '../components/Cover';
import MemberRow, { EmptySlot } from '../components/MemberRow';
import {
  FONT_SEMI,
  FONT_BOLD,
  BG_TOP,
  BG_BOTTOM,
  SURFACE,
  BUTTON_PURPLE,
  WHITE,
  TEXT_MUTED,
  RED,
  AMBER,
} from '../constants/palette';

function extractRooms(res) {
  const body = res && res.data;
  if (body && body.data && Array.isArray(body.data.rooms)) return body.data.rooms;
  return [];
}

export default function LobbyScreen({ navigation, route }) {
  const [fontsLoaded] = useFonts({ Rajdhani_600SemiBold, Rajdhani_700Bold });
  const [room, setRoom] = useState(route.params.room);
  const leftRef = useRef(false);
  const closedRef = useRef(false);

  const isHost = !!room.isHost;
  const accent = getAccent(room.game);

  // Atualiza a sala a cada 3 segundos
  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const res = await api.get('/rooms');
        if (!active) return;
        const found = extractRooms(res).find((r) => r.id === room.id);
        if (found) {
          setRoom(found);
        } else if (!closedRef.current && !leftRef.current) {
          closedRef.current = true;
          showAlert('Sala fechada', 'O dono fechou a sala.');
          navigation.goBack();
        }
      } catch (e) {}
    }
    const timer = setInterval(refresh, 3000);
    return () => {
      active = false;
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

  function startGame() {
    if (!room.fileUrl) {
      showAlert('Erro', 'O arquivo deste jogo não está disponível.');
      return;
    }
    vibrate(40);
    navigation.navigate('Game', {
      game: {
        id: room.gameId,
        title: room.game,
        console: room.console,
        image: room.image,
        fileUrl: room.fileUrl,
      },
    });
  }

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: BG_TOP }} />;

  const members = (room.members || []).map((m) => ({
    id: m.id,
    name: m.username || m.name || 'jogador',
    isHost: m.id === room.hostId,
  }));
  members.sort((a, b) => (b.isHost ? 1 : 0) - (a.isHost ? 1 : 0));

  const full = members.length >= room.maxPlayers;
  const canStart = isHost && members.length >= 2;
  const status = full ? { label: 'SALA CHEIA', color: RED } : { label: 'AGUARDANDO', color: AMBER };
  const slots = Array.from({ length: room.maxPlayers }).map((_, i) => members[i] || null);

  let hint = 'Aguardando o anfitrião iniciar';
  if (isHost) hint = members.length < 2 ? 'Aguardando outro jogador entrar' : 'Pronto para iniciar';

  return (
    <LinearGradient colors={[BG_TOP, BG_BOTTOM]} style={{ flex: 1 }}>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
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
        </ScrollView>

        <Text style={styles.hint}>{hint}</Text>
        <View style={styles.actions}>
          <Pressable style={styles.leaveButton} onPress={leave}>
            <Ionicons name="exit-outline" size={18} color={RED} />
            <Text style={styles.leaveText}>Sair</Text>
          </Pressable>

          {isHost && (
            <Pressable
              style={[styles.mainButton, { backgroundColor: accent }, !canStart && styles.mainButtonOff]}
              onPress={startGame}
              disabled={!canStart}
            >
              <Ionicons name="play" size={18} color={canStart ? WHITE : TEXT_MUTED} />
              <Text style={[styles.mainText, !canStart && { color: TEXT_MUTED }]}>Iniciar jogo</Text>
            </Pressable>
          )}
        </View>
      </View>
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
  hint: {
    fontFamily: FONT_SEMI,
    color: TEXT_MUTED,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
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
  mainText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 17 },
});