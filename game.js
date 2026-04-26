// Platanus Hack 26 — Buenos Aires Edition
// Drive-Thru Rush: Burgertronic vs Tacosaurus

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const DEBUG_GRID = true; // cambiar a false antes de entregar
const STORAGE_KEY = 'hot-deploy-highscores';
const MAX_HIGH_SCORES = 10;
const WINNING_NAME_LENGTH = 3;
const MATCH_TIME_LIMIT_MS = 120000; // 2 minutes

const COLORS = {
  frame: 0x3a3a0a,
  white: 0xf7ffd8,
  burgertronic: 0xffcc00,
  tacosaurus: 0xff3b3b,
  itemBurger: 0x8b4513,
  itemFries: 0xffd84d,
  itemDrink: 0x3ba3ff,
  itemIceCream: 0xff9ec7,
  itemTaco: 0xf7c948,
  itemBurrito: 0x7a4a1e,
  itemNachos: 0xffaa00,
  lifeActive: 0xff6ec7,
  scoreText: 0xe1ff00,
  carBody: 0x5a6c8c,
  road: 0x1a1e05,
  overlay: 0x0c0e02,
};

const CABINET_KEYS = {
  P1_U: ['w'], P1_D: ['s'], P1_L: ['a'], P1_R: ['d'],
  P1_1: ['u'], P1_2: ['i'], P1_3: ['o'], P1_4: ['j'], P1_5: ['k'], P1_6: ['l'],
  P2_U: ['ArrowUp'], P2_D: ['ArrowDown'], P2_L: ['ArrowLeft'], P2_R: ['ArrowRight'],
  P2_1: ['r'], P2_2: ['t'], P2_3: ['y'], P2_4: ['f'], P2_5: ['g'], P2_6: ['h'],
  START1: ['Enter'], START2: ['2'],
};

const KEYBOARD_TO_ARCADE = {};
for (const [arcadeCode, keys] of Object.entries(CABINET_KEYS)) {
  for (const key of keys) {
    KEYBOARD_TO_ARCADE[key.toLowerCase()] = arcadeCode;
    if (key.length > 1) {
      KEYBOARD_TO_ARCADE[key] = arcadeCode;
    }
  }
}

const LETTER_GRID = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  ['H', 'I', 'J', 'K', 'L', 'M', 'N'],
  ['O', 'P', 'Q', 'R', 'S', 'T', 'U'],
  ['V', 'W', 'X', 'Y', 'Z', '.', '-'],
  ['DEL', 'END'],
];

// ═══════════════════════════════════════════════════
// GRILLA MAESTRA — layout del juego en píxeles
// Pantalla: 800 x 600 px
// Las zonas van de izquierda a derecha en modo 1P
// ═══════════════════════════════════════════════════

// Anchos de cada zona
const ZONE_COLA_W = 80;   // cola visual de pedidos (autos)
const ZONE_VENT_W = 60;   // ventanilla donde bajan los autos
const ZONE_COCINA_W = 340;  // zona donde se mueve el chef
const ZONE_MOSTRADOR_W = 60;   // zona donde esperan clientes peatones
const ZONE_TIENDA_W = 80;   // cola visual de clientes (pedidos pendientes)

// Posiciones X donde empieza cada zona
const X_COLA = 0;
const X_VENT = X_COLA + ZONE_COLA_W;       // 80
const X_COCINA = X_VENT + ZONE_VENT_W;        // 140
const X_MOSTRADOR = X_COCINA + ZONE_COCINA_W;      // 480
const X_TIENDA = X_MOSTRADOR + ZONE_MOSTRADOR_W;   // 540

// Centros útiles de cada zona (para posicionar objetos)
const CX_COLA = X_COLA + ZONE_COLA_W / 2; // 40
const CX_VENT = X_VENT + ZONE_VENT_W / 2; // 110  ← columna única de autos
const CX_COCINA = X_COCINA + ZONE_COCINA_W / 2; // 310  ← centro de la cocina
const CX_MOSTRADOR = X_MOSTRADOR + ZONE_MOSTRADOR_W / 2; // 510
const CX_TIENDA = X_TIENDA + ZONE_TIENDA_W / 2; // 580

// Límites del chef en X (puede asomarse a ambos lados)
const CHEF_X_MIN = X_COCINA + 20;       // 160 — no puede entrar a la ventanilla
const CHEF_X_MAX = X_MOSTRADOR - 20;    // 460 — no puede entrar al mostrador

// Sistema de autos — columna única vertical
const CAR_X = CX_VENT;    // 110 — x fija del auto, siempre la misma
const CAR_Y_START = -60;        // aparece arriba, fuera de pantalla
const CAR_Y_END = GAME_HEIGHT + 60; // se escapa por abajo
const CAR_WAIT_Y = 500; // y donde el auto se detiene a esperar

// Zona donde el chef puede entregar al auto (debe estar cerca de la ventanilla)
const SERVE_AUTO_X_MAX = X_COCINA - 5;    // 135 — chef debe estar a x <= 135
// Zona donde el chef puede atender clientes (debe estar cerca del mostrador)
const SERVE_CLIENT_X_MIN = X_MOSTRADOR - 5; // 475 — chef debe estar a x >= 475

// ═══════════════════════════════════════════════════
// BALANCE DE DIFICULTAD — modificar estos valores al testear
// ═══════════════════════════════════════════════════

