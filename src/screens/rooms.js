import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { useFonts } from 'expo-font';
import { MOCK_ROOMS } from '../services/mock';
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

const GAMES = [
  'Street Fighter II',
  'Mortal Kombat',
  'Super Mario World',
  'Böbl',
  'From Below',
  'Spacegulls',
];

// Cor de destaque de cada jogo (sempre a mesma para o mesmo nome)
const ACCENTS = ['#8B7BFF', '#F0649A', '#F5A524', '#2FC4DB', '#4ADE80', '#FB7C3C'];

function getAccent(name) {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return ACCENTS[sum % ACCENTS.length];
}

export default function RoomsScreen({ route }) {
  const [fontsLoaded] = useFonts({ Rajdhani_600SemiBold, Rajdhani_700Bold });
  const [rooms, setRooms] = useState(MOCK_ROOMS);
  const [joinedIds, setJoinedIds] = useState([]);
  const [notice, setNotice] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedGame, setSelectedGame] = useState(GAMES[0]);
  const [selectedMax, setSelectedMax] = useState(2);

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
    setRooms(rooms.map((r) => (r.id === id ? { ...r, players: r.players + 1 } : r)));
    setJoinedIds([...joinedIds, id]);
  }

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: BG_TOP }} />;

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
          {rooms.map((room) => {
            const joined = joinedIds.includes(room.id);
            const full = room.players >= room.maxPlayers;
            const disabled = joined || full;
            const accent = getAccent(room.game);
            const hostInitial = (room.host || '?').charAt(0).toUpperCase();

            let status = { label: 'ABERTA', color: GREEN };
            if (joined) status = { label: 'NA SALA', color: '#C4BAFF' };
            else if (full) status = { label: 'CHEIA', color: RED };

            return (
              <LinearGradient
                key={room.id}
                colors={[accent + '55', SURFACE, SURFACE]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, { borderColor: accent + '55' }]}
              >
                {/* Ícone grande de marca d'água */}
                <Ionicons
                  name="game-controller"
                  size={110}
                  color={accent}
                  style={styles.watermark}
                />

                {/* Status */}
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>

                {/* Título */}
                <Text style={styles.game} numberOfLines={2}>{room.game}</Text>
                <Text style={styles.sub} numberOfLines={1}>
                  Sala de {room.host} • {room.maxPlayers} jogadores
                </Text>

                {/* Base */}
                <View style={styles.bottomRow}>
                  <View style={styles.avatarsWrap}>
                    <View style={styles.avatars}>
                      {Array.from({ length: room.maxPlayers }).map((_, i) => {
                        const filled = i < room.players;
                        return (
                          <View
                            key={i}
                            style={[
                              styles.avatar,
                              i > 0 && { marginLeft: -10 },
                              filled
                                ? { backgroundColor: accent, borderColor: SURFACE }
                                : styles.avatarEmpty,
                            ]}
                          >
                            {filled &&
                              (i === 0 ? (
                                <Text style={styles.avatarText}>{hostInitial}</Text>
                              ) : (
                                <Ionicons name="person" size={14} color={WHITE} />
                              ))}
                          </View>
                        );
                      })}
                    </View>
                    <Text style={styles.count}>
                      {room.players}/{room.maxPlayers}
                    </Text>
                  </View>

                  <Pressable
                    disabled={disabled}
                    onPress={() => joinRoom(room.id)}
                    style={[
                      styles.joinButton,
                      !disabled && { backgroundColor: accent },
                      joined && styles.joinButtonJoined,
                      full && !joined && styles.joinButtonOff,
                    ]}
                  >
                    {joined ? (
                      <Ionicons name="checkmark" size={16} color={GREEN} />
                    ) : full ? (
                      <Ionicons name="lock-closed" size={14} color={TEXT_MUTED} />
                    ) : (
                      <Ionicons name="play" size={14} color={WHITE} />
                    )}
                    <Text
                      style={[
                        styles.joinText,
                        joined && { color: GREEN },
                        full && !joined && { color: TEXT_MUTED },
                      ]}
                    >
                      {joined ? 'Na sala' : full ? 'Cheia' : 'Entrar'}
                    </Text>
                  </Pressable>
                </View>
              </LinearGradient>
            );
          })}
        </ScrollView>

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

  // ---------- Card da sala ----------
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    right: -14,
    top: -10,
    opacity: 0.12,
    transform: [{ rotate: '-14deg' }],
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontFamily: FONT_BOLD, fontSize: 12, letterSpacing: 1.2 },
  game: {
    fontFamily: FONT_BOLD,
    color: WHITE,
    fontSize: 26,
    lineHeight: 28,
    marginTop: 6,
    paddingRight: 60,
  },
  sub: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 14, marginTop: 2 },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  avatarsWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatars: { flexDirection: 'row' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmpty: {
    backgroundColor: '#3A3158',
    borderColor: SURFACE,
  },
  avatarText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 14 },
  count: { fontFamily: FONT_BOLD, color: TEXT_MUTED, fontSize: 15 },

  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BUTTON_PURPLE,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  joinButtonJoined: {
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.4)',
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