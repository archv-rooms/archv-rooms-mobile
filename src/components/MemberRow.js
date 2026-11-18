import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { avatarColor } from '../services/roomHelpers';
import { FONT_SEMI, FONT_BOLD, SURFACE, WHITE, TEXT_MUTED, GREEN, SOFT } from '../constants/palette';

// One player in the lobby
export default function MemberRow({ member }) {
  const color = avatarColor(member.name);
  let badge = { label: 'ESPERANDO', color: TEXT_MUTED, bg: 'rgba(255,255,255,0.08)' };
  if (member.isHost) badge = { label: 'DONO', color: SOFT, bg: 'rgba(142,124,240,0.2)' };
  else if (member.ready) badge = { label: 'PRONTO', color: GREEN, bg: 'rgba(74,222,128,0.14)' };

  return (
    <View style={styles.member}>
      <View style={[styles.avatar, { backgroundColor: color + '30', borderColor: color }]}>
        <Text style={[styles.avatarText, { color }]}>{member.name.trim().charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.memberName} numberOfLines={1}>
        {member.isMe ? 'você' : member.name}
      </Text>
      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
        <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
      </View>
    </View>
  );
}

// Free slot waiting for a player
export function EmptySlot() {
  return (
    <View style={[styles.member, styles.memberEmpty]}>
      <View style={[styles.avatar, styles.avatarEmpty]}>
        <Ionicons name="person-add-outline" size={16} color={TEXT_MUTED} />
      </View>
      <Text style={styles.waitingText}>Aguardando jogador...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: SURFACE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    height: 56,
    marginBottom: 8,
  },
  memberEmpty: { backgroundColor: 'transparent', borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.15)' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmpty: { borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1.5, backgroundColor: 'transparent' },
  avatarText: { fontFamily: FONT_BOLD, fontSize: 17 },
  memberName: { flex: 1, fontFamily: FONT_BOLD, color: WHITE, fontSize: 18 },
  waitingText: { flex: 1, fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 16 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: FONT_BOLD, fontSize: 11, letterSpacing: 1 },
});