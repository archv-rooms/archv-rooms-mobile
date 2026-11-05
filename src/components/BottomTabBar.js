import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { useFonts } from 'expo-font';

const NATIVE = Platform.OS !== 'web';
const FONT_SEMI = 'Rajdhani_600SemiBold';
const FONT_BOLD = 'Rajdhani_700Bold';

const SURFACE_LIGHT = '#3A3058';
const ACCENT = '#8E7CF0';
const BUTTON_PURPLE = '#6A5BD6';
const WHITE = '#FFFFFF';
const TEXT_MUTED = '#B4AACB';
const ERROR = '#FF9AA8';

const PILL_WIDTH = 56;
const BAR_PADDING = 8;

// Screens where the bar is visible, and the tab index of each one
const TAB_INDEX = { Home: 0, Friends: 1, Rooms: 2, Settings: 3, About: 3 };

// Button that shrinks when pressed and springs back
function PressableScale({ onPress, wrapStyle, style, children, scale = 0.93 }) {
  const value = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(value, { toValue: scale, useNativeDriver: NATIVE, speed: 50, bounciness: 0 }).start();
  }

  function pressOut() {
    Animated.spring(value, { toValue: 1, useNativeDriver: NATIVE, speed: 18, bounciness: 14 }).start();
  }

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={wrapStyle}>
      <Animated.View style={[style, { transform: [{ scale: value }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

function TabItem({ icon, activeIcon, label, active, onPress }) {
  const value = useRef(new Animated.Value(1)).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (active) {
      value.setValue(0.7);
      Animated.spring(value, { toValue: 1, useNativeDriver: NATIVE, speed: 14, bounciness: 18 }).start();
    }
  }, [active]);

  return (
    <PressableScale onPress={onPress} wrapStyle={{ flex: 1 }} style={styles.tabItem} scale={0.88}>
      <Animated.View style={[styles.tabIcon, { transform: [{ scale: value }] }]}>
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
  const accountActive = menuOpen || currentRoute === 'Settings' || currentRoute === 'About';

  const pillAnim = useRef(new Animated.Value(0)).current;
  const enterAnim = useRef(new Animated.Value(0)).current;
  const menuAnim = useRef(new Animated.Value(0)).current;

  // The purple pill slides to the active tab
  useEffect(() => {
    Animated.spring(pillAnim, {
      toValue: activeIndex,
      useNativeDriver: NATIVE,
      tension: 140,
      friction: 14,
    }).start();
  }, [activeIndex]);

  // The bar slides up when visible and down when hidden (login, game, chat)
  useEffect(() => {
    if (!visible) setMenuOpen(false);
    Animated.spring(enterAnim, {
      toValue: visible ? 1 : 0,
      useNativeDriver: NATIVE,
      tension: 60,
      friction: 10,
    }).start();
  }, [visible]);

  // Account menu open/close
  useEffect(() => {
    Animated.spring(menuAnim, {
      toValue: menuOpen ? 1 : 0,
      useNativeDriver: NATIVE,
      tension: 120,
      friction: 11,
    }).start();
  }, [menuOpen]);

  function goTo(routeName) {
    setMenuOpen(false);
    onNavigate(routeName);
  }

  if (!fontsLoaded) return null;

  const itemWidth = barWidth > 0 ? (barWidth - BAR_PADDING * 2) / 4 : 0;
  const pillTranslate = pillAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0, itemWidth, itemWidth * 2, itemWidth * 3],
  });
  const barY = enterAnim.interpolate({ inputRange: [0, 1], outputRange: [120, 0] });

  const menuOpacity = menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const menuY = menuAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  const menuScale = menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  return (
    <>
      {/* Closes the menu when tapping outside */}
      {menuOpen && <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />}

      {/* Account menu */}
      <Animated.View
        pointerEvents={menuOpen ? 'auto' : 'none'}
        style={[
          styles.menuWrapper,
          { opacity: menuOpacity, transform: [{ translateY: menuY }, { scale: menuScale }] },
        ]}
      >
        <View style={styles.menu}>
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
        style={[styles.bar, { transform: [{ translateY: barY }] }]}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View
          style={[
            styles.pill,
            {
              left: BAR_PADDING + (itemWidth - PILL_WIDTH) / 2,
              transform: [{ translateX: pillTranslate }],
            },
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
          onPress={() => setMenuOpen(!menuOpen)}
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