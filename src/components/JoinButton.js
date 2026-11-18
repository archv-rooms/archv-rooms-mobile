import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import { FONT_BOLD, BUTTON_PURPLE, WHITE, TEXT_MUTED, RED } from '../constants/palette';

// Join / Leave / Full button. compact turns it into a round icon-only button
export default function JoinButton({ joined, full, onJoin, onLeave, compact }) {
  if (joined) {
    return (
      <PressableScale
        onPress={onLeave}
        style={[compact ? styles.iconButton : styles.joinButton, styles.leaveButton]}
      >
        <Ionicons name="exit-outline" size={compact ? 20 : 16} color={RED} />
        {!compact && <Text style={[styles.joinText, { color: RED }]}>Sair</Text>}
      </PressableScale>
    );
  }

  return (
    <PressableScale
      onPress={full ? undefined : onJoin}
      style={[
        compact ? styles.iconButton : styles.joinButton,
        full ? styles.buttonOff : styles.buttonOn,
      ]}
    >
      <Ionicons
        name={full ? 'lock-closed' : 'play'}
        size={compact ? 18 : 14}
        color={full ? TEXT_MUTED : WHITE}
        style={!full && compact ? { marginLeft: 2 } : null}
      />
      {!compact && <Text style={[styles.joinText, full && { color: TEXT_MUTED }]}>{full ? 'Cheia' : 'Entrar'}</Text>}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOn: { backgroundColor: BUTTON_PURPLE },
  buttonOff: { backgroundColor: 'rgba(255,255,255,0.08)' },
  leaveButton: {
    backgroundColor: 'rgba(255,138,155,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,138,155,0.4)',
  },
  joinText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 15 },
});