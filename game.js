// Platanus Hack 26 — Buenos Aires Edition
// Two-player brick duel. Dash with Button 1, break the word, keep your paddle alive.

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const STORAGE_KEY = 'platanus-hack-26-standard-highscores';
const MAX_HIGH_SCORES = 5;
const WINNING_NAME_LENGTH = 3;

const COLORS = {
  background: 0x0b0f03,
  frame: 0x3a3a0a,
  accent: 0xe1ff00,
  accentSoft: 0xa8c700,
  p1: 0xe1ff00,
  p2: 0xff6ec7,
  red: 0xff7a7a,
  white: 0xf7ffd8,
  slate: 0xb8c48d,
  cell: 0x1a1e05,
  overlay: 0x0c0e02,
  backdrop: 0x030504,
  fieldBg: 0x0a0d0b,
  brickA: 0x3f4a0e,
  brickB: 0x6b7f14,
  brickC: 0xa8c700,
  brickD: 0xe1ff00,
};

const LETTER_GRID = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  ['H', 'I', 'J', 'K', 'L', 'M', 'N'],
  ['O', 'P', 'Q', 'R', 'S', 'T', 'U'],
  ['V', 'W', 'X', 'Y', 'Z', '.', '-'],
  ['DEL', 'END'],
];

const CABINET_KEYS = {
  P1_U: 'w',
  P1_D: 's',
  P1_L: 'a',
  P1_R: 'd',
  P1_1: 'u',
  P1_2: 'i',
  P1_3: 'o',
  P1_4: 'j',
  P1_5: 'k',
  P1_6: 'l',
  P2_U: 'ArrowUp',
  P2_D: 'ArrowDown',
  P2_L: 'ArrowLeft',
  P2_R: 'ArrowRight',
  P2_1: 'r',
  P2_2: 't',
  P2_3: 'y',
  P2_4: 'f',
  P2_5: 'g',
  P2_6: 'h',
  START1: 'Enter',
  START2: '2',
};

const KEYBOARD_TO_ARCADE = {};
for (const [arcadeCode, key] of Object.entries(CABINET_KEYS)) {
  KEYBOARD_TO_ARCADE[normalizeIncomingKey(key)] = arcadeCode;
}

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-root',
  backgroundColor: '#0b0f03',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  scene: {
    preload,
    create,
    update,
  },
};

new Phaser.Game(config);

function preload() {}

function create() {
  const scene = this;

  scene.state = {
    phase: 'loading',
    scores: { p1: 0, p2: 0 },
    remainingBricks: 0,
    highScores: [],
    winner: null,
    winnerLabel: '',
    saveStatus: 'Loading scores...',
    menu: { cursor: 0, cooldown: 0, lastAxis: 0 },
    dash: {
      p1: { activeUntil: 0, cooldownUntil: 0, dir: 0 },
      p2: { activeUntil: 0, cooldownUntil: 0, dir: 0 },
    },
    nameEntry: {
      letters: [],
      row: 0,
      col: 0,
      moveCooldownUntil: 0,
      confirmCooldownUntil: 0,
      lastMoveVector: { x: 0, y: 0 },
    },
  };

  scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);
  scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 760, 560, 0x141a04, 0.94).setStrokeStyle(4, COLORS.frame, 0.8);

  createBackground(scene);
  createHud(scene);
  createPlayfield(scene);
  createEndGameUi(scene);
  createStartScreen(scene);
  createLeaderboardScreen(scene);
  createControlsScreen(scene);
  createPauseScreen(scene);
  createControls(scene);
  showStartScreen(scene);

  loadHighScores()
    .then((highScores) => {
      scene.state.highScores = highScores;
      scene.state.saveStatus = 'Finish a duel to save a score.';
      refreshLeaderboard(scene);
      refreshStartScreenLeaderboard(scene);
    })
    .catch(() => {
      scene.state.highScores = [];
      scene.state.saveStatus = 'Storage unavailable. Match runs without saves.';
      refreshLeaderboard(scene);
      refreshStartScreenLeaderboard(scene);
    });
}

function update(time, delta) {
  const scene = this;
  if (!scene.state) {
    return;
  }

  const phase = scene.state.phase;

  if (phase === 'start') {
    handleStartMenu(scene, time);
    return;
  }

  if (phase === 'leaderboard') {
    if (consumeAnyPressedControl(scene, ['START1', 'START2', 'P1_1', 'P2_1', 'P1_2', 'P2_2'])) {
      scene.leaderScreen.container.setVisible(false);
      showStartScreen(scene);
    }
    return;
  }

  if (phase === 'controls') {
    if (consumeAnyPressedControl(scene, ['START1', 'START2', 'P1_1', 'P2_1', 'P1_2', 'P2_2'])) {
      scene.controlsScreen.container.setVisible(false);
      showStartScreen(scene);
    }
    return;
  }

  if (phase === 'playing') {
    updatePaddles(scene, delta, time);
    updateBallGhostStates(scene);
    updateBallTrails(scene, time);
    checkBallEscape(scene);
    if (consumeAnyPressedControl(scene, ['START1', 'START2'])) {
      pauseMatch(scene);
    }
    return;
  }

  if (phase === 'paused') {
    if (consumeAnyPressedControl(scene, ['START1', 'START2'])) {
      resumeMatch(scene);
    }
    return;
  }

  if (phase === 'gameover') {
    handleNameEntry(scene, time);
    return;
  }

  if (phase === 'saved') {
    if (consumeAnyPressedControl(scene, ['START1', 'START2', 'P1_1', 'P2_1', 'P1_2', 'P2_2'])) {
      returnToStart(scene);
    }
  }
}

function createBackground(scene) {
  scene.add.rectangle(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    700,
    450,
    COLORS.fieldBg,
    0.18,
  );
}

function createHud(scene) {
  scene.hud = {};

  scene.hud.title = scene.add
    .text(GAME_WIDTH / 2, 20, 'PLATANUS HACK 26 BRICKS', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#f7fbff',
      fontStyle: 'bold',
      align: 'center',
    })
    .setOrigin(0.5, 0);

  scene.hud.subtitle = scene.add
    .text(
      GAME_WIDTH / 2,
      48,
      '',
      {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#a8ad8a',
        align: 'center',
      },
    )
    .setOrigin(0.5, 0);

  scene.hud.p1Score = scene.add
    .text(65, 72, 'P1 00', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#e1ff00',
      fontStyle: 'bold',
    })
    .setOrigin(0, 0.5);

  scene.hud.p2Score = scene.add
    .text(GAME_WIDTH - 65, 72, 'P2 00', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ff6ec7',
      fontStyle: 'bold',
    })
    .setOrigin(1, 0.5);

  scene.hud.remaining = scene.add
    .text(GAME_WIDTH / 2, 72, 'BRICKS 000', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffd84d',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);

  scene.hud.status = scene.add
    .text(GAME_WIDTH / 2, GAME_HEIGHT - 24, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#f7fbff',
      align: 'center',
    })
    .setOrigin(0.5);

  scene.hud.scoreColors = {
    p1: '#e1ff00',
    p2: '#ff6ec7',
    penalty: '#ff7a7a',
  };
}