const DIFF_CAR_SPEED_START = 35;    // px/s al inicio
const DIFF_CAR_SPEED_END = 115;   // px/s al máximo
const DIFF_CAR_SPAWN_START = 10000; // ms entre autos al inicio (10s)
const DIFF_CAR_SPAWN_END = 2500;  // ms entre autos al máximo (2.5s)
const DIFF_CLIENT_WAIT_START = 8000; // ms que espera un cliente al inicio
const DIFF_CLIENT_WAIT_END = 3000;  // ms que espera un cliente al máximo
const DIFF_CLIENT_SPAWN_START = 15000; // ms entre clientes al inicio
const DIFF_CLIENT_SPAWN_END = 4500;  // ms entre clientes al máximo
const DIFF_RAMP_TIME = 150000;// ms para llegar al tope (2.5 min)
const FAIL_RELIEF_MS = 8000;  // ms de respiro tras fallar
const FAIL_RELIEF_FACTOR = 1.3;   // el spawn se abre 30% durante el respiro

// Escalones del combo — cuántas entregas correctas para subir de nivel
// índice 0 = para pasar de x1 a x2, índice 1 = de x2 a x3, etc.
const COMBO_THRESHOLDS = [3, 5, 8, 12, 17, 23, 30];

// Multiplicadores de velocidad del chef por nivel de combo
// índice 0 = combo x1 (base), índice 7 = combo x8 (máximo)
const COMBO_SPEEDS = [1.0, 1.25, 1.45, 1.60, 1.72, 1.82, 1.90, 1.96];

// ═══════════════════════════════════════════════════
// REFERENCIA MODO 2P — NO implementar ahora, solo referencia
// La pantalla se divide verticalmente en x=400
// P1: restaurante completo en x=0 a x=400
// P2: restaurante espejado en x=400 a x=800
//   X_VENT_P2      = 800 - X_VENT - ZONE_VENT_W = 660
//   CAR_X_P2       = 800 - CX_VENT = 690
//   CHEF_X_MIN_P2  = 400 + (800 - CHEF_X_MAX) = 265 (espejado)
//   CHEF_X_MAX_P2  = 800 - CHEF_X_MIN = 715 (espejado)
// ═══════════════════════════════════════════════════

// getDifficulty — usa las constantes de balance de arriba
function getDifficulty(elapsed) {
  const t = Math.min(elapsed / DIFF_RAMP_TIME, 1);
  return {
    carSpeed: DIFF_CAR_SPEED_START + t * (DIFF_CAR_SPEED_END - DIFF_CAR_SPEED_START),
    carSpawnInterval: DIFF_CAR_SPAWN_START - t * (DIFF_CAR_SPAWN_START - DIFF_CAR_SPAWN_END),
    clientWait: DIFF_CLIENT_WAIT_START - t * (DIFF_CLIENT_WAIT_START - DIFF_CLIENT_WAIT_END),
    clientSpawnInterval: DIFF_CLIENT_SPAWN_START - t * (DIFF_CLIENT_SPAWN_START - DIFF_CLIENT_SPAWN_END),
  };
}

// getComboSpeed — devuelve el multiplicador de velocidad para el combo actual
function getComboSpeed(comboMult) {
  const idx = Math.min(comboMult - 1, COMBO_SPEEDS.length - 1);
  return COMBO_SPEEDS[idx];
}

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-root',
  backgroundColor: '#0b0f03',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  scene: { preload, create, update }
};

new Phaser.Game(config);

function preload() { }

function create() {
  const scene = this;

  scene.state = {
    phase: 'loading',
    highScores: [],
    mode: '1P',
    menu: { cursor: 0 },
    playing: { timeElapsed: 0 },
    p1: { score: 0, comboStreak: 0, comboMult: 1, lives: 3, x: 400, y: 300, dir: 'down', body: null, ind: null },
    p2: { score: 0, comboStreak: 0, comboMult: 1, lives: 3, x: 400, y: 450, dir: 'down', body: null, ind: null },
    nameEntry: { letters: [], row: 0, col: 0, moveCooldownUntil: 0, winner: '' }
  };

  createBackground(scene);
  createHud(scene);
  createGameObjects(scene);
  createStartScreen(scene);
  createEndGameUi(scene);
  createControls(scene);

  showStartScreen(scene);
  drawDebugGrid(scene);

  loadHighScores().then(scores => {
    scene.state.highScores = scores;
  }).catch(() => {
    scene.state.highScores = [];
  });
}

function update(time, delta) {
  const scene = this;
  const phase = scene.state.phase;

  if (phase === 'start') {
    handleStartMenu(scene, time);
    return;
  }

  if (phase === 'playing') {
    updatePlaying(scene, time, delta);
  }

  if (phase === 'gameover') {
    handleNameEntry(scene, time);
  }
}

function createControls(scene) {
  scene.controls = { held: Object.create(null), pressed: Object.create(null) };
  const onKeyDown = (event) => {
    let key = event.key;
    if (key.length === 1 && key !== ' ') key = key.toLowerCase();
    const arcadeCode = KEYBOARD_TO_ARCADE[key];
    if (arcadeCode) {
      if (!scene.controls.held[arcadeCode]) scene.controls.pressed[arcadeCode] = true;
      scene.controls.held[arcadeCode] = true;
    }
  };
  const onKeyUp = (event) => {
    let key = event.key;
    if (key.length === 1 && key !== ' ') key = key.toLowerCase();
    const arcadeCode = KEYBOARD_TO_ARCADE[key];
    if (arcadeCode) scene.controls.held[arcadeCode] = false;
  };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
}

