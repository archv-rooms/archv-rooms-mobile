import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

// Emulator core used for each console
const CORES = {
  NES: 'nes',
  SNES: 'snes9x',
  SFC: 'snes9x',
  GBA: 'gba',
  GB: 'gambatte',
  GBC: 'gambatte',
  'GAME BOY': 'gambatte',
  N64: 'n64',
  PS1: 'pcsx_rearmed',
  PSX: 'pcsx_rearmed',
  MD: 'genesis_plus_gx',
  'MEGA DRIVE': 'genesis_plus_gx',
};

function getCore(consoleName) {
  return CORES[(consoleName || '').toUpperCase()] || 'nes';
}

function buildHtml(game) {
  const core = JSON.stringify(getCore(game.console));
  const url = JSON.stringify(game.fileUrl || '').replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
  #game-container { width: 100%; height: 100%; }
</style>
</head>
<body>
<div id="game-container"></div>
<script>
  window.EJS_player = '#game-container';
  window.EJS_core = ${core};
  window.EJS_gameUrl = ${url};
  window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
  window.EJS_startOnLoaded = true;
  // Tells the app when the game has really started
  window.EJS_onGameStart = function () {
    var msg = 'ejs-game-started';
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(msg);
    } else {
      window.parent.postMessage(msg, '*');
    }
  };
</script>
<script src="https://cdn.emulatorjs.org/stable/data/loader.js"></script>
</body>
</html>`;
}

export default function GameScreen({ navigation, route }) {
  const game = route?.params?.game || null;
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const [loading, setLoading] = useState(true);

  // Web: listen for the message coming from inside the iframe
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    function onMessage(event) {
      if (event.data === 'ejs-game-started') setLoading(false);
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
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
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
      style: { flex: 1, width: '100%', height: '100%', border: 'none', backgroundColor: '#000' },
    });
  } else {
    content = (
      <WebView
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html: buildHtml(game), baseUrl: 'https://archv-rooms.onrender.com' }}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        onMessage={(e) => {
          if (e.nativeEvent.data === 'ejs-game-started') setLoading(false);
        }}
      />
    );
  }

  const showLoading = loading && game && game.fileUrl;

  return (
    <View style={styles.container}>
      <StatusBar hidden={landscape} />

      {/* Portrait: normal title bar */}
      {!landscape && (
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {game ? game.title : 'Jogo'}
          </Text>
        </View>
      )}

      <View style={styles.area}>
        {content}

        {/* Loading screen on top of the emulator */}
        {showLoading && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingTitle}>{game.title}</Text>
            <Text style={styles.loadingText}>Carregando jogo...</Text>
          </View>
        )}
      </View>

      {/* Landscape: full screen, only a floating back button */}
      {landscape && (
        <TouchableOpacity onPress={goBack} style={styles.floatingBack}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#3A2F55',
  },
  backButton: { marginRight: 12 },
  title: { flex: 1, color: '#fff', fontSize: 18, fontWeight: '600' },
  area: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1E1830',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingText: { color: '#B8B0C8', fontSize: 14, marginTop: 6 },
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  message: { color: '#FF9AA8', fontSize: 16, textAlign: 'center' },
});