function createPlayfield(scene) {
  scene.playfield = {};
  const paddleWidth = 112;
  const paddleHeight = 10;
  const topBounceLineY = 118;
  const bottomBounceLineY = GAME_HEIGHT - 72;
  const wallThickness = 8;
  const wallGap = 22;
  const topPaddleY = topBounceLineY - paddleHeight / 2;
  const bottomPaddleY = bottomBounceLineY + paddleHeight / 2;
  const topWallY = topBounceLineY - wallGap - wallThickness / 2;
  const bottomWallY = bottomBounceLineY + wallGap + wallThickness / 2;

  // Walls span full width/height so corners are sealed — balls cannot escape through gaps.
  scene.playfield.leftWall = scene.add.rectangle(38, GAME_HEIGHT / 2, 14, GAME_HEIGHT, COLORS.frame, 0);
  scene.playfield.rightWall = scene.add.rectangle(GAME_WIDTH - 38, GAME_HEIGHT / 2, 14, GAME_HEIGHT, COLORS.frame, 0);
  scene.playfield.topWall = scene.add.rectangle(
    GAME_WIDTH / 2,
    topWallY,
    GAME_WIDTH,
    wallThickness,
    COLORS.frame,
    0,
  );
  scene.playfield.bottomWall = scene.add.rectangle(
    GAME_WIDTH / 2,
    bottomWallY,
    GAME_WIDTH,
    wallThickness,
    COLORS.frame,
    0,
  );

  scene.physics.add.existing(scene.playfield.leftWall, true);
  scene.physics.add.existing(scene.playfield.rightWall, true);
  scene.physics.add.existing(scene.playfield.topWall, true);
  scene.physics.add.existing(scene.playfield.bottomWall, true);

  scene.add.rectangle(
    GAME_WIDTH / 2,
    topBounceLineY,
    700,
    1,
    COLORS.frame,
    0.55,
  );
  scene.add.rectangle(
    GAME_WIDTH / 2,
    bottomBounceLineY,
    700,
    1,
    COLORS.frame,
    0.55,
  );

  scene.playfield.p1Paddle = scene.add.rectangle(
    GAME_WIDTH / 2,
    topPaddleY,
    paddleWidth,
    paddleHeight,
    COLORS.p1,
    1,
  );
  scene.playfield.p2Paddle = scene.add.rectangle(
    GAME_WIDTH / 2,
    bottomPaddleY,
    paddleWidth,
    paddleHeight,
    COLORS.p2,
    1,
  );

  scene.physics.add.existing(scene.playfield.p1Paddle);
  scene.physics.add.existing(scene.playfield.p2Paddle);

  configurePaddleBody(scene.playfield.p1Paddle.body);
  configurePaddleBody(scene.playfield.p2Paddle.body);

  scene.playfield.balls = [
    createBall(scene, GAME_WIDTH / 2 - 120, 170, COLORS.white, 'p1'),
    createBall(scene, GAME_WIDTH / 2 + 120, GAME_HEIGHT - 170, COLORS.white, 'p2'),
  ];

  scene.playfield.bricks = scene.physics.add.staticGroup();
  scene.playfield.ballTrails = scene.add.group();

  for (const ball of scene.playfield.balls) {
    scene.physics.add.collider(ball, scene.playfield.leftWall);
    scene.physics.add.collider(ball, scene.playfield.rightWall);
    scene.physics.add.collider(ball, scene.playfield.topWall);
    scene.physics.add.collider(ball, scene.playfield.bottomWall);
    scene.physics.add.collider(
      ball,
      scene.playfield.p1Paddle,
      () => handleBallPaddleCollision(scene, ball, scene.playfield.p1Paddle, 'p1'),
      () => canBallCollideWithPaddle(ball, 'p1'),
      scene,
    );
    scene.physics.add.collider(
      ball,
      scene.playfield.p2Paddle,
      () => handleBallPaddleCollision(scene, ball, scene.playfield.p2Paddle, 'p2'),
      () => canBallCollideWithPaddle(ball, 'p2'),
      scene,
    );
    scene.physics.add.collider(
      ball,
      scene.playfield.bricks,
      (_, brick) => handleBallBrickCollision(scene, ball, brick),
      undefined,
      scene,
    );
  }
}

function createEndGameUi(scene) {
  scene.endGame = {};

  scene.endGame.container = scene.add.container(0, 0);
  scene.endGame.container.setDepth(20);
  scene.endGame.container.setVisible(false);

  const backdrop = scene.add.rectangle(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    GAME_WIDTH,
    GAME_HEIGHT,
    COLORS.backdrop,
    0.98,
  );
  scene.endGame.container.add(backdrop);

  scene.endGame.title = scene.add
    .text(GAME_WIDTH / 2, 88, 'GAME OVER', {
      fontFamily: 'monospace',
      fontSize: '30px',
      color: '#f7ffd8',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);

  scene.endGame.summary = scene.add
    .text(GAME_WIDTH / 2, 126, '', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#e1ff00',
      align: 'center',
    })
    .setOrigin(0.5);

  scene.endGame.nameLabel = scene.add
    .text(GAME_WIDTH / 2, 172, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#a8ad8a',
      align: 'center',
    })
    .setOrigin(0.5);

  scene.endGame.nameValue = scene.add
    .text(GAME_WIDTH / 2, 208, '___', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#ff6ec7',
      fontStyle: 'bold',
      align: 'center',
      letterSpacing: 10,
    })
    .setOrigin(0.5);

  scene.endGame.instructions = scene.add
    .text(
      GAME_WIDTH / 2,
      242,
      'MOVE  PICK',
      {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#a8ad8a',
        align: 'center',
      },
    )
    .setOrigin(0.5);

  scene.endGame.leaderboardTitle = scene.add
    .text(GAME_WIDTH / 2, 286, 'SCOREBOARD', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#e1ff00',
      fontStyle: 'bold',
      align: 'center',
    })
    .setOrigin(0.5);

  scene.endGame.gridLabels = [];

  for (let row = 0; row < LETTER_GRID.length; row += 1) {
    const rowValues = LETTER_GRID[row];
    const rowWidth = rowValues.length * 56;
    for (let col = 0; col < rowValues.length; col += 1) {
      const value = rowValues[col];
      const cellX = GAME_WIDTH / 2 - rowWidth / 2 + 28 + col * 56;
      const cellY = 430 + row * 28;

      const cell = scene.add.rectangle(cellX, cellY, value.length > 1 ? 64 : 42, 24, COLORS.cell, 0.95);
      cell.setStrokeStyle(2, COLORS.frame, 0.8);

      const label = scene.add
        .text(cellX, cellY, value, {
          fontFamily: 'monospace',
          fontSize: value.length > 1 ? '14px' : '18px',
          color: '#f7fbff',
          fontStyle: 'bold',
          align: 'center',
        })
        .setOrigin(0.5);

      scene.endGame.gridLabels.push({ cell, label, row, col, value });
      scene.endGame.container.add(cell);
      scene.endGame.container.add(label);
    }
  }

  scene.endGame.saveStatus = scene.add
    .text(GAME_WIDTH / 2, 590, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#e1ff00',
      align: 'center',
    })
    .setOrigin(0.5);

  scene.endGame.leaderboard = scene.add
    .text(GAME_WIDTH / 2, 308, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#f7ffd8',
      align: 'center',
      lineSpacing: 4,
    })
    .setOrigin(0.5, 0);

  scene.endGame.container.add(scene.endGame.title);
  scene.endGame.container.add(scene.endGame.summary);
  scene.endGame.container.add(scene.endGame.nameLabel);
  scene.endGame.container.add(scene.endGame.nameValue);
  scene.endGame.container.add(scene.endGame.instructions);
  scene.endGame.container.add(scene.endGame.leaderboardTitle);
  scene.endGame.container.add(scene.endGame.leaderboard);
  scene.endGame.container.add(scene.endGame.saveStatus);
}

