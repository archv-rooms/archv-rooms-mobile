import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_BOLD, BUTTON_PURPLE, SURFACE_LIGHT, WHITE } from '../constants/palette';

// Overlapping avatars (the first one is the host)
export default function RoomAvatars({ room, size = 26 }) {
  const hostInitial = (room.host || '?').charAt(0).toUpperCase();

  // Host first, then the other members
  const members = Array.isArray(room.members) ? [...room.members] : [];
  members.sort((a, b) => (b.id === room.hostId ? 1 : 0) - (a.id === room.hostId ? 1 : 0));

  return (
    <View style={{ flexDirection: 'row' }}>
      {Array.from({ length: room.maxPlayers }).map((_, i) => {
        const filled = i < room.players;
        const photo = filled && members[i] && members[i].avatar ? members[i].avatar : null;
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
            {photo ? (
              <Image
                source={{ uri: photo }}
                style={{ width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }}
              />
            ) : (
              filled &&
              (i === 0 ? (
                <Text style={styles.avatarText}>{hostInitial}</Text>
              ) : (
                <Ionicons name="person" size={size * 0.45} color={WHITE} />
              ))
            )}
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
    overflow: 'hidden',
  },
  avatarHost: { backgroundColor: BUTTON_PURPLE },
  avatarFilled: { backgroundColor: SURFACE_LIGHT },
  avatarEmpty: { backgroundColor: 'rgba(255,255,255,0.08)' },
  avatarText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 12 },
});