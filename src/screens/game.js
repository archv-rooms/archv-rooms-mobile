import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

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

function montarHtml(game) {
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
</script>
<script src="https://cdn.emulatorjs.org/stable/data/loader.js"></script>
</body>
</html>`;
}

export default function GameScreen({ navigation, route }) {
  const game = (route && route.params && route.params.game) || null;

  function voltar() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  }

  let conteudo;

  if (!game || !game.fileUrl) {
    conteudo = (
      <View style={styles.centro}>
        <Text style={styles.mensagem}>Arquivo do jogo não disponível.</Text>
      </View>
    );
  } else if (Platform.OS === 'web') {
    conteudo = React.createElement('iframe', {
      srcDoc: montarHtml(game),
      title: game.title || 'Jogo',
      allow: 'autoplay; fullscreen; gamepad',
      style: { flex: 1, width: '100%', height: '100%', border: 'none', backgroundColor: '#000' },
    });
  } else {
    conteudo = (
      <WebView
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html: montarHtml(game), baseUrl: 'https://archv-rooms.onrender.com' }}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={voltar} style={styles.botaoVoltar}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.titulo} numberOfLines={1}>
          {game ? game.title : 'Jogo'}
        </Text>
      </View>
      <View style={styles.area}>{conteudo}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1830',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#3A2F55',
  },
  botaoVoltar: {
    marginRight: 12,
  },
  titulo: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  area: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  mensagem: {
    color: '#FF9AA8',
    fontSize: 16,
    textAlign: 'center',
  },
});