function createControls(scene) {
  scene.controls = {
    held: Object.create(null),
    pressed: Object.create(null),
  };

  const onKeyDown = (event) => {
    const key = normalizeIncomingKey(event.key);
    if (!key) {
      return;
    }

    const arcadeCode = KEYBOARD_TO_ARCADE[key];
    if (!arcadeCode) {
      return;
    }

    if (!scene.controls.held[arcadeCode]) {
      scene.controls.pressed[arcadeCode] = true;
    }
    scene.controls.held[arcadeCode] = true;
  };

  const onKeyUp = (event) => {
    const key = normalizeIncomingKey(event.key);
    if (!key) {
      return;
    }

    const arcadeCode = KEYBOARD_TO_ARCADE[key];
    if (!arcadeCode) {
      return;
    }

    scene.controls.held[arcadeCode] = false;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  scene.events.once('shutdown', () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  });
}

function startMatch(scene) {
  scene.physics.resume();
  scene.startScreen.container.setVisible(false);
  buildTextBricks(scene);
  resetBalls(scene);
  scene.state.scores = { p1: 0, p2: 0 };
  refreshHud(scene);
  scene.state.phase = 'playing';
  scene.hud.status.setText('');
}

function createStartScreen(scene) {
  scene.startScreen = {};
  const c = scene.add.container(0, 0);
  c.setDepth(15);
  scene.startScreen.container = c;

  c.add(scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.overlay, 0.97));

  c.add(
    scene.add
      .text(GAME_WIDTH / 2, 88, 'PLATANUS HACK 26', {
        fontFamily: 'monospace', fontSize: '16px', color: '#a8c700',
      })
      .setOrigin(0.5),
  );
  const titleMain = scene.add
    .text(GAME_WIDTH / 2, 150, 'BUENOS AIRES EDITION', {
      fontFamily: 'monospace', fontSize: '38px', color: '#e1ff00', fontStyle: 'bold',
    })
    .setOrigin(0.5);
  c.add(titleMain);
  scene.tweens.add({
    targets: titleMain,
    scale: 1.025,
    alpha: 0.88,
    duration: 1100,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });

  scene.startScreen.buttons = [];
  const buttonLabels = ['PLAY', 'LEADERBOARD', 'CONTROLS'];
  for (let i = 0; i < buttonLabels.length; i += 1) {
    const y = 232 + i * 50;
    const bg = scene.add.rectangle(GAME_WIDTH / 2, y, 280, 42, COLORS.cell, 0.95);
    bg.setStrokeStyle(2, COLORS.frame, 0.8);
    const label = scene.add
      .text(GAME_WIDTH / 2, y, buttonLabels[i], {
        fontFamily: 'monospace', fontSize: '22px', color: '#f7ffd8', fontStyle: 'bold',
      })
      .setOrigin(0.5);
    c.add(bg);
    c.add(label);
    scene.startScreen.buttons.push({ bg, label });
  }

  c.add(
    scene.add
      .text(GAME_WIDTH / 2, 380, 'SCOREBOARD', {
        fontFamily: 'monospace', fontSize: '14px', color: '#e1ff00', fontStyle: 'bold',
      })
      .setOrigin(0.5),
  );
  scene.startScreen.leaderboard = scene.add
    .text(GAME_WIDTH / 2, 402, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#f7ffd8', align: 'center', lineSpacing: 4,
    })
    .setOrigin(0.5, 0);
  c.add(scene.startScreen.leaderboard);

  c.add(
    scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 22, 'MOVE ↕   CONFIRM B / START', {
        fontFamily: 'monospace', fontSize: '11px', color: '#6f7a4a',
      })
      .setOrigin(0.5),
  );

  c.setVisible(false);
}

function showStartScreen(scene) {
  scene.state.phase = 'start';
  scene.state.menu = { cursor: 0, cooldown: 0, lastAxis: 0 };
  refreshStartScreenLeaderboard(scene);
  updateStartMenuHighlight(scene);
  scene.startScreen.container.setVisible(true);
}

function createLeaderboardScreen(scene) {
  scene.leaderScreen = {};
  const c = scene.add.container(0, 0);
  c.setDepth(16);
  scene.leaderScreen.container = c;

  c.add(scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.overlay, 0.98));
  c.add(
    scene.add
      .text(GAME_WIDTH / 2, 90, 'LEADERBOARD', {
        fontFamily: 'monospace', fontSize: '30px', color: '#e1ff00', fontStyle: 'bold',
      })
      .setOrigin(0.5),
  );

  scene.leaderScreen.list = scene.add
    .text(GAME_WIDTH / 2, 160, '', {
      fontFamily: 'monospace', fontSize: '20px', color: '#f7ffd8',
      align: 'center', lineSpacing: 12,
    })
    .setOrigin(0.5, 0);
  c.add(scene.leaderScreen.list);

  c.add(
    scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 28, 'PRESS START TO GO BACK', {
        fontFamily: 'monospace', fontSize: '12px', color: '#6f7a4a',
      })
      .setOrigin(0.5),
  );

  c.setVisible(false);
}