function consumePressed(scene, code) {
  if (scene.controls.pressed[code]) {
    scene.controls.pressed[code] = false;
    return true;
  }
  return false;
}

function createBackground(scene) {
  scene.bgElements = scene.add.group();

  // Zona cola de autos (izquierda)
  scene.bgElements.add(scene.add.rectangle(
    CX_COLA, GAME_HEIGHT / 2, ZONE_COLA_W, GAME_HEIGHT, 0x111111));

  // Zona ventanilla (columna de autos)
  scene.bgElements.add(scene.add.rectangle(
    CX_VENT, GAME_HEIGHT / 2, ZONE_VENT_W, GAME_HEIGHT, 0x1a1e05));

  // Zona cocina (donde se mueve el chef)
  scene.bgElements.add(scene.add.rectangle(
    CX_COCINA, GAME_HEIGHT / 2, ZONE_COCINA_W, GAME_HEIGHT, 0x222222));

  // Zona mostrador (donde esperan clientes)
  scene.bgElements.add(scene.add.rectangle(
    CX_MOSTRADOR, GAME_HEIGHT / 2, ZONE_MOSTRADOR_W, GAME_HEIGHT, 0x1a1e05));

  // Zona cola de clientes (derecha)
  scene.bgElements.add(scene.add.rectangle(
    CX_TIENDA, GAME_HEIGHT / 2, ZONE_TIENDA_W, GAME_HEIGHT, 0x111111));

  // Borde decorativo alrededor de todo
  scene.bgElements.add(scene.add.rectangle(
    GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0
  ).setStrokeStyle(4, COLORS.frame, 0.8));

  // Divisor modo 2P (oculto por defecto)
  scene.divider = scene.add.rectangle(
    GAME_WIDTH / 2, GAME_HEIGHT / 2, 4, GAME_HEIGHT, COLORS.frame
  ).setVisible(false);
}

function updateBackgroundForMode(scene) {
  scene.divider.setVisible(scene.state.mode === '2P');
}

function S(sz, col, bold, extra) {
  const o = { fontFamily: 'monospace', fontSize: sz + 'px', color: col };
  if (bold) o.fontStyle = 'bold';
  return extra ? Object.assign(o, extra) : o;
}

function createHud(scene) {
  scene.hud = {};
  scene.hud.p1ScoreTitle = scene.add.text(40, 20, 'FORK BURGER', S(20, '#ffcc00', 1));
  scene.hud.p1ScoreValue = scene.add.text(40, 50, 'SCORE: 0', S(20, '#e1ff00'));
  scene.hud.p1Lives = scene.add.text(GAME_WIDTH - 150, 40, 'LIVES: 3', S(20, '#ff6ec7', 1));
  scene.hud.timeCombo = scene.add.text(40, GAME_HEIGHT - 40, 'TIME 00:00   COMBO x1', S(18, '#f7ffd8'));
  scene.hud.p2ScoreTitle = scene.add.text(40, GAME_HEIGHT - 60, 'TACO STACK', S(20, '#ff3b3b', 1));
  scene.hud.p2ScoreValue = scene.add.text(40, GAME_HEIGHT - 30, 'SCORE: 0', S(20, '#ff3b3b'));
  scene.hud.p2Lives = scene.add.text(GAME_WIDTH - 150, GAME_HEIGHT - 40, 'LIVES: 3', S(20, '#ff6ec7', 1));
  scene.hud.controlsHint = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 4, '[U1] RECOGER  [U2] BOTAR  [U3] ENTREGAR (ir a ventanilla izq)', S(14, '#999988')).setOrigin(0.5, 1);
}

function refreshHud(scene) {
  scene.hud.p1ScoreValue.setText('SCORE: ' + scene.state.p1.score);
  scene.hud.p1Lives.setText('LIVES: ' + scene.state.p1.lives);

  if (scene.state.mode === '2P') {
    scene.hud.timeCombo.setVisible(false);
    scene.hud.p2ScoreTitle.setVisible(true);
    scene.hud.p2ScoreValue.setVisible(true).setText('SCORE: ' + scene.state.p2.score);
    scene.hud.p2Lives.setVisible(true).setText('LIVES: ' + scene.state.p2.lives);
  } else {
    scene.hud.p2ScoreTitle.setVisible(false);
    scene.hud.p2ScoreValue.setVisible(false);
    scene.hud.p2Lives.setVisible(false);
    scene.hud.timeCombo.setVisible(true);
    const totalSeconds = Math.floor(scene.state.playing.timeElapsed / 1000);
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    scene.hud.timeCombo.setText('TIME ' + m + ':' + s + '   COMBO x' + scene.state.p1.comboMult);
  }
}

function createGameObjects(scene) {
  scene.state.p1.obj = createChefGraphics(scene, 0, 0, 0xfdd836);

  scene.state.p2.obj = createChefGraphics(scene, 0, 0, COLORS.tacosaurus);
  scene.state.p2.obj.setVisible(false);
}

function createChefGraphics(scene, x, y, mainColor) {
  const g = scene.add.graphics({ x, y });
  g.mainColor = mainColor;
  drawChef(g, 'down');
  return g;
}

