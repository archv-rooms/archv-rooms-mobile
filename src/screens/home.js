import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { TOKEN_KEY } from '../services/api';

const TABS = ['Recent', 'Games', 'Saves'];

// Cartões de exemplo, usados só se a API não responder
const EXEMPLOS = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
  id: 'exemplo-' + n,
  title: 'Game ' + n,
  exemplo: true,
}));

export default function HomeScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Recent');
  const [menuOpen, setMenuOpen] = useState(true);
  const [games, setGames] = useState(EXEMPLOS);
  const [erro, setErro] = useState('');

  const showCards = activeTab === 'Recent' || activeTab === 'Games';

  useEffect(() => {
    async function carregarJogos() {
      try {
        const res = await api.get('/games');
        const corpo = res.data;
        let lista = [];
        if (Array.isArray(corpo)) {
          lista = corpo;
        } else if (corpo && Array.isArray(corpo.data)) {
          lista = corpo.data;
        } else if (corpo && corpo.data && Array.isArray(corpo.data.games)) {
          lista = corpo.data.games;
        }
        if (lista.length > 0) {
          setGames(lista);
        }
        setErro('');
      } catch (e) {
        const msg =
          e && e.response && e.response.data && e.response.data.message
            ? e.response.data.message
            : 'Não foi possível carregar os jogos.';
        setErro(msg);
      }
    }
    carregarJogos();
  }, []);

  async function abrirJogo(jogo) {
    if (jogo.exemplo) {
      setErro('Este é um cartão de exemplo. Os jogos reais aparecem quando a API voltar.');
      return;
    }
    try {
      let completo = jogo;
      if (!jogo.fileUrl) {
        const res = await api.get('/games/' + jogo.id);
        completo = res.data && res.data.data ? res.data.data : jogo;
      }
      navigation.navigate('Game', { game: completo });
    } catch (e) {
      let msg = 'Não foi possível abrir o jogo.';
      if (e && e.response && e.response.status === 403) {
        msg = 'Seu plano não permite acesso a este jogo.';
      } else if (e && e.response && e.response.data && e.response.data.message) {
        msg = e.response.data.message;
      }
      setErro(msg);
    }
  }

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

        {erro !== '' && <Text style={styles.erro}>{erro}</Text>}

        {/* Conteúdo da aba */}
        {showCards ? (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {games.map((jogo) => (
              <TouchableOpacity
                key={String(jogo.id)}
                style={styles.card}
                onPress={() => abrirJogo(jogo)}
              >
                <Text style={styles.cardText} numberOfLines={2}>
                  {jogo.title}
                </Text>
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
  erro: {
    color: '#FF9AA8',
    fontSize: 13,
    marginTop: 12,
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
    paddingHorizontal: 8,
  },
  cardText: {
    color: '#D8D0E8',
    fontSize: 13,
    textAlign: 'center',
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