function createControlsScreen(scene) {
  scene.controlsScreen = {};
  const c = scene.add.container(0, 0);
  c.setDepth(16);
  scene.controlsScreen.container = c;

  c.add(scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.overlay, 0.98));
  c.add(
    scene.add
      .text(GAME_WIDTH / 2, 110, 'CONTROLS', {
        fontFamily: 'monospace', fontSize: '30px', color: '#e1ff00', fontStyle: 'bold',
      })
      .setOrigin(0.5),
  );

  const lines = [
    'P1   MOVE  A / D',
    'P1   DASH  U',
    '',
    'P2   MOVE  ← / →',
    'P2   DASH  R',
    '',
    'PAUSE      ENTER',
  ];
  c.add(
    scene.add
      .text(GAME_WIDTH / 2, 200, lines.join('\n'), {
        fontFamily: 'monospace', fontSize: '18px', color: '#f7ffd8',
        align: 'center', lineSpacing: 8,
      })
      .setOrigin(0.5, 0),
  );

  c.add(
    scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 28, 'PRESS START TO GO BACK', {
        fontFamily: 'monospace', fontSize: '12px', color: '#6f7a4a',
      })
      .setOrigin(0.5),
  );

  c.setVisible(false);
}

function showControlsScreen(scene) {
  scene.startScreen.container.setVisible(false);
  scene.controlsScreen.container.setVisible(true);
  scene.state.phase = 'controls';
}

function showLeaderboardScreen(scene) {
  const lines = scene.state.highScores.length
    ? scene.state.highScores.map((e, i) =>
        `${String(i + 1).padStart(2, '0')}  ${e.name.padEnd(3, ' ')}  ${String(e.score).padStart(3, ' ')}  ${e.winner}`,
      )
    : ['NO SAVED SCORES YET'];
  scene.leaderScreen.list.setText(lines.join('\n'));
  scene.startScreen.container.setVisible(false);
  scene.leaderScreen.container.setVisible(true);
  scene.state.phase = 'leaderboard';
}

function refreshStartScreenLeaderboard(scene) {
  const lines = scene.state.highScores.length
    ? scene.state.highScores.map((e, i) =>
        `${String(i + 1).padStart(2, '0')} ${e.name.padEnd(3, ' ')} ${String(e.score).padStart(2, '0')} ${e.winner}`,
      )
    : ['NO SAVED SCORES YET'];
  scene.startScreen.leaderboard.setText(lines.join('\n'));
}

function updateStartMenuHighlight(scene) {
  const cursor = scene.state.menu.cursor;
  scene.startScreen.buttons.forEach(({ bg, label }, i) => {
    const active = i === cursor;
    bg.setFillStyle(active ? COLORS.accent : COLORS.cell, active ? 1 : 0.95);
    bg.setStrokeStyle(2, active ? COLORS.white : COLORS.frame, active ? 1 : 0.8);
    label.setColor(active ? '#04110b' : '#f7ffd8');
  });
}

function handleStartMenu(scene, time) {
  const menu = scene.state.menu;
  const axisY = getVerticalMenuAxis(scene.controls);

  if (time >= menu.cooldown && axisY !== 0 && menu.lastAxis !== axisY) {
    menu.cursor = Phaser.Math.Wrap(menu.cursor + axisY, 0, scene.startScreen.buttons.length);
    menu.cooldown = time + 160;
    updateStartMenuHighlight(scene);
    playSound(scene, 'click');
  }
  if (axisY === 0) {
    menu.lastAxis = 0;
  } else {
    menu.lastAxis = axisY;
  }

  if (consumeAnyPressedControl(scene, ['P1_1', 'P2_1', 'P1_2', 'P2_2', 'START1', 'START2'])) {
    playSound(scene, 'select');
    startAmbientMusic(scene);
    if (menu.cursor === 0) {
      startMatch(scene);
    } else if (menu.cursor === 1) {
      showLeaderboardScreen(scene);
    } else {
      showControlsScreen(scene);
    }
  }
}

function createPauseScreen(scene) {
  scene.pauseScreen = {};
  const c = scene.add.container(0, 0);
  c.setDepth(25);
  scene.pauseScreen.container = c;

  c.add(scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.overlay, 0.82));
  c.add(
    scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 28, 'PAUSED', {
        fontFamily: 'monospace', fontSize: '52px', color: '#e1ff00', fontStyle: 'bold',
      })
      .setOrigin(0.5),
  );
  c.add(
    scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 34, 'PRESS START TO RESUME', {
        fontFamily: 'monospace', fontSize: '16px', color: '#a8ad8a',
      })
      .setOrigin(0.5),
  );

  c.setVisible(false);
}

function pauseMatch(scene) {
  scene.state.phase = 'paused';
  scene.physics.pause();
  scene.pauseScreen.container.setVisible(true);
}

function resumeMatch(scene) {
  scene.pauseScreen.container.setVisible(false);
  scene.physics.resume();
  scene.state.phase = 'playing';
}

function returnToStart(scene) {
  scene.state.winner = null;
  scene.state.nameEntry.letters = [];
  scene.endGame.container.setVisible(false);
  refreshLeaderboard(scene);
  showStartScreen(scene);
}

function configurePaddleBody(body) {
  body.setImmovable(true);
  body.allowGravity = false;
  body.setCollideWorldBounds(false);
}

function createBall(scene, x, y, color, startingOwner) {
  const ball = scene.add.circle(x, y, 7, color, 1);
  scene.physics.add.existing(ball);

  ball.body.setCircle(7);
  ball.body.setBounce(1, 1);
  ball.body.setCollideWorldBounds(false);
  ball.body.setAllowGravity(false);
  ball.body.setDrag(0, 0);
  ball.body.setMaxVelocity(340, 340);
  ball.glowColor = color;
  ball.lastTouchedBy = startingOwner;
  ball.ghostFor = { p1: false, p2: false };
  ball.previousY = y;

  return ball;
}

