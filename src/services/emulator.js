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

const NETPLAY_URL = 'https://archv-netplay-new.onrender.com';

export function getCore(consoleName) {
  return CORES[(consoleName || '').toUpperCase()] || 'nes';
}

// online = true: Netplay ligado (usuário com conta)
// online = false: Netplay desligado (convidado, sem login)
export function buildHtml(game, online = true) {
  const core = JSON.stringify(getCore(game.console));
  const url = JSON.stringify(game.fileUrl || '').replace(/</g, '\\u003c');
  const gameId = Number(game.id) || 1;

  const netplay = online
    ? `
  window.EJS_EXPERIMENTAL_NETPLAY = true;

  // Netplay (jogo online)
  window.EJS_gameID = ${gameId};
  window.EJS_netplayServer = '${NETPLAY_URL}';
  window.EJS_netplayUrl = '${NETPLAY_URL}';
  window.EJS_oldCores = true;
  window.EJS_netplayICEServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' }
  ];
`
    : '';

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
  window.EJS_pathtodata = 'https://cdn.emulatorjs.org/latest/data/';
  window.EJS_startOnLoaded = true;
  window.EJS_DEBUG_XX = true;
${netplay}
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
<script src="https://cdn.emulatorjs.org/latest/data/loader.js"></script>
</body>
</html>`;
}

// Reads the emulator state and sends it to the app as base64
export const SAVE_JS = `
(function () {
  try {
    var state = window.EJS_emulator.gameManager.getState();
    var bin = '';
    var chunk = 0x8000;
    for (var i = 0; i < state.length; i += chunk) {
      bin += String.fromCharCode.apply(null, state.subarray(i, i + chunk));
    }
    window.ReactNativeWebView.postMessage('ejs-state:' + btoa(bin));
  } catch (e) {
    window.ReactNativeWebView.postMessage('ejs-error:' + e.message);
  }
})();
true;
`;

// Loads a base64 state back into the emulator
export function buildLoadJs(b64) {
  return `
(function () {
  try {
    var bin = atob(${JSON.stringify(b64)});
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    window.EJS_emulator.gameManager.loadState(arr);
  } catch (e) {
    window.ReactNativeWebView.postMessage('ejs-error:' + e.message);
  }
})();
true;
`;
}