function drawChef(g, dir) {
  g.clear();
  g.fillStyle(g.mainColor, 1);
  g.fillRect(-15, -15, 30, 30);
  g.fillStyle(COLORS.white, 1);
  g.fillRect(-12, -25, 24, 10);
  g.fillRect(-18, -30, 36, 12);
  g.fillStyle(0x04110b, 1);
  let ix = -5, iy = -5;
  if (dir === 'up') iy -= 10;
  else if (dir === 'down') iy += 10;
  else if (dir === 'left') ix -= 10;
  else if (dir === 'right') ix += 10;
  g.fillRect(ix, iy, 10, 10);
}

function updateChefPos(scene) {
  const p1 = scene.state.p1;
  p1.obj.setPosition(p1.x, p1.y);
  drawChef(p1.obj, p1.dir);

  const p2 = scene.state.p2;
  if (scene.state.mode === '2P') {
    p2.obj.setVisible(true);
    p2.obj.setPosition(p2.x, p2.y);
    drawChef(p2.obj, p2.dir);
  } else {
    p2.obj.setVisible(false);
  }
}

function createStartScreen(scene) {
  scene.startScreen = {};
  const c = scene.add.container(0, 0);
  scene.startScreen.container = c;
  c.setDepth(10);
  c.add(scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.overlay, 0.97));
  c.add(scene.add.text(GAME_WIDTH / 2, 150, 'HOT DEPLOY', S(42, '#ffcc00', 1)).setOrigin(0.5));
  c.add(scene.add.text(GAME_WIDTH / 2, 200, 'FORK BURGER vs TACO STACK', S(20, '#ff3b3b', 1)).setOrigin(0.5));

  scene.startScreen.modes = [];
  scene.startScreen.modes.push(scene.add.text(GAME_WIDTH / 2, 300, '1 PLAYER', S(24, '#f7ffd8')).setOrigin(0.5));
  scene.startScreen.modes.push(scene.add.text(GAME_WIDTH / 2, 350, '2 PLAYERS', S(24, '#f7ffd8')).setOrigin(0.5));
  c.add(scene.startScreen.modes[0]);
  c.add(scene.startScreen.modes[1]);
  c.setVisible(false);
}

function updateStartMenuHighlight(scene) {
  scene.startScreen.modes.forEach((txt, i) => {
    if (scene.state.menu.cursor === i) {
      txt.setText(`> ${i === 0 ? '1 PLAYER' : '2 PLAYERS'} <`).setColor('#e1ff00');
    } else {
      txt.setText(i === 0 ? '1 PLAYER' : '2 PLAYERS').setColor('#f7ffd8');
    }
  });
}

function handleStartMenu(scene, time) {
  if (consumePressed(scene, 'P1_D') || consumePressed(scene, 'P2_D')) {
    scene.state.menu.cursor = (scene.state.menu.cursor + 1) % 2;
    updateStartMenuHighlight(scene);
  }
  if (consumePressed(scene, 'P1_U') || consumePressed(scene, 'P2_U')) {
    scene.state.menu.cursor = (scene.state.menu.cursor - 1 + 2) % 2;
    updateStartMenuHighlight(scene);
  }

  if (consumePressed(scene, 'START1') || consumePressed(scene, 'START2') || consumePressed(scene, 'P1_1') || consumePressed(scene, 'P2_1')) {
    scene.startScreen.container.setVisible(false);
    startMatch(scene, scene.state.menu.cursor === 0 ? '1P' : '2P');
  }
}

function startMatch(scene, mode) {
  scene.state.phase = 'playing';
  scene.state.mode = mode;
  let p1Y = mode === '1P' ? 300 : 150;

  if (scene.state.playing && scene.state.playing.spawns) {
    scene.state.playing.spawns.forEach(s => s.g.destroy());
  }
  if (scene.state.playing && scene.state.playing.cars) {
    scene.state.playing.cars.forEach(c => { c.g.destroy(); c.labelG.destroy(); });
  }
  if (scene.state.p1.heldItemGraphics) scene.state.p1.heldItemGraphics.destroy();
  if (scene.state.p2.heldItemGraphics) scene.state.p2.heldItemGraphics.destroy();

  scene.state.p1 = { ...scene.state.p1, score: 0, comboStreak: 0, comboMult: 1, lives: 3, x: CX_COCINA, y: 300, dir: 'down', heldItem: null, trashCount: 0, heldItemGraphics: null };
  scene.state.p2 = { ...scene.state.p2, score: 0, comboStreak: 0, comboMult: 1, lives: 3, x: CX_COCINA, y: 450, dir: 'down', heldItem: null, trashCount: 0, heldItemGraphics: null };

  scene.state.playing = { timeElapsed: 0, spawns: [], cars: [], nextCarSpawn: DIFF_CAR_SPAWN_START };
  createSpawns(scene);

  updateBackgroundForMode(scene);
  updateChefPos(scene);
  refreshHud(scene);
}

const P1_ITEMS = [
  { id: 'burger', color: COLORS.itemBurger },
  { id: 'fries', color: COLORS.itemFries },
  { id: 'drink', color: COLORS.itemDrink },
  { id: 'icecream', color: COLORS.itemIceCream },
];
const P2_ITEMS = [
  { id: 'taco', color: COLORS.itemTaco },
  { id: 'burrito', color: COLORS.itemBurrito },
  { id: 'drink', color: COLORS.itemDrink },
  { id: 'nachos', color: COLORS.itemNachos },
];