function buildTextBricks(scene) {
  scene.playfield.bricks.clear(true, true);

  // Hand-drawn 4×7 pixel font, grid 34×28, CELL_W=20 CELL_H=12
  // brickX = 60 + col*20 + 9   brickY = 132 + row*12 + 5
  // BUENOS rows 4-10 (letter_col: B=2 U=7 E=12 N=17 O=22 S=27)
  // AIRES  rows 16-22 (letter_col: A=5 I=10 R=15 E=20 S=25)
  const brickData = [
    // B
    [109,185,2],[129,185,3],[149,185,0],
    [109,197,3],[169,197,2],
    [109,209,0],[169,209,3],
    [109,221,1],[129,221,2],[149,221,3],
    [109,233,2],[169,233,1],
    [109,245,3],[169,245,2],
    [109,257,0],[129,257,1],[149,257,2],
    // U
    [209,185,3],[269,185,2],
    [209,197,0],[269,197,3],
    [209,209,1],[269,209,0],
    [209,221,2],[269,221,1],
    [209,233,3],[269,233,2],
    [209,245,0],[269,245,3],
    [229,257,2],[249,257,3],
    // E
    [309,185,0],[329,185,1],[349,185,2],[369,185,3],
    [309,197,1],
    [309,209,2],
    [309,221,3],[329,221,0],[349,221,1],
    [309,233,0],
    [309,245,1],
    [309,257,2],[329,257,3],[349,257,0],[369,257,1],
    // N
    [409,185,1],[469,185,0],
    [409,197,2],[429,197,3],[469,197,1],
    [409,209,3],[449,209,1],[469,209,2],
    [409,221,0],[469,221,3],
    [409,233,1],[469,233,0],
    [409,245,2],[469,245,1],
    [409,257,3],[469,257,2],
    // O
    [529,185,3],[549,185,0],
    [509,197,3],[569,197,2],
    [509,209,0],[569,209,3],
    [509,221,1],[569,221,0],
    [509,233,2],[569,233,1],
    [509,245,3],[569,245,2],
    [529,257,1],[549,257,2],
    // S
    [629,185,0],[649,185,1],[669,185,2],
    [609,197,0],
    [609,209,1],
    [629,221,3],[649,221,0],
    [669,233,2],
    [669,245,3],
    [609,257,1],[629,257,2],[649,257,3],
    // A
    [189,329,2],[209,329,3],
    [169,341,2],[229,341,1],
    [169,353,3],[229,353,2],
    [169,365,0],[189,365,1],[209,365,2],[229,365,3],
    [169,377,1],[229,377,0],
    [169,389,2],[229,389,1],
    [169,401,3],[229,401,2],
    // I
    [269,329,2],[289,329,3],[309,329,0],[329,329,1],
    [289,341,0],[309,341,1],
    [289,353,1],[309,353,2],
    [289,365,2],[309,365,3],
    [289,377,3],[309,377,0],
    [289,389,0],[309,389,1],
    [269,401,0],[289,401,1],[309,401,2],[329,401,3],
    // R
    [369,329,3],[389,329,0],[409,329,1],
    [369,341,0],[429,341,3],
    [369,353,1],[429,353,0],
    [369,365,2],[389,365,3],[409,365,0],
    [369,377,3],[389,377,0],
    [369,389,0],[409,389,2],
    [369,401,1],[429,401,0],
    // E
    [469,329,0],[489,329,1],[509,329,2],[529,329,3],
    [469,341,1],
    [469,353,2],
    [469,365,3],[489,365,0],[509,365,1],
    [469,377,0],
    [469,389,1],
    [469,401,2],[489,401,3],[509,401,0],[529,401,1],
    // S
    [589,329,2],[609,329,3],[629,329,0],
    [569,341,2],
    [569,353,3],
    [589,365,1],[609,365,2],
    [629,377,0],
    [629,389,1],
    [569,401,3],[589,401,0],[609,401,1],
  ];

  const colors = [COLORS.brickA, COLORS.brickB, COLORS.brickC, COLORS.brickD];

  for (const [bx, by, ci] of brickData) {
    const brick = scene.add.rectangle(bx, by, 18, 10, colors[ci], 1);
    brick.setStrokeStyle(1, COLORS.cell, 0.7);
    scene.physics.add.existing(brick, true);
    scene.playfield.bricks.add(brick);
  }

  scene.state.remainingBricks = scene.playfield.bricks.countActive(true);
}

function resetBalls(scene) {
  const [topBall, bottomBall] = scene.playfield.balls;

  topBall.setPosition(GAME_WIDTH / 2 - 110, 170);
  bottomBall.setPosition(GAME_WIDTH / 2 + 110, GAME_HEIGHT - 170);

  topBall.lastTouchedBy = 'p1';
  bottomBall.lastTouchedBy = 'p2';
  topBall.ghostFor = { p1: false, p2: false };
  bottomBall.ghostFor = { p1: false, p2: false };
  topBall.previousY = topBall.y;
  bottomBall.previousY = bottomBall.y;
  topBall.setAlpha(1);
  bottomBall.setAlpha(1);

  topBall.body.setVelocity(190, 210);
  bottomBall.body.setVelocity(-190, -210);
}

function updatePaddles(scene, delta, time) {
  const paddleSpeed = 320;
  const dashSpeed = 1500;
  const dashDuration = 110;
  const dashCooldown = 750;
  const p1Body = scene.playfield.p1Paddle.body;
  const p2Body = scene.playfield.p2Paddle.body;
  const deltaSeconds = delta / 1000;

  let p1Dir = 0;
  if (isControlHeld(scene, 'P1_L')) p1Dir -= 1;
  if (isControlHeld(scene, 'P1_R')) p1Dir += 1;

  let p2Dir = 0;
  if (isControlHeld(scene, 'P2_L')) p2Dir -= 1;
  if (isControlHeld(scene, 'P2_R')) p2Dir += 1;

  tryStartDash(scene, 'p1', 'P1_1', p1Dir, time, dashDuration, dashCooldown);
  tryStartDash(scene, 'p2', 'P2_1', p2Dir, time, dashDuration, dashCooldown);

  let p1Velocity = p1Dir * paddleSpeed;
  let p2Velocity = p2Dir * paddleSpeed;

  if (time < scene.state.dash.p1.activeUntil) {
    p1Velocity = scene.state.dash.p1.dir * dashSpeed;
  }
  if (time < scene.state.dash.p2.activeUntil) {
    p2Velocity = scene.state.dash.p2.dir * dashSpeed;
  }

  p1Body.setVelocityX(0);
  p2Body.setVelocityX(0);

  scene.playfield.p1Paddle.setX(
    Phaser.Math.Clamp(
      scene.playfield.p1Paddle.x + p1Velocity * deltaSeconds,
      110,
      GAME_WIDTH - 110,
    ),
  );
  scene.playfield.p2Paddle.setX(
    Phaser.Math.Clamp(
      scene.playfield.p2Paddle.x + p2Velocity * deltaSeconds,
      110,
      GAME_WIDTH - 110,
    ),
  );

  if (typeof p1Body.updateFromGameObject === 'function') {
    p1Body.updateFromGameObject();
  }
  if (typeof p2Body.updateFromGameObject === 'function') {
    p2Body.updateFromGameObject();
  }
}

function tryStartDash(scene, playerKey, buttonCode, dir, time, duration, cooldown) {
  if (!scene.controls.pressed[buttonCode]) return;
  scene.controls.pressed[buttonCode] = false;
  if (dir === 0) return;
  const dashState = scene.state.dash[playerKey];
  if (time < dashState.cooldownUntil) return;
  dashState.dir = dir;
  dashState.activeUntil = time + duration;
  dashState.cooldownUntil = time + cooldown;
  playSound(scene, 'dash');
  spawnDashTrail(scene, playerKey, dir);
}

