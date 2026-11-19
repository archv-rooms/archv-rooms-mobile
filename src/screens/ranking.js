import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, RefreshControl, Pressable } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { useFonts } from 'expo-font';
import api from '../services/api';
import { vibrate } from '../services/settings';
import FadeIn from '../components/FadeIn';
import EmptyState from '../components/EmptyState';
import { Avatar } from './profile';
import {
  FONT_SEMI,
  FONT_BOLD,
  BG_TOP,
  BG_BOTTOM,
  SURFACE,
  SURFACE_LIGHT,
  BUTTON_PURPLE,
  WHITE,
  TEXT_MUTED,
} from '../constants/palette';

const MEDALS = ['#FFD54A', '#C9CED6', '#D08B54'];
const CARD_HEIGHTS = [210, 182, 170];
const ENTER_DELAY = [0, 120, 240];

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return h + 'h ' + m + 'min';
  if (m > 0) return m + 'min';
  return s + 's';
}

function getName(item) {
  return (item.user && (item.user.username || item.user.name)) || 'Jogador';
}

// Podium card (index 0 = 1st place, 1 = 2nd, 2 = 3rd)
function PodiumCard({ item, index }) {
  const medal = MEDALS[index];
  const name = getName(item);
  const size = index === 0 ? 64 : 52;

  return (
    <Animated.View
      entering={FadeInUp.delay(ENTER_DELAY[index]).springify().damping(16)}
      style={[styles.podiumCard, { height: CARD_HEIGHTS[index], borderColor: medal + '66' }]}
    >
      <LinearGradient
        colors={[medal + '33', 'rgba(255,255,255,0.02)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.accentBar, { backgroundColor: medal }]} />
      <Text style={[styles.podiumRank, { color: medal }]}>{index + 1}</Text>
      <Avatar profile={{ name, color: medal }} size={size} />
      <Text style={styles.podiumName} numberOfLines={1}>{name}</Text>
      <Text style={styles.podiumTime}>{formatTime(item.totalDuration)}</Text>
    </Animated.View>
  );
}

// List row: enters from below, small press effect
function RankRow({ item, index }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInDown.delay(350 + index * 45).springify().damping(18)}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 18, stiffness: 300 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 18, stiffness: 300 }); }}
        onPress={() => vibrate(10)}
      >
        <Animated.View style={[styles.row, animatedStyle]}>
          <Text style={styles.posText}>{item.position}</Text>
          <Avatar profile={{ name: getName(item) }} size={38} />
          <Text style={styles.name} numberOfLines={1}>{getName(item)}</Text>
          <Text style={styles.time}>{formatTime(item.totalDuration)}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export default function RankingScreen() {
  const [fontsLoaded] = useFonts({ Rajdhani_600SemiBold, Rajdhani_700Bold });
  const [ranking, setRanking] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [failed, setFailed] = useState(false);

  async function load() {
    try {
      const res = await api.get('/leaderboard/ranking');
      setRanking(res.data.data.ranking || []);
      setFailed(false);
    } catch (e) {
      setFailed(true);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    vibrate(20);
    await load();
    setAnimKey((k) => k + 1);
    setRefreshing(false);
  }

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: BG_TOP }} />;

  const top = ranking.slice(0, 3);
  const rest = ranking.slice(3);
  // Visual order on the podium: 2nd, 1st, 3rd
  const podiumOrder = [1, 0, 2].filter((i) => top[i]);

  return (
    <LinearGradient colors={[BG_TOP, BG_BOTTOM]} style={{ flex: 1 }}>
      <View style={styles.container}>
        <FadeIn style={styles.top}>
          <Text style={styles.title}>Ranking</Text>
          <Text style={styles.subtitle}>
            {ranking.length > 0 ? 'Quem mais jogou  |  ' + ranking.length + ' jogadores' : 'Quem mais jogou'}
          </Text>
        </FadeIn>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={WHITE}
              colors={[BUTTON_PURPLE]}
              progressBackgroundColor={SURFACE}
            />
          }
        >
          {ranking.length === 0 && (
            <EmptyState
              icon="trophy-outline"
              text={failed ? 'Não foi possível carregar o ranking' : 'Ninguém no ranking ainda. Jogue para aparecer aqui!'}
              style={styles.emptySpace}
              textStyle={styles.emptyText}
            />
          )}

          <View key={'content-' + animKey}>
            {top.length > 0 && (
              <View style={styles.podium}>
                {podiumOrder.map((i) => (
                  <PodiumCard key={'spot-' + i} item={top[i]} index={i} />
                ))}
              </View>
            )}

            {rest.map((item, i) => (
              <RankRow key={'rank-' + item.position} item={item} index={i} />
            ))}
          </View>
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
  top: { marginBottom: 16 },
  title: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 28, letterSpacing: 0.5 },
  subtitle: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 14 },

  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 20,
  },
  podiumCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 14,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: SURFACE,
  },
  accentBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  podiumRank: { fontFamily: FONT_BOLD, fontSize: 30, marginBottom: 6 },
  podiumName: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 16, marginTop: 8, maxWidth: '100%' },
  podiumTime: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 13, marginTop: 2 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    height: 62,
    marginBottom: 10,
  },
  posText: { width: 26, fontFamily: FONT_BOLD, color: TEXT_MUTED, fontSize: 17 },
  name: { flex: 1, fontFamily: FONT_BOLD, color: WHITE, fontSize: 18 },
  time: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 15 },
  emptySpace: { paddingTop: 50, paddingBottom: 50 },
  emptyText: { textAlign: 'center' },
});