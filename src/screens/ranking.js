import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { useFonts } from 'expo-font';
import api from '../services/api';
import { vibrate } from '../services/settings';
import FadeIn from '../components/FadeIn';
import AnimatedRow from '../components/AnimatedRow';
import EmptyState from '../components/EmptyState';
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

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return h + 'h ' + m + 'min';
  if (m > 0) return m + 'min';
  return s + 's';
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

  return (
    <LinearGradient colors={[BG_TOP, BG_BOTTOM]} style={{ flex: 1 }}>
      <View style={styles.container}>
        <FadeIn style={styles.top}>
          <Text style={styles.title}>Ranking</Text>
          <Text style={styles.subtitle}>Quem mais jogou</Text>
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

          {ranking.map((item, i) => {
            const name = (item.user && (item.user.username || item.user.name)) || 'Jogador';
            const medal = MEDALS[item.position - 1];
            return (
              <AnimatedRow key={'rank-' + animKey + '-' + item.position} index={i}>
                <View style={[styles.row, medal && { borderColor: medal + '88' }]}>
                  <View style={[styles.pos, medal && { backgroundColor: medal + '30' }]}>
                    {medal ? (
                      <Ionicons name="trophy" size={18} color={medal} />
                    ) : (
                      <Text style={styles.posText}>{item.position}</Text>
                    )}
                  </View>
                  <Text style={styles.name} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={styles.time}>{formatTime(item.totalDuration)}</Text>
                </View>
              </AnimatedRow>
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
  top: { marginBottom: 14 },
  title: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 28, letterSpacing: 0.5 },
  subtitle: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    height: 60,
    marginBottom: 10,
  },
  pos: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: SURFACE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 16 },
  name: { flex: 1, fontFamily: FONT_BOLD, color: WHITE, fontSize: 18 },
  time: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 15 },
  emptySpace: { paddingTop: 50, paddingBottom: 50 },
  emptyText: { textAlign: 'center' },
});