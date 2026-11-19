import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { addSave, getSaveState } from '../services/saves';
import { buildHtml, SAVE_JS, buildLoadJs } from '../services/emulator';
import { useLandscape } from '../hooks/useLandscape';
import { showAlert } from '../components/AppModal';
import { WHITE, ERROR } from '../constants/palette';

// Cores usadas só nesta tela
const BLACK = '#000';
const HEADER_BG = '#3A2F55';
const LOADING_BG = '#1E1830';
const LOADING_TEXT = '#B8B0C8';

export default function GameScreen({ navigation, route }) {
  useLandscape();

  const game = route?.params?.game || null;
  const saveId = route?.params?.saveId || null;
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const [loading, setLoading] = useState(true);
  const webRef = useRef(null);
  const slotRef = useRef(1);
  const sessionIdRef = useRef(null);

  // Ranking: começa a contar o tempo de jogo
  async function startSession() {
    if (sessionIdRef.current || !game) return;
    const gameId = Number(game.id);
    if (!gameId) return;
    try {
      const res = await api.post('/sessions/start', { gameId });
      sessionIdRef.current = res.data.data.session.id;
    } catch (e) {}
  }

  // Ranking: para de contar o tempo (sem login ou erro, ignora)
  async function endSession() {
    const id = sessionIdRef.current;
    if (!id) return;
    sessionIdRef.current = null;
    try {
      await api.patch('/sessions/' + id + '/end');
    } catch (e) {}
  }

  // Ao sair da tela do jogo, encerra a sessão
  useEffect(() => {
    return () => {
      endSession();
    };
  }, []);

  // Web: listen for the message coming from inside the iframe
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    function onMessage(event) {
      if (event.data === 'ejs-game-started') {
        setLoading(false);
        startSession();
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Safety net: if the message never arrives, hide the loading screen after 25s
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 25000);
    return () => clearTimeout(timer);
  }, []);

  function goBack() {
    endSession();
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  }

  function requestSave(slot) {
    slotRef.current = slot;
    if (webRef.current) webRef.current.injectJavaScript(SAVE_JS);
  }

  function saveGame() {
    if (Platform.OS === 'web') {
      showAlert('Indisponível', 'Salvar só funciona no app do celular.');
      return;
    }
    Alert.alert(
      'Salvar na nuvem',
      'Escolha o slot (um save antigo no mesmo slot será substituído).',
      [
        { text: 'Slot 1', onPress: () => requestSave(1) },
        { text: 'Slot 2', onPress: () => requestSave(2) },
        { text: 'Slot 3', onPress: () => requestSave(3) },
      ],
      { cancelable: true }
    );
  }

  async function loadSaveIntoGame() {
    try {
      const b64 = await getSaveState(saveId);
      if (!b64) {
        showAlert('Erro', 'Save não encontrado na nuvem.');
        return;
      }
      if (webRef.current) webRef.current.injectJavaScript(buildLoadJs(b64));
    } catch (e) {
      showAlert('Erro', 'Não foi possível carregar o save.');
    }
  }

  function handleMessage(data) {
    if (typeof data !== 'string') return;
    if (data === 'ejs-game-started') {
      setLoading(false);
      startSession();
      // small delay so the emulator is ready before loading the state
      if (saveId) setTimeout(loadSaveIntoGame, 1500);
    } else if (data.startsWith('ejs-state:')) {
      const slot = slotRef.current;
      addSave(game, data.slice('ejs-state:'.length), slot)
        .then(() => showAlert('Save criado', 'Slot ' + slot + ' salvo na nuvem. Veja na aba Saves.'))
        .catch((e) => {
          if (e && e.message === 'NO_LOGIN') {
            showAlert(
              'Sem conta',
              'Sem login não há save na nuvem. Entre com uma conta para salvar.'
            );
          } else {
            showAlert('Erro', 'Não foi possível guardar o save.');
          }
        });
    } else if (data.startsWith('ejs-error:')) {
      showAlert('Erro no emulador', data.slice('ejs-error:'.length));
    }
  }

  let content;

  if (!game || !game.fileUrl) {
    content = (
      <View style={styles.center}>
        <Text style={styles.message}>Arquivo do jogo não disponível.</Text>
      </View>
    );
  } else if (Platform.OS === 'web') {
    content = React.createElement('iframe', {
      srcDoc: buildHtml(game),
      title: game.title || 'Jogo',
      allow: 'autoplay; fullscreen; gamepad',
      allowFullScreen: true,
      style: { flex: 1, width: '100%', height: '100%', border: 'none', backgroundColor: BLACK },
    });
  } else {
    content = (
      <WebView
        ref={webRef}
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html: buildHtml(game), baseUrl: 'https://archv-rooms-service.onrender.com' }}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        onMessage={(e) => handleMessage(e.nativeEvent.data)}
      />
    );
  }

  const showLoading = loading && game && game.fileUrl;
  const canSave = game && game.fileUrl && Platform.OS !== 'web';

  return (
    <View style={styles.container}>
      <StatusBar hidden={landscape} />

      {/* Portrait: normal title bar */}
      {!landscape && (
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={26} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {game ? game.title : 'Jogo'}
          </Text>
          {canSave && (
            <TouchableOpacity onPress={saveGame} style={styles.saveButton}>
              <Ionicons name="save-outline" size={24} color={WHITE} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.area}>
        {content}

        {/* Loading screen on top of the emulator */}
        {showLoading && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={WHITE} />
            <Text style={styles.loadingTitle}>{game.title}</Text>
            <Text style={styles.loadingText}>Carregando jogo...</Text>
          </View>
        )}
      </View>

      {/* Landscape: full screen, only floating buttons */}
      {landscape && (
        <TouchableOpacity onPress={goBack} style={styles.floatingBack}>
          <Ionicons name="arrow-back" size={22} color={WHITE} />
        </TouchableOpacity>
      )}
      {landscape && canSave && (
        <TouchableOpacity onPress={saveGame} style={styles.floatingSave}>
          <Ionicons name="save-outline" size={22} color={WHITE} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLACK },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: HEADER_BG,
  },
  backButton: { marginRight: 12 },
  saveButton: { marginLeft: 12 },
  title: { flex: 1, color: WHITE, fontSize: 18, fontWeight: '600' },
  area: { flex: 1, backgroundColor: BLACK },
  webview: { flex: 1, backgroundColor: BLACK },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: LOADING_BG,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingTitle: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingText: { color: LOADING_TEXT, fontSize: 14, marginTop: 6 },
  floatingBack: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingSave: {
    position: 'absolute',
    top: 12,
    left: 60,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  message: { color: ERROR, fontSize: 16, textAlign: 'center' },
});