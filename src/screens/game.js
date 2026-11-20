import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Alert,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import Reanimated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { useFonts } from 'expo-font';
import api, { TOKEN_KEY } from '../services/api';
import { addSave, getSaveState } from '../services/saves';
import { buildHtml, SAVE_JS, buildLoadJs } from '../services/emulator';
import { getAccent } from '../services/roomHelpers';
import { useLandscape } from '../hooks/useLandscape';
import { showAlert } from '../components/AppModal';
import Cover from '../components/Cover';
import {
  FONT_SEMI,
  FONT_BOLD,
  BG_TOP,
  BG_BOTTOM,
  SURFACE,
  ACCENT,
  WHITE,
  TEXT_MUTED,
  ERROR,
} from '../constants/palette';

const BLACK = '#000';
const BAR_TRACK = 160;
const BAR_SIZE = 56;

// Barrinha que desliza enquanto o jogo carrega
function LoadingBar() {
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(slide, {
        toValue: 1,
        duration: 1300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [-BAR_SIZE, BAR_TRACK],
  });

  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, { transform: [{ translateX }] }]} />
    </View>
  );
}

export default function GameScreen({ navigation, route }) {
  useLandscape();

  const [fontsLoaded] = useFonts({ Rajdhani_600SemiBold, Rajdhani_700Bold });
  const game = route?.params?.game || null;
  const saveId = route?.params?.saveId || null;
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const [loading, setLoading] = useState(true);
  // null = ainda checando o login; true = com conta (Netplay ligado); false = convidado (sem Netplay)
  const [online, setOnline] = useState(null);
  const webRef = useRef(null);
  const slotRef = useRef(1);
  const sessionIdRef = useRef(null);

  // Verifica se há login antes de montar o emulador
  useEffect(() => {
    let active = true;
    (async () => {
      let token = null;
      try {
        token = await AsyncStorage.getItem(TOKEN_KEY);
      } catch (e) {}
      if (active) setOnline(!!token);
    })();
    return () => {
      active = false;
    };
  }, []);

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

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: BLACK }} />;

  let content = null;

  if (!game || !game.fileUrl) {
    content = (
      <View style={styles.center}>
        <Text style={styles.message}>Arquivo do jogo não disponível.</Text>
      </View>
    );
  } else if (online === null) {
    // Ainda checando o login: a tela de carregando fica por cima
    content = null;
  } else if (Platform.OS === 'web') {
    content = React.createElement('iframe', {
      srcDoc: buildHtml(game, online),
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
        source={{ html: buildHtml(game, online), baseUrl: 'https://archv-rooms-service.onrender.com' }}
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
  const accent = getAccent(game ? game.title : '');
  const coverSize = landscape ? 84 : 120;

  return (
    <View style={styles.container}>
      <StatusBar hidden={landscape} />

      {/* Portrait: barra de cima */}
      {!landscape && (
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.roundButton}>
            <Ionicons name="arrow-back" size={22} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {game ? game.title : 'Jogo'}
          </Text>
          {canSave && (
            <TouchableOpacity onPress={saveGame} style={styles.roundButton}>
              <Ionicons name="save-outline" size={21} color={WHITE} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.area}>
        {content}

        {/* Tela de carregando por cima do emulador */}
        {showLoading && (
          <Reanimated.View
            exiting={FadeOut.duration(350)}
            style={StyleSheet.absoluteFill}
          >
            <LinearGradient colors={[BG_TOP, BG_BOTTOM]} style={styles.loading}>
              <Reanimated.View entering={FadeIn.duration(400)} style={styles.loadingInner}>
                <View
                  style={[
                    styles.coverBox,
                    { width: coverSize, height: coverSize, borderColor: accent + '66' },
                  ]}
                >
                  <Cover
                    uri={game.image}
                    accent={accent}
                    iconSize={coverSize * 0.45}
                    style={StyleSheet.absoluteFill}
                  />
                </View>
                <Text style={styles.loadingTitle} numberOfLines={2}>{game.title}</Text>
                <Text style={styles.loadingText}>Carregando jogo...</Text>
                <LoadingBar />
              </Reanimated.View>
            </LinearGradient>
          </Reanimated.View>
        )}
      </View>

      {/* Landscape: tela cheia, só os botões flutuantes */}
      {landscape && (
        <TouchableOpacity onPress={goBack} style={styles.floatingBack}>
          <Ionicons name="arrow-back" size={22} color={WHITE} />
        </TouchableOpacity>
      )}
      {landscape && canSave && (
        <TouchableOpacity onPress={saveGame} style={styles.floatingSave}>
          <Ionicons name="save-outline" size={21} color={WHITE} />
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
    gap: 12,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: BG_TOP,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontFamily: FONT_BOLD, color: WHITE, fontSize: 22, letterSpacing: 0.3 },

  area: { flex: 1, backgroundColor: BLACK },
  webview: { flex: 1, backgroundColor: BLACK },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingInner: { alignItems: 'center', maxWidth: 320 },
  coverBox: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: SURFACE,
  },
  loadingTitle: {
    fontFamily: FONT_BOLD,
    color: WHITE,
    fontSize: 26,
    marginTop: 18,
    textAlign: 'center',
  },
  loadingText: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 15, marginTop: 4 },
  barTrack: {
    width: BAR_TRACK,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    marginTop: 18,
  },
  barFill: {
    width: BAR_SIZE,
    height: 4,
    borderRadius: 2,
    backgroundColor: ACCENT,
  },

  floatingBack: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(20,17,31,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
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
    backgroundColor: 'rgba(20,17,31,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  message: { fontFamily: FONT_SEMI, color: ERROR, fontSize: 16, textAlign: 'center' },
});