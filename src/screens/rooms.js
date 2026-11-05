import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
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

export default function RoomsScreen({ route }) {
  const [fontsLoaded] = useFonts({ Rajdhani_600SemiBold, Rajdhani_700Bold });
  const [rooms, setRooms] = useState(MOCK_ROOMS);
  const [joinedIds, setJoinedIds] = useState([]);
  const [notice, setNotice] = useState('');

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

  function createRoom() {
    vibrate(30);
    const room = {
      id: 'r' + Date.now(),
      game: 'Street Fighter II',
      host: 'você',
      players: 1,
      maxPlayers: 2,
    };
    setRooms([room, ...rooms]);
    setJoinedIds([...joinedIds, room.id]);
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
          <Pressable style={styles.createButton} onPress={createRoom}>
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
            let label = 'Entrar';
            if (joined) label = 'Na sala';
            else if (full) label = 'Cheia';

            return (
              <View key={room.id} style={styles.row}>
                <View style={styles.icon}>
                  <Ionicons name="game-controller" size={22} color={TEXT_MUTED} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.game} numberOfLines={1}>{room.game}</Text>
                  <Text style={styles.sub}>
                    {room.host} • {room.players}/{room.maxPlayers} jogadores
                  </Text>
                </View>
                <Pressable
                  disabled={disabled}
                  onPress={() => joinRoom(room.id)}
                  style={[styles.joinButton, disabled && styles.joinButtonOff]}
                >
                  <Text style={[styles.joinText, joined && { color: GREEN }]}>{label}</Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    height: 70,
    marginBottom: 10,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  game: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 18 },
  sub: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 14 },
  joinButton: {
    backgroundColor: BUTTON_PURPLE,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  joinButtonOff: { backgroundColor: 'rgba(255,255,255,0.08)' },
  joinText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 15 },
});