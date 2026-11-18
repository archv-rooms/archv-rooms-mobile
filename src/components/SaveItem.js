import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Animated, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import { showAlert } from './AppModal';
import {
  FONT_SEMI,
  FONT_BOLD,
  SURFACE,
  ACCENT,
  BUTTON_PURPLE,
  WHITE,
  TEXT_MUTED,
  PINK,
  consoleColor,
} from '../constants/palette';

const NATIVE = Platform.OS !== 'web';

// "Agora há pouco", "5 min atrás", "2 h atrás", "3 d atrás" or the date
function formatSaveDate(iso) {
  const date = new Date(iso);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'Agora há pouco';
  if (minutes < 60) return minutes + ' min atrás';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + ' h atrás';
  const days = Math.floor(hours / 24);
  if (days < 7) return days + ' d atrás';
  return date.toLocaleDateString('pt-BR');
}

// One row in the Saves tab
export default function SaveItem({ save, index, onPress, onDelete }) {
  const enter = useRef(new Animated.Value(0)).current;
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(Math.min(index, 8) * 60),
      Animated.spring(enter, { toValue: 1, useNativeDriver: NATIVE, tension: 60, friction: 9 }),
    ]).start();
  }, []);

  const color = consoleColor(save.console);
  const initial = (save.title || '?').trim().charAt(0).toUpperCase();
  const hasImage = save.image && !imageFailed;

  function confirmDelete() {
    showAlert('Apagar save', 'Tem certeza que quer apagar este save?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: onDelete },
    ]);
  }

  return (
    <Animated.View
      style={{
        opacity: enter.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
        transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
      }}
    >
      <PressableScale onPress={onPress} style={styles.saveItem} scale={0.97}>
        <View style={[styles.saveThumb, { backgroundColor: color + '30' }]}>
          {hasImage ? (
            <Image
              source={{ uri: save.image }}
              style={styles.saveThumbImage}
              fadeDuration={0}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <Text style={[styles.saveInitial, { color }]}>{initial}</Text>
          )}
        </View>

        <View style={styles.saveBody}>
          <Text style={styles.saveTitle} numberOfLines={1}>
            {save.title}
          </Text>
          <View style={styles.saveMeta}>
            {save.console ? (
              <View style={[styles.saveBadge, { backgroundColor: color + '30' }]}>
                <Text style={[styles.saveBadgeText, { color }]}>{save.console}</Text>
              </View>
            ) : null}
            <Ionicons name="time-outline" size={14} color={TEXT_MUTED} />
            <Text style={styles.saveDate} numberOfLines={1}>
              {formatSaveDate(save.createdAt)}
            </Text>
          </View>
        </View>

        <View style={styles.saveActions}>
          <View style={styles.savePlay} pointerEvents="none">
            <Ionicons name="play" size={16} color={WHITE} style={{ marginLeft: 2 }} />
          </View>
          <PressableScale onPress={confirmDelete} style={styles.saveDelete} scale={0.8}>
            <Ionicons name="trash-outline" size={18} color={PINK} />
          </PressableScale>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  saveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  saveThumb: {
    width: 64,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveThumbImage: { width: '100%', height: '100%' },
  saveInitial: { fontFamily: FONT_BOLD, fontSize: 28 },
  saveBody: { flex: 1, gap: 6 },
  saveTitle: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 18 },
  saveMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  saveBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  saveBadgeText: { fontFamily: FONT_BOLD, fontSize: 12, letterSpacing: 0.5 },
  saveDate: { flex: 1, fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 14 },
  saveActions: { alignItems: 'center', gap: 8 },
  savePlay: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BUTTON_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  saveDelete: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,107,138,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});