import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_BOLD, BUTTON_PURPLE, SURFACE_LIGHT, WHITE } from '../constants/palette';

// Overlapping avatars (the first one is the host)
export default function RoomAvatars({ room, size = 26 }) {
  const hostInitial = (room.host || '?').charAt(0).toUpperCase();

  return (
    <View style={{ flexDirection: 'row' }}>
      {Array.from({ length: room.maxPlayers }).map((_, i) => {
        const filled = i < room.players;
        return (
          <View
            key={i}
            style={[
              styles.avatar,
              { width: size, height: size, borderRadius: size / 2 },
              i > 0 && { marginLeft: -8 },
              filled ? (i === 0 ? styles.avatarHost : styles.avatarFilled) : styles.avatarEmpty,
            ]}
          >
            {filled &&
              (i === 0 ? (
                <Text style={styles.avatarText}>{hostInitial}</Text>
              ) : (
                <Ionicons name="person" size={size * 0.45} color={WHITE} />
              ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 2,
    borderColor: '#1B1630',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHost: { backgroundColor: BUTTON_PURPLE },
  avatarFilled: { backgroundColor: SURFACE_LIGHT },
  avatarEmpty: { backgroundColor: 'rgba(255,255,255,0.08)' },
  avatarText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 12 },
});