function createSpawns(scene) {
  const s = scene.state.playing.spawns;
  // En modo 1P los 4 spawns se distribuyen verticalmente
  // en el centro horizontal de la cocina
  const ys = [130, 245, 360, 475];
  P1_ITEMS.forEach((item, i) => {
    const x = CX_COCINA;
    const y = ys[i];
    const g = scene.add.circle(x, y, 15, item.color, 0.6);
    s.push({ x, y, id: item.id, color: item.color, g, p: 'p1' });
  });
  // Nota: en modo 2P los spawns de P2 se agregan en Sprint 5B
}

function createEndGameUi(scene) {
  scene.endGame = {};
  const c = scene.add.container(0, 0); c.setDepth(20);
  scene.endGame.container = c;
  c.add(scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.overlay, 0.98));
  scene.endGame.title = scene.add.text(GAME_WIDTH / 2, 100, 'GAME OVER', S(30, '#f7ffd8', 1)).setOrigin(0.5);
  c.add(scene.endGame.title);

  scene.endGame.scoreDisplay = scene.add.text(GAME_WIDTH / 2, 150, '', S(24, '#ffcc00', 0, { align: 'center' })).setOrigin(0.5);
  c.add(scene.endGame.scoreDisplay);

  scene.endGame.nameValue = scene.add.text(GAME_WIDTH / 2, 220, '___', S(36, '#ff6ec7', 1, { align: 'center', letterSpacing: 10 })).setOrigin(0.5);
  c.add(scene.endGame.nameValue);

  scene.endGame.gridLabels = [];
  for (let row = 0; row < LETTER_GRID.length; row++) {
    const rowValues = LETTER_GRID[row];
    const rowWidth = rowValues.length * 56;
    for (let col = 0; col < rowValues.length; col++) {
      const value = rowValues[col];
      const cellX = GAME_WIDTH / 2 - rowWidth / 2 + 28 + col * 56;
      const cellY = 320 + row * 28;
      const cell = scene.add.rectangle(cellX, cellY, value.length > 1 ? 64 : 42, 24, COLORS.road, 0.95);
      cell.setStrokeStyle(2, COLORS.frame, 0.8);
      const label = scene.add.text(cellX, cellY, value, S(value.length > 1 ? 14 : 18, '#f7fbff', 1, { align: 'center' })).setOrigin(0.5);
      scene.endGame.gridLabels.push({ cell, label, row, col, value });
      c.add(cell); c.add(label);
    }
  }
  c.setVisible(false);
}

function showStartScreen(scene) {
  scene.state.phase = 'start';
  updateStartMenuHighlight(scene);
  scene.startScreen.container.setVisible(true);
}

function updatePlaying(scene, time, delta) {
  const pState = scene.state.playing;
  pState.timeElapsed += delta;

  if (scene.state.mode === '2P' && pState.timeElapsed >= MATCH_TIME_LIMIT_MS) {
    if (scene.state.p1.score !== scene.state.p2.score) {
      endMatch2P(scene, scene.state.p1.score > scene.state.p2.score ? 'P1 WINS ON TIME' : 'P2 WINS ON TIME');
      return;
    }
    // Sudden death let it continue
  }

  handleChefMovement(scene, delta);
  handleInteractions(scene);
  updateCars(scene, delta);

  if (!pState.lastHudUpdate || pState.timeElapsed - pState.lastHudUpdate >= 500) {
    pState.lastHudUpdate = pState.timeElapsed;
    refreshHud(scene);
  }
}

function handleInteractions(scene) {
  checkPlayerInteraction(scene, scene.state.p1, 'P1', 'p1');
  if (scene.state.mode === '2P') {
    checkPlayerInteraction(scene, scene.state.p2, 'P2', 'p2');
  }
}

function checkPlayerInteraction(scene, p, prefix, pKey) {
  if (consumePressed(scene, prefix + '_1')) {
    if (p.heldItem === null) {
      const spawns = scene.state.playing.spawns.filter(s => s.p === pKey);
      for (let s of spawns) {
        if (Phaser.Math.Distance.Between(p.x, p.y, s.x, s.y) < 40) {
          p.heldItem = s.id;
          p.heldItemGraphics = scene.add.circle(p.x, p.y - 30, 10, s.color, 1);
          break;
        }
      }
    }
  }

  if (consumePressed(scene, prefix + '_2')) {
    if (p.heldItem !== null) {
      p.heldItemGraphics.destroy();
      p.heldItemGraphics = null;
      p.heldItem = null;
      p.trashCount++;
      p.comboStreak = 0;
      p.comboMult = 1;
      if (p.trashCount >= 3) {
        p.trashCount = 0;
        loseLife(scene, pKey);
      }
      refreshHud(scene);
    }
  }

  if (consumePressed(scene, prefix + '_3')) {
    if (p.heldItem !== null) {

      const nearVentanilla = p.x <= X_COCINA + (ZONE_COCINA_W / 3);

      if (nearVentanilla && scene.state.playing.cars.length > 0) {
        const candidates = scene.state.playing.cars.filter(c =>
          !c.served && c.owner === pKey
        );

        if (candidates.length > 0) {
          candidates.sort((a, b) => b.y - a.y);
          const car = candidates[0];

          if (car.item === p.heldItem) {
            // Entrega correcta — poof y marcar como servido
            spawnPoof(scene, CAR_X, car.y);
            car.served = true;
            p.score += 100 * p.comboMult;
            p.comboStreak++;
            const threshold = COMBO_THRESHOLDS[
              Math.min(p.comboMult - 1, COMBO_THRESHOLDS.length - 1)
            ];
            if (p.comboStreak >= threshold) {
              p.comboMult = Math.min(p.comboMult + 1, 8);
              p.comboStreak = 0;
            }
            p.trashCount = 0;
          } else {
            // Entrega incorrecta — bajar un escalón de combo
            p.comboMult = Math.max(p.comboMult - 1, 1);
            p.comboStreak = 0;
            // Respiro de spawn tras fallar
            scene.state.playing.nextCarSpawn = Math.max(
              scene.state.playing.nextCarSpawn,
              scene.state.playing.timeElapsed + FAIL_RELIEF_MS
            );
          }
        }
      }

      // En cualquier caso el chef suelta el ítem
      p.heldItemGraphics.destroy();
      p.heldItemGraphics = null;
      p.heldItem = null;
      refreshHud(scene);
    }
  }

  if (p.heldItemGraphics) {
    p.heldItemGraphics.setPosition(p.x, p.y - 30);
  }
}