function spawnDashTrail(scene, playerKey, dir) {
  const paddle =
    playerKey === 'p1' ? scene.playfield.p1Paddle : scene.playfield.p2Paddle;
  const color = playerKey === 'p1' ? COLORS.p1 : COLORS.p2;
  const trail = scene.add.rectangle(paddle.x, paddle.y, paddle.width, paddle.height, color, 0.6);
  scene.tweens.add({
    targets: trail,
    x: paddle.x - dir * 50,
    alpha: 0,
    scaleX: 0.4,
    duration: 260,
    onComplete: () => trail.destroy(),
  });
}

function updateBallGhostStates(scene) {
  const topLine = scene.playfield.p1Paddle.y;
  const bottomLine = scene.playfield.p2Paddle.y;

  for (const ball of scene.playfield.balls) {
    const previousY = typeof ball.previousY === 'number' ? ball.previousY : ball.y;
    const currentY = ball.y;

    if (!ball.ghostFor.p1 && previousY >= topLine && currentY < topLine) {
      ball.ghostFor.p1 = true;
      animatePenaltyCounter(scene, 'p1');
      playSound(scene, 'penalty');
    } else if (ball.ghostFor.p1 && previousY <= topLine && currentY > topLine) {
      ball.ghostFor.p1 = false;
    }

    if (!ball.ghostFor.p2 && previousY <= bottomLine && currentY > bottomLine) {
      ball.ghostFor.p2 = true;
      animatePenaltyCounter(scene, 'p2');
      playSound(scene, 'penalty');
    } else if (
      ball.ghostFor.p2 &&
      previousY >= bottomLine &&
      currentY < bottomLine
    ) {
      ball.ghostFor.p2 = false;
    }

    ball.setAlpha(ball.ghostFor.p1 || ball.ghostFor.p2 ? 0.45 : 1);
    ball.previousY = currentY;
  }
}

function checkBallEscape(scene) {
  for (const ball of scene.playfield.balls) {
    const escaped =
      !isFinite(ball.x) || !isFinite(ball.y) ||
      ball.x < 10 || ball.x > GAME_WIDTH - 10 ||
      ball.y < 10 || ball.y > GAME_HEIGHT - 10;
    if (!escaped) {
      continue;
    }
    // Ball slipped out — respawn it near centre heading toward the field
    const vy = ball.lastTouchedBy === 'p1' ? 220 : -220;
    const vx = Phaser.Math.Between(-160, 160);
    ball.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    ball.ghostFor = { p1: false, p2: false };
    ball.previousY = GAME_HEIGHT / 2;
    ball.setAlpha(1);
    ball.body.setVelocity(vx, vy);
  }
}

function canBallCollideWithPaddle(ball, playerKey) {
  return ball.active && !ball.ghostFor?.[playerKey];
}

function updateBallTrails(scene, time) {
  if (time % 3 > 1) {
    return;
  }

  for (const ball of scene.playfield.balls) {
    const trail = scene.add.circle(ball.x, ball.y, 4, ball.glowColor, 0.2);
    scene.playfield.ballTrails.add(trail);

    scene.tweens.add({
      targets: trail,
      alpha: 0,
      scaleX: 0.2,
      scaleY: 0.2,
      duration: 250,
      onComplete: () => trail.destroy(),
    });
  }
}

function handleBallPaddleCollision(scene, ball, paddle, playerKey) {
  ball.lastTouchedBy = playerKey;
  const ballColor = playerKey === 'p1' ? COLORS.p1 : COLORS.p2;
  ball.setFillStyle(ballColor);
  ball.glowColor = ballColor;

  const offset = (ball.x - paddle.x) / (paddle.width / 2);
  const currentSpeed = Math.min(ball.body.velocity.length() + 8, 330);
  const horizontalVelocity = Phaser.Math.Clamp(offset * 220, -220, 220);
  const verticalDirection = paddle === scene.playfield.p1Paddle ? 1 : -1;
  const verticalVelocity = Math.max(120, Math.sqrt(currentSpeed * currentSpeed - horizontalVelocity * horizontalVelocity));

  ball.body.setVelocity(horizontalVelocity, verticalVelocity * verticalDirection);
}

function handleBallBrickCollision(scene, ball, brick) {
  if (!brick.active) {
    return;
  }

  const brickX = brick.x;
  const brickY = brick.y;
  const brickHalfWidth = brick.width / 2;
  const brickHalfHeight = brick.height / 2;
  const deltaX = ball.x - brickX;
  const deltaY = ball.y - brickY;
  const normalizedX = Math.abs(deltaX) / Math.max(brickHalfWidth, 1);
  const normalizedY = Math.abs(deltaY) / Math.max(brickHalfHeight, 1);
  const speedX = Math.abs(ball.body.velocity.x);
  const speedY = Math.abs(ball.body.velocity.y);

  if (normalizedX > normalizedY) {
    ball.body.setVelocityX((deltaX >= 0 ? 1 : -1) * Math.max(speedX, 150));
    ball.setX(
      brickX +
        (deltaX >= 0 ? 1 : -1) * (brickHalfWidth + ball.width / 2 + 1),
    );
  } else {
    ball.body.setVelocityY((deltaY >= 0 ? 1 : -1) * Math.max(speedY, 150));
    ball.setY(
      brickY +
        (deltaY >= 0 ? 1 : -1) * (brickHalfHeight + ball.height / 2 + 1),
    );
  }

  if (typeof ball.body.updateFromGameObject === 'function') {
    ball.body.updateFromGameObject();
  }

  if (brick.body) {
    brick.body.enable = false;
  }
  scene.playfield.bricks.remove(brick);
  brick.destroy();
  scene.state.remainingBricks -= 1;

  if (ball.lastTouchedBy === 'p1') {
    scene.state.scores.p1 += 1;
  } else if (ball.lastTouchedBy === 'p2') {
    scene.state.scores.p2 += 1;
  }

  spawnBrickBurst(scene, brick.x, brick.y, brick.fillColor);
  playSound(scene, 'brick');
  refreshHud(scene);
  maybeFinishMatch(scene);
}

