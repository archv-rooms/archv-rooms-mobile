import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Modal, Animated, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PressableScale from './PressableScale';
import Cover from './Cover';
import { GAMES, getCover } from '../services/roomHelpers';
import { vibrate } from '../services/settings';
import {
  FONT_BOLD,
  BG_BOTTOM,
  SURFACE,
  ACCENT,
  BUTTON_PURPLE,
  WHITE,
  TEXT_MUTED,
} from '../constants/palette';

const NATIVE = Platform.OS !== 'web';

// Check badge on the selected game, appears with a "pop"
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

// Bottom sheet to pick the game and the number of players
export default function CreateRoomModal({ visible, onClose, onConfirm }) {
  const [selectedGame, setSelectedGame] = useState(GAMES[0]);
  const [selectedMax, setSelectedMax] = useState(2);

  // Reset the choices every time the modal opens
  useEffect(() => {
    if (visible) {
      setSelectedGame(GAMES[0]);
      setSelectedMax(2);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
            <PressableScale onPress={onClose} style={styles.cancelButton} scale={0.95}>
              <Text style={styles.modalButtonText}>Cancelar</Text>
            </PressableScale>
            <PressableScale
              wrapStyle={{ flex: 1 }}
              onPress={() => onConfirm(selectedGame, selectedMax)}
              style={styles.confirmButton}
              scale={0.96}
            >
              <Text style={styles.modalButtonText}>Criar</Text>
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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