function loseLife(scene, playerKey) {
  scene.state[playerKey].lives--;
  scene.state[playerKey].comboStreak = 0;
  scene.state[playerKey].comboMult = 1;
  refreshHud(scene);

  if (scene.state[playerKey].lives <= 0) {
    if (scene.state.mode === '1P') {
      showGameOver(scene, 'p1');
    } else {
      let winner = playerKey === 'p1' ? 'P2 WINS (SURVIVAL)' : 'P1 WINS (SURVIVAL)';
      endMatch2P(scene, winner);
    }
  }
}

function showGameOver(scene, playerKey) {
  scene.state.phase = 'gameover';

  if (scene.state.playing && scene.state.playing.spawns) {
    scene.state.playing.spawns.forEach(s => s.g.destroy());
    scene.state.playing.spawns = [];
  }
  if (scene.state.playing && scene.state.playing.cars) {
    scene.state.playing.cars.forEach(c => { c.g.destroy(); c.labelG.destroy(); });
    scene.state.playing.cars = [];
  }
  if (scene.state.p1.heldItemGraphics) { scene.state.p1.heldItemGraphics.destroy(); scene.state.p1.heldItemGraphics = null; }
  if (scene.state.p2.heldItemGraphics) { scene.state.p2.heldItemGraphics.destroy(); scene.state.p2.heldItemGraphics = null; }

  scene.state.nameEntry.winner = playerKey;
  scene.endGame.scoreDisplay.setText(`FINAL SCORE: ${scene.state[playerKey].score}`);
  scene.state.nameEntry.letters = [];
  scene.state.nameEntry.row = 0;
  scene.state.nameEntry.col = 0;
  updateNameEntryHighlights(scene);
  updateNameText(scene);
  scene.endGame.container.setVisible(true);
}

function endMatch2P(scene, message) {
  scene.state.phase = 'gameover';

  if (scene.state.playing && scene.state.playing.spawns) {
    scene.state.playing.spawns.forEach(s => s.g.destroy());
    scene.state.playing.spawns = [];
  }
  if (scene.state.playing && scene.state.playing.cars) {
    scene.state.playing.cars.forEach(c => { c.g.destroy(); c.labelG.destroy(); });
    scene.state.playing.cars = [];
  }
  if (scene.state.p1.heldItemGraphics) { scene.state.p1.heldItemGraphics.destroy(); scene.state.p1.heldItemGraphics = null; }
  if (scene.state.p2.heldItemGraphics) { scene.state.p2.heldItemGraphics.destroy(); scene.state.p2.heldItemGraphics = null; }

  scene.endGame.title.setText(message);
  let topScorer = scene.state.p1.score >= scene.state.p2.score ? 'p1' : 'p2';
  scene.state.nameEntry.winner = topScorer;
  scene.endGame.scoreDisplay.setText(`HIGHEST SCORE: ${scene.state[topScorer].score}`);
  scene.state.nameEntry.letters = [];
  scene.state.nameEntry.row = 0; scene.state.nameEntry.col = 0;
  updateNameEntryHighlights(scene);
  updateNameText(scene);
  scene.endGame.container.setVisible(true);
}

function handleChefMovement(scene, delta) {
  const base = 4 * (delta / 16.66);
  const p1Speed = base * getComboSpeed(scene.state.p1.comboMult);
  const p2Speed = base * getComboSpeed(scene.state.p2.comboMult);

  movePlayer(scene, scene.state.p1, 'P1', p1Speed, [0, 600]);

  if (scene.state.mode === '2P') {
    movePlayer(scene, scene.state.p2, 'P2', p2Speed, [0, 600]);
  }

  updateChefPos(scene);
}

function movePlayer(scene, p, prefix, speed, yBounds) {
  let dx = 0; let dy = 0;
  if (scene.controls.held[prefix + '_U']) { dy -= speed; p.dir = 'up'; }
  if (scene.controls.held[prefix + '_D']) { dy += speed; p.dir = 'down'; }
  if (scene.controls.held[prefix + '_L']) { dx -= speed; p.dir = 'left'; }
  if (scene.controls.held[prefix + '_R']) { dx += speed; p.dir = 'right'; }

  p.x += dx;
  p.y += dy;

  p.x = Phaser.Math.Clamp(p.x, CHEF_X_MIN, CHEF_X_MAX);
  p.y = Phaser.Math.Clamp(p.y, yBounds[0] + 15, yBounds[1] - 15);
}

