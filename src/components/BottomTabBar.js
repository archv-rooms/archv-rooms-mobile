import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { useFonts } from 'expo-font';
import { vibrate } from '../services/settings';
import PressableScale from './PressableScale';
import { SPRING } from '../constants/motion';
import {
  FONT_SEMI,
  FONT_BOLD,
  SURFACE_LIGHT,
  ACCENT,
  BUTTON_PURPLE,
  WHITE,
  TEXT_MUTED,
  ERROR,
} from '../constants/palette';

const PILL_WIDTH = 56;
const BAR_PADDING = 8;

// Screens where the bar is visible, and the tab index of each one
const TAB_INDEX = { Home: 0, Friends: 1, Rooms: 2, Settings: 3, About: 3, Ranking: 3 };

function TabItem({ icon, activeIcon, label, active, onPress }) {
  const scale = useSharedValue(1);
  const isFirst = React.useRef(true);

  // O ícone dá um pequeno pulo quando a aba fica ativa
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (active) {
      scale.value = 0.75;
      scale.value = withSpring(1, SPRING.pop);
    }
  }, [active]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <PressableScale onPress={onPress} wrapStyle={{ flex: 1 }} style={styles.tabItem} scale={0.88}>
      <Animated.View style={[styles.tabIcon, iconStyle]}>
        <Ionicons name={active ? activeIcon : icon} size={24} color={active ? WHITE : TEXT_MUTED} />
      </Animated.View>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </PressableScale>
  );
}

export default function BottomTabBar({ currentRoute, onNavigate, onSignOut }) {
  const [fontsLoaded] = useFonts({ Rajdhani_600SemiBold, Rajdhani_700Bold });
  const [barWidth, setBarWidth] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const visible = TAB_INDEX[currentRoute] !== undefined;
  const routeIndex = visible ? TAB_INDEX[currentRoute] : 0;
  const activeIndex = menuOpen ? 3 : routeIndex;
  const accountActive =
    menuOpen || currentRoute === 'Settings' || currentRoute === 'About' || currentRoute === 'Ranking';

  const itemWidth = barWidth > 0 ? (barWidth - BAR_PADDING * 2) / 4 : 0;

  const pillIndex = useSharedValue(0);
  const enter = useSharedValue(0);
  const menu = useSharedValue(0);

  // The purple pill slides to the active tab
  useEffect(() => {
    pillIndex.value = withSpring(activeIndex, SPRING.snappy);
  }, [activeIndex]);

  // The bar slides up when visible and down when hidden (login, game, chat, profile)
  useEffect(() => {
    if (!visible) setMenuOpen(false);
    enter.value = withSpring(visible ? 1 : 0, SPRING.soft);
  }, [visible]);

  // Account menu open/close
  useEffect(() => {
    menu.value = withSpring(menuOpen ? 1 : 0, SPRING.soft);
  }, [menuOpen]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillIndex.value * itemWidth }],
  }));

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(enter.value, [0, 1], [120, 0]) }],
  }));

  const menuStyle = useAnimatedStyle(() => ({
    opacity: interpolate(menu.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(menu.value, [0, 1], [18, 0]) },
      { scale: interpolate(menu.value, [0, 1], [0.85, 1]) },
    ],
  }));

  function goTo(routeName) {
    vibrate(15);
    setMenuOpen(false);
    onNavigate(routeName);
  }

  function toggleMenu() {
    vibrate(15);
    setMenuOpen(!menuOpen);
  }

  if (!fontsLoaded) return null;

  return (
    <>
      {/* Closes the menu when tapping outside */}
      {menuOpen && <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />}

      {/* Account menu */}
      <Animated.View
        pointerEvents={menuOpen ? 'auto' : 'none'}
        style={[styles.menuWrapper, menuStyle]}
      >
        <View style={styles.menu}>
          <PressableScale style={styles.menuItem} onPress={() => goTo('Profile')} scale={0.96}>
            <Ionicons name="person-outline" size={20} color={WHITE} />
            <Text style={styles.menuText}>Perfil</Text>
          </PressableScale>
          <PressableScale style={styles.menuItem} onPress={() => goTo('Ranking')} scale={0.96}>
            <Ionicons name="trophy-outline" size={20} color={WHITE} />
            <Text style={styles.menuText}>Ranking</Text>
          </PressableScale>
          <PressableScale style={styles.menuItem} onPress={() => goTo('Settings')} scale={0.96}>
            <Ionicons name="settings-outline" size={20} color={WHITE} />
            <Text style={styles.menuText}>Ajustes</Text>
          </PressableScale>
          <PressableScale style={styles.menuItem} onPress={() => goTo('About')} scale={0.96}>
            <Ionicons name="information-circle-outline" size={20} color={WHITE} />
            <Text style={styles.menuText}>Sobre</Text>
          </PressableScale>
          <View style={styles.menuDivider} />
          <PressableScale
            style={styles.menuItem}
            onPress={() => {
              setMenuOpen(false);
              onSignOut();
            }}
            scale={0.96}
          >
            <Ionicons name="log-out-outline" size={20} color={ERROR} />
            <Text style={[styles.menuText, { color: ERROR }]}>Sair</Text>
          </PressableScale>
        </View>
      </Animated.View>

      {/* Fixed bar */}
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[styles.bar, barStyle]}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View
          style={[
            styles.pill,
            { left: BAR_PADDING + (itemWidth - PILL_WIDTH) / 2 },
            pillStyle,
          ]}
        />
        <TabItem
          icon="game-controller-outline"
          activeIcon="game-controller"
          label="Jogos"
          active={!menuOpen && currentRoute === 'Home'}
          onPress={() => goTo('Home')}
        />
        <TabItem
          icon="people-outline"
          activeIcon="people"
          label="Amigos"
          active={!menuOpen && currentRoute === 'Friends'}
          onPress={() => goTo('Friends')}
        />
        <TabItem
          icon="albums-outline"
          activeIcon="albums"
          label="Salas"
          active={!menuOpen && currentRoute === 'Rooms'}
          onPress={() => goTo('Rooms')}
        />
        <TabItem
          icon="person-circle-outline"
          activeIcon="person-circle"
          label="Conta"
          active={accountActive}
          onPress={toggleMenu}
        />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: Platform.OS === 'ios' ? 28 : 16,
    flexDirection: 'row',
    backgroundColor: 'rgba(36,29,60,0.98)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 10,
    paddingHorizontal: BAR_PADDING,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  pill: {
    position: 'absolute',
    top: 10,
    width: PILL_WIDTH,
    height: 34,
    borderRadius: 17,
    backgroundColor: BUTTON_PURPLE,
    shadowColor: ACCENT,
    shadowOpacity: 0.7,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabIcon: {
    width: PILL_WIDTH,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 13 },
  tabLabelActive: { color: WHITE, fontFamily: FONT_BOLD },

  menuWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 112 : 100,
    right: 20,
    width: 210,
  },
  menu: {
    backgroundColor: SURFACE_LIGHT,
    borderRadius: 20,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuText: { fontFamily: FONT_SEMI, color: WHITE, fontSize: 17 },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 4,
    marginHorizontal: 14,
  },
});