function startAmbientMusic(scene) {
  if (scene.state.musicStarted) {
    return;
  }
  scene.state.musicStarted = true;

  try {
    const ctx = scene.sound.context;
    if (!ctx) {
      return;
    }

    // Master output
    const out = ctx.createGain();
    out.gain.value = 0.18;
    out.connect(ctx.destination);

    // Feedback delay for space/depth
    const dly  = ctx.createDelay(2);
    const dlFb = ctx.createGain();
    dly.delayTime.value = 0.48;
    dlFb.gain.value = 0.28;
    dly.connect(dlFb);
    dlFb.connect(dly);
    dlFb.connect(out);

    // Pad — Am7 chord (A2 C3 E3 G3) through chorused detuned oscs + LP filter
    const padFilt = ctx.createBiquadFilter();
    padFilt.type = 'lowpass';
    padFilt.frequency.value = 800;
    padFilt.Q.value = 1.4;
    padFilt.connect(out);
    padFilt.connect(dly);

    // Very slow LFO sweeps the filter cutoff for movement
    const lfo  = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.value = 0.055;
    lfoG.gain.value = 430;
    lfo.connect(lfoG);
    lfoG.connect(padFilt.frequency);
    lfo.start();

    [
      [110, 0, 'sawtooth'], [110, 11, 'sawtooth'], [110, -11, 'sawtooth'],
      [130.81, 0, 'triangle'], [164.81, 5, 'triangle'], [196, -4, 'triangle'],
    ].forEach(([f, d, type]) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type = type;
      osc.frequency.value = f;
      osc.detune.value = d;
      g.gain.value = 0.028;
      osc.connect(g);
      g.connect(padFilt);
      osc.start();
    });

    // Arp — A minor pentatonic, up and back down
    const ARP  = [220, 261.63, 293.66, 329.63, 392, 440, 392, 329.63, 293.66, 261.63];
    const STEP = 0.43;
    const ALEN = ARP.length * STEP;

    function scheduleArp(t0) {
      ARP.forEach((freq, i) => {
        const t   = t0 + i * STEP;
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        osc.connect(g);
        g.connect(out);
        g.connect(dly);
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.048, t + 0.018);
        g.gain.exponentialRampToValueAtTime(0.0001, t + STEP * 0.65);
        osc.start(t);
        osc.stop(t + STEP * 0.72);
      });
      scene.time.delayedCall((ALEN - 0.06) * 1000, () => scheduleArp(t0 + ALEN));
    }

    // Sub-bass pulse on the beat (55 Hz sine, 120 bpm)
    const BEAT = 1.0;
    function scheduleBass(t) {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 55;
      osc.connect(g);
      g.connect(out);
      g.gain.setValueAtTime(0.28, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.55);
      scene.time.delayedCall(BEAT * 1000, () => scheduleBass(t + BEAT));
    }

    // Short high-pitched digital tick — every half-beat, offset for syncopation
    const TICK = 0.5;
    function scheduleTick(t) {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1320;
      osc.connect(g);
      g.connect(out);
      g.gain.setValueAtTime(0.028, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
      osc.start(t);
      osc.stop(t + 0.025);
      scene.time.delayedCall(TICK * 1000, () => scheduleTick(t + TICK));
    }

    const t0 = ctx.currentTime + 0.3;
    scheduleArp(t0);
    scheduleBass(t0);
    scheduleTick(t0 + 0.25);
  } catch (_) {}
}

function playSound(scene, type) {
  try {
    const ctx = scene.sound && scene.sound.context ? scene.sound.context : new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'brick') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'penalty') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.start(now);
      osc.stop(now + 0.38);
    } else if (type === 'click') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'dash') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.12);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'select') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch (_) {}
}

function spawnBrickBurst(scene, x, y, color) {
  for (let index = 0; index < 6; index += 1) {
    const particle = scene.add.rectangle(x, y, 4, 4, color, 1);
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const distance = Phaser.Math.Between(16, 42);

    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      alpha: 0,
      angle: Phaser.Math.Between(-90, 90),
      duration: Phaser.Math.Between(180, 320),
      onComplete: () => particle.destroy(),
    });
  }
}

function refreshHud(scene) {
  scene.hud.p1Score.setText(`P1 ${String(scene.state.scores.p1).padStart(2, '0')}`);
  scene.hud.p2Score.setText(`P2 ${String(scene.state.scores.p2).padStart(2, '0')}`);
  scene.hud.remaining.setText(`BRICKS ${String(scene.state.remainingBricks).padStart(3, '0')}`);
}

function animatePenaltyCounter(scene, playerKey) {
  const text =
    playerKey === 'p1' ? scene.hud.p1Score : scene.hud.p2Score;
  const baseColor =
    playerKey === 'p1'
      ? scene.hud.scoreColors.p1
      : scene.hud.scoreColors.p2;

  scene.tweens.killTweensOf(text);
  text.setColor(scene.hud.scoreColors.penalty);
  text.setScale(1);
  text.setAngle(0);

  scene.tweens.add({
    targets: text,
    scaleX: 1.12,
    scaleY: 1.12,
    angle: playerKey === 'p1' ? -6 : 6,
    duration: 90,
    yoyo: true,
    repeat: 1,
    onComplete: () => {
      text.setColor(baseColor);
      text.setScale(1);
      text.setAngle(0);
    },
  });
}

function maybeFinishMatch(scene) {
  const { p1, p2 } = scene.state.scores;
  const remaining = scene.state.remainingBricks;
  const leaderScore = Math.max(p1, p2);
  const trailingScore = Math.min(p1, p2);

  if (remaining === 0 || leaderScore >= trailingScore + remaining) {
    finishMatch(scene);
  }
}

function finishMatch(scene) {
  if (scene.state.phase !== 'playing') {
    return;
  }

  scene.state.phase = 'gameover';
  scene.physics.pause();
  scene.hud.status.setText('');

  const p1 = scene.state.scores.p1;
  const p2 = scene.state.scores.p2;
  const isTie = p1 === p2;

  scene.state.winner = isTie ? 'draw' : p1 > p2 ? 'p1' : 'p2';
  scene.state.winnerLabel =
    scene.state.winner === 'p1'
      ? 'PLAYER 1'
      : scene.state.winner === 'p2'
        ? 'PLAYER 2'
        : 'DRAW';

  scene.endGame.container.setVisible(true);
  scene.endGame.summary.setText(
    isTie
      ? `${p1}  :  ${p2}`
      : `${scene.state.winnerLabel}  ${Math.max(p1, p2)}  :  ${Math.min(p1, p2)}`,
  );
  scene.endGame.nameLabel.setText(
    isTie ? 'DRAW TAG' : 'INITIALS',
  );
  scene.endGame.saveStatus.setText(scene.state.saveStatus);

  scene.state.nameEntry.row = 0;
  scene.state.nameEntry.col = 0;
  scene.state.nameEntry.moveCooldownUntil = 0;
  scene.state.nameEntry.confirmCooldownUntil = 0;
  scene.state.nameEntry.lastMoveVector = { x: 0, y: 0 };
  refreshNameEntry(scene);
  updateLetterGridHighlight(scene);
}

function handleNameEntry(scene, time) {
  const axisX = getHorizontalMenuAxis(scene.controls);
  const axisY = getVerticalMenuAxis(scene.controls);
  const entry = scene.state.nameEntry;

  if (
    time >= entry.moveCooldownUntil &&
    (axisX !== 0 || axisY !== 0) &&
    (entry.lastMoveVector.x !== axisX || entry.lastMoveVector.y !== axisY)
  ) {
    moveLetterSelection(scene, axisX, axisY);
    entry.moveCooldownUntil = time + 160;
    playSound(scene, 'click');
  }

  if (axisX === 0 && axisY === 0) {
    entry.lastMoveVector = { x: 0, y: 0 };
  } else {
    entry.lastMoveVector = { x: axisX, y: axisY };
  }

  if (
    time >= entry.confirmCooldownUntil &&
    consumeAnyPressedControl(scene, ['P1_1', 'P2_1', 'P1_2', 'P2_2', 'START1', 'START2'])
  ) {
    entry.confirmCooldownUntil = time + 180;
    playSound(scene, 'select');
    activateCurrentLetter(scene);
  }
}

