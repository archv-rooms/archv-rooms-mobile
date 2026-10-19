import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../services/api';

const TABS = ['Recent', 'Games', 'Saves'];

// Cartões de exemplo (depois virão da API)
const GAMES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function HomeScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Recent');
  const [menuOpen, setMenuOpen] = useState(true);

  const showCards = activeTab === 'Recent' || activeTab === 'Games';

  async function handleExit() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      // se der erro ao apagar, seguimos para o login mesmo assim
    }
    navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
  }

  return (
    <LinearGradient colors={['#1E1830', '#3A2F55', '#5B4A7A']} style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Abas + botão do menu */}
        <View style={styles.header}>
          <View style={styles.tabs}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={styles.tabText}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)}>
            <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Conteúdo da aba */}
        {showCards ? (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {GAMES.map((n) => (
              <TouchableOpacity key={n} style={styles.card}>
                <Text style={styles.cardText}>Game {n}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No saves yet</Text>
          </View>
        )}

        {/* Menu */}
        {menuOpen && (
          <View style={styles.menuWrapper}>
            <View style={styles.menu}>
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuText}>Load Rooms</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuText}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuText}>www.archvrooms</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuText}>About archvrooms</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.menu, styles.exitBox]}
              onPress={handleExit}
            >
              <Text style={styles.menuText}>Exit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(75, 65, 99, 0.6)',
    borderBottomWidth: 2,
    borderBottomColor: '#5B4FD6',
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tabActive: {
    backgroundColor: '#6A5E85',
  },
  tabText: {
    color: '#fff',
    fontSize: 14,
  },
  list: {
    flex: 1,
    marginTop: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    width: 140,
    height: 64,
    backgroundColor: 'rgba(75, 65, 99, 0.7)',
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    color: '#D8D0E8',
    fontSize: 13,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#B8B0C8',
    fontSize: 14,
  },
  menuWrapper: {
    position: 'absolute',
    top: 100,
    right: 24,
    width: 190,
  },
  menu: {
    backgroundColor: 'rgba(75, 65, 99, 0.95)',
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  menuText: {
    color: '#fff',
    fontSize: 13,
  },
  exitBox: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
});