function updateNameEntryHighlights(scene) {
  const activeRow = scene.state.nameEntry.row;
  const activeCol = scene.state.nameEntry.col;
  scene.endGame.gridLabels.forEach(({ cell, label, row, col }) => {
    const isActive = row === activeRow && col === activeCol;
    cell.setFillStyle(isActive ? COLORS.scoreText : COLORS.road, isActive ? 1 : 0.95);
    label.setColor(isActive ? '#04110b' : '#f7fbff');
  });
}

function updateNameText(scene) {
  const letters = scene.state.nameEntry.letters;
  let text = '';
  for (let i = 0; i < WINNING_NAME_LENGTH; i += 1) {
    if (i < letters.length) text += letters[i];
    else if (i === letters.length) text += '_';
    else text += ' ';
  }
  scene.endGame.nameValue.setText(text);
}

function handleNameEntry(scene, time) {
  if (time < scene.state.nameEntry.moveCooldownUntil) return;

  let moved = false;
  if (consumePressed(scene, 'P1_U') && scene.state.nameEntry.row > 0) { scene.state.nameEntry.row -= 1; moved = true; }
  if (consumePressed(scene, 'P1_D') && scene.state.nameEntry.row < LETTER_GRID.length - 1) { scene.state.nameEntry.row += 1; moved = true; }
  if (consumePressed(scene, 'P1_L') && scene.state.nameEntry.col > 0) { scene.state.nameEntry.col -= 1; moved = true; }
  if (consumePressed(scene, 'P1_R') && scene.state.nameEntry.col < LETTER_GRID[scene.state.nameEntry.row].length - 1) { scene.state.nameEntry.col += 1; moved = true; }

  if (moved) {
    scene.state.nameEntry.col = Math.min(scene.state.nameEntry.col, LETTER_GRID[scene.state.nameEntry.row].length - 1);
    scene.state.nameEntry.moveCooldownUntil = time + 150;
    updateNameEntryHighlights(scene);
  }

  if (consumePressed(scene, 'P1_1') || consumePressed(scene, 'START1')) {
    const val = LETTER_GRID[scene.state.nameEntry.row][scene.state.nameEntry.col];
    if (val === 'DEL') {
      if (scene.state.nameEntry.letters.length > 0) { scene.state.nameEntry.letters.pop(); updateNameText(scene); }
    } else if (val === 'END' || scene.state.nameEntry.letters.length === WINNING_NAME_LENGTH) {
      saveScoreAndReturn(scene);
    } else if (scene.state.nameEntry.letters.length < WINNING_NAME_LENGTH) {
      scene.state.nameEntry.letters.push(val);
      updateNameText(scene);
      if (scene.state.nameEntry.letters.length === WINNING_NAME_LENGTH) saveScoreAndReturn(scene);
    }
  }
}

async function loadHighScores() {
  if (!window.platanusArcadeStorage) return [];
  const res = await window.platanusArcadeStorage.get(STORAGE_KEY);
  if (res.found && Array.isArray(res.value)) return res.value.slice(0, MAX_HIGH_SCORES);
  return [];
}

async function saveScoreAndReturn(scene) {
  let nameStr = scene.state.nameEntry.letters.join('').trim();
  if (!nameStr) nameStr = '???';

  const sc = scene.state[scene.state.nameEntry.winner].score;
  const entry = { name: nameStr, score: sc, mode: scene.state.mode, date: new Date().toISOString() };

  const newHighScores = [...scene.state.highScores, entry];
  newHighScores.sort((a, b) => b.score - a.score);
  const toSave = newHighScores.slice(0, MAX_HIGH_SCORES);
  scene.state.highScores = toSave;

  if (window.platanusArcadeStorage) {
    try { await window.platanusArcadeStorage.set(STORAGE_KEY, toSave); } catch (e) { }
  }

  scene.endGame.container.setVisible(false);
  scene.endGame.title.setText('GAME OVER'); // reset for next time
  showStartScreen(scene);
}

function spawnPoof(scene, x, y) {
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(0, 0, 12);
  g.setPosition(x, y);
  g.setDepth(10);

  scene.tweens.add({
    targets: g,
    scaleX: 2.5,
    scaleY: 2.5,
    alpha: 0,
    duration: 200,
    ease: 'Power2',
    onComplete: () => g.destroy()
  });
}

function spawnCar(scene) {
  const itemPool = P1_ITEMS;
  const item = itemPool[Math.floor(Math.random() * itemPool.length)];

  // Verificar que no haya otro auto muy cerca del tope
  // para evitar superposición al spawnear
  const tooClose = scene.state.playing.cars.some(c => c.y < 80);
  if (tooClose) return;

  // Dibujar el auto orientado verticalmente
  const g = scene.add.graphics();
  g.fillStyle(COLORS.carBody, 1);
  g.fillRect(-13, -22, 26, 44);   // cuerpo principal
  g.fillStyle(0xaaeeff, 1);
  g.fillRect(-9, -18, 18, 20);    // parabrisas
  g.fillStyle(0x222222, 1);
  g.fillCircle(-10, 24, 6);       // rueda trasera izq
  g.fillCircle(10, 24, 6);        // rueda trasera der
  g.fillCircle(-10, -24, 6);      // rueda delantera izq
  g.fillCircle(10, -24, 6);       // rueda delantera der
  g.setPosition(CAR_X, CAR_Y_START);
  g.setDepth(5);

  // Ícono del pedido — cuadrado blanco con círculo de color
  const labelG = scene.add.graphics();
  labelG.fillStyle(0xf7ffd8, 1);
  labelG.fillRect(-13, -13, 26, 26);
  labelG.fillStyle(item.color, 1);
  labelG.fillCircle(0, 0, 8);
  labelG.setPosition(CAR_X + 30, CAR_Y_START);
  labelG.setDepth(5);

  scene.state.playing.cars.push({
    y: CAR_Y_START,
    item: item.id,
    itemColor: item.color,
    owner: 'p1',
    served: false,
    waiting: false,
    waitTimer: 0,
    g,
    labelG,
  });
}