function getHorizontalMenuAxis(controls) {
  let axis = 0;
  if (controls.held.P1_L || controls.held.P2_L) {
    axis -= 1;
  }
  if (controls.held.P1_R || controls.held.P2_R) {
    axis += 1;
  }
  return Phaser.Math.Clamp(axis, -1, 1);
}

function getVerticalMenuAxis(controls) {
  let axis = 0;
  if (controls.held.P1_U || controls.held.P2_U) {
    axis -= 1;
  }
  if (controls.held.P1_D || controls.held.P2_D) {
    axis += 1;
  }
  return Phaser.Math.Clamp(axis, -1, 1);
}

function normalizeIncomingKey(key) {
  if (typeof key !== 'string' || key.length === 0) {
    return '';
  }

  if (key === ' ') {
    return 'space';
  }

  return key.toLowerCase();
}

function isControlHeld(scene, controlCode) {
  return scene.controls.held[controlCode] === true;
}

function consumeAnyPressedControl(scene, controlCodes) {
  for (const controlCode of controlCodes) {
    if (scene.controls.pressed[controlCode]) {
      scene.controls.pressed[controlCode] = false;
      return true;
    }
  }

  return false;
}

function moveLetterSelection(scene, axisX, axisY) {
  const entry = scene.state.nameEntry;

  if (axisY !== 0) {
    entry.row = Phaser.Math.Wrap(entry.row + axisY, 0, LETTER_GRID.length);
    entry.col = Math.min(entry.col, LETTER_GRID[entry.row].length - 1);
  }

  if (axisX !== 0) {
    entry.col = Phaser.Math.Wrap(entry.col + axisX, 0, LETTER_GRID[entry.row].length);
  }

  updateLetterGridHighlight(scene);
}

function updateLetterGridHighlight(scene) {
  const entry = scene.state.nameEntry;
  for (const item of scene.endGame.gridLabels) {
    const active = item.row === entry.row && item.col === entry.col;
    item.cell.setFillStyle(active ? COLORS.accent : COLORS.cell, active ? 1 : 0.95);
    item.cell.setStrokeStyle(2, active ? COLORS.white : COLORS.frame, active ? 1 : 0.8);
    item.label.setColor(active ? '#04110b' : '#f7ffd8');
  }
}

function activateCurrentLetter(scene) {
  const entry = scene.state.nameEntry;
  const selectedValue = LETTER_GRID[entry.row][entry.col];

  if (selectedValue === 'DEL') {
    entry.letters.pop();
    refreshNameEntry(scene);
    return;
  }

  if (selectedValue === 'END') {
    if (entry.letters.length === 0) {
      scene.endGame.saveStatus.setText('Pick at least one character before saving.');
      return;
    }

    submitHighScore(scene);
    return;
  }

  if (entry.letters.length >= WINNING_NAME_LENGTH) {
    entry.letters.shift();
  }

  entry.letters.push(selectedValue);
  refreshNameEntry(scene);
}

function refreshNameEntry(scene) {
  const letters = scene.state.nameEntry.letters.slice();
  while (letters.length < WINNING_NAME_LENGTH) {
    letters.push('_');
  }
  scene.endGame.nameValue.setText(letters.join(' '));
}

function submitHighScore(scene) {
  if (scene.state.phase !== 'gameover') {
    return;
  }

  const initials = scene.state.nameEntry.letters.join('').slice(0, WINNING_NAME_LENGTH) || '???';
  const winningScore =
    scene.state.winner === 'p1'
      ? scene.state.scores.p1
      : scene.state.winner === 'p2'
        ? scene.state.scores.p2
        : scene.state.scores.p1;

  const entry = {
    name: initials,
    winner: scene.state.winnerLabel,
    score: winningScore,
    detail: `${scene.state.scores.p1}-${scene.state.scores.p2}`,
    savedAt: new Date().toISOString().slice(0, 10),
  };

  scene.state.saveStatus = `Saved ${initials}! Press START to play again.`;
  scene.endGame.saveStatus.setText(scene.state.saveStatus);
  scene.state.phase = 'saved';

  persistHighScore(entry)
    .then((nextScores) => {
      scene.state.highScores = nextScores;
      refreshLeaderboard(scene);
    })
    .catch(() => {
      scene.state.saveStatus = 'Could not save the score, but the game result stands.';
      if (scene.state.phase === 'saved') {
        scene.endGame.saveStatus.setText(scene.state.saveStatus);
      }
    });
}

function refreshLeaderboard(scene) {
  const lines = scene.state.highScores.length
    ? scene.state.highScores.map((entry, index) => {
        const rank = String(index + 1).padStart(2, '0');
        const score = String(entry.score).padStart(2, '0');
        return `${rank} ${entry.name.padEnd(3, ' ')} ${score} ${entry.winner}`;
      })
    : ['NO SAVED SCORES YET'];

  scene.endGame.leaderboard.setText(lines.join('\n'));
}

async function persistHighScore(entry) {
  const existing = await loadHighScores();
  const nextScores = existing
    .concat(entry)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.savedAt < right.savedAt ? 1 : -1;
    })
    .slice(0, MAX_HIGH_SCORES);

  await storageSet(STORAGE_KEY, nextScores);
  return nextScores;
}

async function loadHighScores() {
  const result = await storageGet(STORAGE_KEY);
  if (!result.found || !Array.isArray(result.value)) {
    return [];
  }

  return result.value.filter(isHighScoreEntry).slice(0, MAX_HIGH_SCORES);
}

function isHighScoreEntry(value) {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.name === 'string' &&
    typeof value.winner === 'string' &&
    typeof value.score === 'number' &&
    typeof value.detail === 'string' &&
    typeof value.savedAt === 'string'
  );
}

function getStorage() {
  if (window.platanusArcadeStorage) {
    return window.platanusArcadeStorage;
  }

  return {
    async get(key) {
      try {
        const raw = window.localStorage.getItem(key);
        return raw === null
          ? { found: false, value: null }
          : { found: true, value: JSON.parse(raw) };
      } catch {
        return { found: false, value: null };
      }
    },
    async set(key, value) {
      window.localStorage.setItem(key, JSON.stringify(value));
    },
};
}

async function storageGet(key) {
  return getStorage().get(key);
}

async function storageSet(key, value) {
  return getStorage().set(key, value);
}