function updateCars(scene, delta) {
  const ps = scene.state.playing;
  if (!ps.cars) return;

  // Spawnear nuevo auto si corresponde
  if (ps.timeElapsed >= ps.nextCarSpawn) {
    spawnCar(scene);
    const diff = getDifficulty(ps.timeElapsed);
    ps.nextCarSpawn = ps.timeElapsed + diff.carSpawnInterval
      + Math.random() * 1000;
  }

  const dt = delta / 1000;
  const speed = getDifficulty(ps.timeElapsed).carSpeed;
  const waitLimit = getDifficulty(ps.timeElapsed).clientWait;
  const cars = ps.cars;

  for (let i = cars.length - 1; i >= 0; i--) {
    const c = cars[i];

    // Auto ya atendido — destruir inmediatamente
    if (c.served) {
      c.g.destroy();
      c.labelG.destroy();
      cars.splice(i, 1);
      continue;
    }

    // Chequear blocker — no bajar si hay otro auto muy cerca adelante
    const blocker = cars.find((other, j) =>
      j !== i &&
      !other.served &&
      other.y > c.y &&
      other.y - c.y < 70
    );

    if (c.waiting) {
      // Auto detenido en zona de espera — acumular tiempo
      c.waitTimer += delta;

      if (c.waitTimer >= waitLimit) {
        // Timeout — se escapa sin poof, pierde vida
        c.g.destroy();
        c.labelG.destroy();
        cars.splice(i, 1);
        loseLife(scene, c.owner);
      }
      // Si está esperando no se mueve aunque no haya blocker
      continue;
    }

    // Auto en movimiento — aplicar blocker
    if (blocker) continue;

    // Mover hacia abajo
    c.y += speed * dt;
    c.g.setPosition(CAR_X, c.y);
    c.labelG.setPosition(CAR_X + 30, c.y);

    // Llegó a la zona de espera — detenerse
    if (c.y >= CAR_WAIT_Y) {
      c.y = CAR_WAIT_Y;
      c.g.setPosition(CAR_X, CAR_WAIT_Y);
      c.labelG.setPosition(CAR_X + 30, CAR_WAIT_Y);
      c.waiting = true;
      c.waitTimer = 0;
    }
  }
}

function drawDebugGrid(scene) {
  if (!DEBUG_GRID) return;
  if (scene.debugGrid) scene.debugGrid.destroy();
  scene.debugGrid = scene.add.graphics();
  const g = scene.debugGrid;

  // Línea izq de ventanilla — azul
  g.lineStyle(2, 0x0088ff, 0.8);
  g.lineBetween(X_VENT, 0, X_VENT, GAME_HEIGHT);

  // Línea der de ventanilla / izq de cocina — azul
  g.lineBetween(X_COCINA, 0, X_COCINA, GAME_HEIGHT);

  // Línea der de cocina / izq de mostrador — verde
  g.lineStyle(2, 0x00ff88, 0.8);
  g.lineBetween(X_MOSTRADOR, 0, X_MOSTRADOR, GAME_HEIGHT);

  // Línea der de mostrador / izq de tienda — verde
  g.lineBetween(X_TIENDA, 0, X_TIENDA, GAME_HEIGHT);

  // Columna del auto — rojo
  g.lineStyle(2, 0xff0000, 0.8);
  g.lineBetween(CAR_X, 0, CAR_X, GAME_HEIGHT);

  // Límite izq del chef — amarillo
  g.lineStyle(2, 0xffff00, 0.5);
  g.lineBetween(CHEF_X_MIN, 0, CHEF_X_MIN, GAME_HEIGHT);

  // Límite der del chef — amarillo
  g.lineBetween(CHEF_X_MAX, 0, CHEF_X_MAX, GAME_HEIGHT);

  // Zona de entrega auto (SERVE_AUTO_X_MAX) — naranja
  g.lineStyle(2, 0xff8800, 0.8);
  g.lineBetween(SERVE_AUTO_X_MAX, 0, SERVE_AUTO_X_MAX, GAME_HEIGHT);

  // Zona de entrega cliente (SERVE_CLIENT_X_MIN) — naranja
  g.lineBetween(SERVE_CLIENT_X_MIN, 0, SERVE_CLIENT_X_MIN, GAME_HEIGHT);

  // Etiquetas de zonas
  const labels = [
    [CX_COLA, 20, 'COLA\nAUTOS', '#0088ff'],
    [CX_VENT, 20, 'VENT', '#0088ff'],
    [CX_COCINA, 20, 'COCINA', '#ffffff'],
    [CX_MOSTRADOR, 20, 'MOST', '#00ff88'],
    [CX_TIENDA, 20, 'COLA\nCLIENT', '#00ff88'],
  ];
  labels.forEach(([x, y, text, color]) => {
    scene.add.text(x, y, text, {
      fontFamily: 'monospace', fontSize: '10px',
      color, align: 'center'
    }).setOrigin(0.5, 0);
  });
}

