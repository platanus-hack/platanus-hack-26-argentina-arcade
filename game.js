const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

const TUNING = {
  P: {
    JV: -500,
    DDV: 700,
    DDB: -300,
    WS: 220,
    DS: 500,
    DD: 150,
    DC: 500,
    DT: 200,
    IA: 2000,
    IP: 5000,
    JR: 3000,
    JI: 3,
    JM: 6,
    HI: 3,
    HM: 6,
  },
  W: {
    GSS: 150,
    GSM: 450,
    GSA: 0.5,
    FED: 3000,
  },
  B: {
    H1: 30,
    H2: 60,
    HL: 15,
    SL: 30,
    PC: 4000,
    BS: 320,
    BP: 300,
    BT: 380,
  },
  S: {
    BS: 600,

    HI2: 400,
    HD: 1.0,

    AI: 100,
    AD: 0.4,

    TI: 450,
    TD: 0.8,
    TS: 20,

    PMN: 200,
    PMD: 600,
    PMX: 1000,
    DMN: 2.0,
    DMD: 6.0,
    DMX: 10.5,
    SMN: 8,
    SMD: 14,
    SMX: 24,
  },
  E: {
    F1: 2500,
    F2: 3000,
    BD: 300,
    BS: 350,
    SN1: 2500,
    SN2: 6000,
    SSF: 15,
  },
  A: {
    L1: 300,
    L2: 500,
    BS: 450,
  },
};

const COLORS = {
  background: 0x000000,
  textHighlight: '#ffff00',


  player: 0x00ffff,


  platform: 0x00ff66,
  platformMoving: 0x00ccff,


  spike: 0xff0033,


  enemyL1: 0xff3300,
  enemyL2: 0xff6600,
  enemyL3: 0xffaa00,


  airTriangle: 0xff0088,


  enemyBullet: 0xff0044,


  powerupJump: 0x00ff88,
  powerupHealth: 0xff3333,
  powerupInvune: 0x0066ff,


  weaponHoming: 0x00ffff,
  weaponAuto: 0xff8800,
  weaponTriple: 0xff00ff,
  weaponPierce: 0xff2200,
  weaponPierceMed: 0xff6600,
  weaponPierceMax: 0xffffff,
};

const WEAPON_COLORS = {
  homing: COLORS.weaponHoming,
  auto: COLORS.weaponAuto,
  triple: COLORS.weaponTriple,
  pierce: COLORS.weaponPierce,
};

const WEAPON_UI = {
  homing: { name: '◆ HOMING', color: '#00ffff' },
  auto: { name: '◆ AUTO', color: '#ff8800' },
  triple: { name: '◆ TRIPLE', color: '#ff00ff' },
  pierce: { name: '◆ PIERCE', color: '#ff2200' },
};

const WEAPON_MODES = ['homing', 'auto', 'triple', 'pierce'];

const STAR_LAYERS = [
  { speedMul: 0.10, color: 0xffffff, useCircle: false },
  { speedMul: 0.25, color: 0xddffff, useCircle: false },
  { speedMul: 0.45, color: 0xffffff, useCircle: true },
];




const CABINET_KEYS = {
  P1_U: ['w'],
  P1_D: ['s'],
  P1_L: ['a'],
  P1_R: ['d'],
  P1_1: ['u', 'e', 'z'],
  P1_2: ['i'],
  P1_3: ['o'],
  P1_4: ['j'],
  P1_5: ['k'],
  P1_6: ['l'],
  P2_U: ['ArrowUp'],
  P2_D: ['ArrowDown'],
  P2_L: ['ArrowLeft'],
  P2_R: ['ArrowRight'],
  P2_1: ['r'],
  P2_2: ['t'],
  P2_3: ['y'],
  P2_4: ['f'],
  P2_5: ['g'],
  P2_6: ['h'],
  START1: ['Enter', ' '],
  START2: ['2', 'Escape'],
};

const KEYBOARD_TO_ARCADE = {};
for (const [arcadeCode, keys] of Object.entries(CABINET_KEYS)) {
  for (const key of keys) {
    let normalized = key;
    if (normalized.length === 1 && normalized !== ' ') {
      normalized = normalized.toLowerCase();
    }
    KEYBOARD_TO_ARCADE[normalized] = arcadeCode;
  }
}

const Audio=(()=>{let c,g,e,s=0;function C(){if(!c){c=new(window.AudioContext||window.webkitAudioContext)();g=c.createGain();g.gain.value=1;g.connect(c.destination)}if(c.state==='suspended')c.resume();return c}function T(f,d=.1,t='sine',a=.1,to=0,dl=0){try{let x=C(),o=x.createOscillator(),n=x.createGain();o.connect(n);n.connect(g);o.type=t;o.frequency.setValueAtTime(f,x.currentTime+dl);if(to)o.frequency.linearRampToValueAtTime(to,x.currentTime+dl+d);n.gain.setValueAtTime(a,x.currentTime+dl);n.gain.linearRampToValueAtTime(0,x.currentTime+dl+d);o.start(x.currentTime+dl);o.stop(x.currentTime+dl+d)}catch(_){}}function N(d=.1,a=.1,f=1200,dl=0){try{let x=C(),z=Math.floor(x.sampleRate*d),b=x.createBuffer(1,z,x.sampleRate),m=b.getChannelData(0);for(let i=0;i<z;i++)m[i]=Math.random()*2-1;let o=x.createBufferSource(),q=x.createBiquadFilter(),n=x.createGain();o.buffer=b;q.type='bandpass';q.frequency.value=f;n.gain.setValueAtTime(a,x.currentTime+dl);n.gain.linearRampToValueAtTime(0,x.currentTime+dl+d);o.connect(q);q.connect(n);n.connect(g);o.start(x.currentTime+dl)}catch(_){}}function B(){if(!c||c.state==='suspended')return;let k=bossState&&bossSection==4?3:bossState||currentSection>2?2:currentSection?1:0,d=[200,175,140,110][k],f=[[110,0,130,0,110,146,130,123],[110,130,146,165,146,130,123,98],[82,110,123,146,165,146,123,110],[55,82,110,146,220,196,165,146]][k][s++&7];if(e.delay!==d)e.delay=d;T(f,.12,k>1?'sawtooth':'triangle',k==3?.45:k==2?.3:k?.45:.5);if(!(s&3))N(.03,k?.5:.3,60)}return{startBGM(sc){if(!e)e=sc.time.addEvent({delay:200,loop:true,callback:B})},stopBGM(){if(e){e.remove();e=null}},jump(){T(280,.12,'square',.08,520)},doubleJump(){T(400,.08,'square',.1,800);T(500,.12,'sine',.08,1000,.05)},land(){T(80,.08,'sine',.06,60)},dash(){T(600,.1,'sawtooth',.08,200)},downDash(){T(800,.14,'sawtooth',.1,150)},hurt(){N(.15,.14,800);T(150,.2,'sine',.1,80,.04)},die(){N(.35,.18,400);T(200,.45,'sine',.14,60)},deathPulse(){T(800,.35,'sine',.14,200)},shootHoming(){T(600,.05,'sine',.06,500)},shootAuto(){T(900,.04,'square',.03,700)},shootTriple(){T(500,.04,'sine',.05);T(620,.04,'sine',.05,0,.02);T(740,.04,'sine',.05,0,.04)},pierceCharge(l){T([0,400,600,1000][l]||400,.08,'sawtooth',.03*l)},pierceShoot(l){let f=[0,500,700,1200][l]||500;T(f,.18,'sawtooth',.15,f*.5);if(l==3)N(.12,.1,2800)},enemyShoot(){T(300,.07,'square',.05,200)},enemyDie(){N(.16,.12,1200);T(200,.2,'sine',.07,80)},bossEnter(){T(80,.9,'sawtooth',.18,60);N(.6,.08,200)},bossHurt(){T(400,.09,'square',.09,300)},bossDie(){for(let i=0;i<4;i++)T(120+90*i,.25,'sawtooth',.15-.02*i,320+90*i,.2*i);N(1,.22,600)},powerup(){T(400,.08,'sine',.08);T(550,.08,'sine',.08,0,.07);T(700,.08,'sine',.08,0,.14)},sectionChange(){T(300,.3,'sine',.1,600)},leaderboardChar(){T(440,.05,'square',.05,520)}}})();

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-root',
  backgroundColor: '#050508',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
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

let controls = { held: {}, pressed: {} };


let ui = {};
let player;
let platforms;
let spikes;
let playerBullets;
let enemies;
let enemyBullets;
let powerups;
let airTriangles;
let lastFireTime = 0;
let nextEnemyTime = 0;
let gameSpeed = TUNING.W.GSS;
let nextPlatformX = 0;
let playTime = 0;
const playerState = {
  state: 'idle',
  j: { c: TUNING.P.JI, m: TUNING.P.JI, t: 0 },
  h: { c: TUNING.P.HI, m: TUNING.P.HI },
  d: { au: 0, cu: 0, di: 0, tl: 0, tr: 0 },
  iu: 0,
  pierce: { cg: false, cs: 0, cl: 0, pl: 0 },
  canBeHit() { return playTime >= this.iu; },
  setState(newState) { this.state = newState; },
  reset() {
    this.state = 'idle';
    this.j.c = TUNING.P.JI;
    this.j.m = TUNING.P.JI;
    this.j.t = 0;
    this.h.c = TUNING.P.HI;
    this.h.m = TUNING.P.HI;
    this.d.au = 0;
    this.d.cu = 0;
    this.d.di = 0;
    this.d.tl = 0;
    this.d.tr = 0;
    this.iu = 0;
    this.pierce.cg = false;
    this.pierce.cs = 0;
    this.pierce.cl = 0;
    this.pierce.pl = 0;
  }
};
let shootMode = 'homing';

const SECTIONS = [
  { color: 0x002244, duration: 8000, speedFloor: 150, mechanics: [] },
  { color: 0x884400, duration: 25000, speedFloor: 170, mechanics: ['spikes', 'enemies'] },
  { color: 0x666600, duration: 30000, speedFloor: 190, mechanics: ['spikes', 'enemies', 'moving'] },
  { color: 0x004400, duration: 35000, speedFloor: 210, mechanics: ['spikes', 'enemies', 'moving', 'triangles'] },
  { color: 0x440000, duration: 40000, speedFloor: 230, mechanics: ['spikes', 'enemies', 'moving', 'triangles'] }
];

const SECTION_RGB = SECTIONS.map(s => Phaser.Display.Color.IntegerToRGB(s.color));

let currentSection = 0;
let sectionProgress = 0.0;
let pendingBonusPowerup = false;
let sectionTimer = 0;
let currentThemeColorRGB = null;
let lastPlatformRedrawColor = -1;


let enemiesDefeated = 0;
let currentScore = 0;

let playerDying = false; // true mientras la animación de muerte está activa
let bossState = null;
let boss = null;
let bossHp = 0;
let bossHpMax = TUNING.B.H1;
let bossPattern = 0;
let bossNextAction = 0;
let bossSection = 0;
let loopCount = 0;
let scoresReturnState = 'start';

const NAME_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
let nameLetters = [0, 0, 0];
let nameCursor = 0;


let wasOnGround = false;
let landingSquashTime = 0;
let lastGroundTime = 0;
const COYOTE_TIME_MS = 150;
let playerTrail = [];
const PLAYER_TRAIL_MAX = 14;
const PLAYER_TRAIL_LIFE = 280;
let playerTrailGfx = null;


let bgStarsNear = [];
let bgStarsMid = [];
let bgStarsFar = [];


function getWeaponColor(mode) {
  return WEAPON_COLORS[mode] || COLORS.weaponHoming;
}

function updateWeaponUI() {
  const info = WEAPON_UI[shootMode] || WEAPON_UI.homing;
  ui.smt.setText(info.name).setColor(info.color);
}

function showWeaponChangeIndicator(scene, name, color) {
  let txt = scene.add.text(player.x, player.y - 40, name, {
    fontSize: '18px', fontFamily: 'Arial', color, fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(250);
  scene.tweens.add({
    targets: txt, y: player.y - 80, alpha: 0,
    duration: 1500, ease: 'Power2',
    onComplete: () => txt.destroy()
  });
}


function drawPlayerNeon(g, color, scaleX, scaleY) {
  g.clear();
  let rx = 14 * scaleX, ry = 14 * scaleY;
  g.lineStyle(8, color, 0.35); g.strokeEllipse(0, 0, rx * 2, ry * 2);
  g.lineStyle(3, color, 1); g.strokeEllipse(0, 0, rx * 2, ry * 2);
}

function computeSlimeTransform() {
  let scaleX = 1.0, scaleY = 1.0;
  let color = getWeaponColor(shootMode);
  let velY = player.body.velocity.y;
  let onGround = player.body.touching.down;
  if (playerState.state === 'dashing') { scaleX = 1.25; scaleY = 0.78; }
  else if (playerState.state === 'downDashing') { scaleX = 0.82; scaleY = 1.25; }
  else if (!onGround) {
    if (velY < -100) { scaleX = 0.88; scaleY = 1.15; }
    else if (velY > 200) { scaleX = 0.92; scaleY = 1.18; }
  } else { scaleX = 1.08; scaleY = 0.93; }
  if (landingSquashTime > 0) {
    let t = (playTime - landingSquashTime) / 200;
    if (t < 1) { let squash = Math.sin(t * Math.PI) * 0.22; scaleX *= (1 + squash); scaleY *= (1 - squash); }
    else { landingSquashTime = 0; }
  }
  if (shootMode === 'pierce' && playerState.pierce.cg) {
    let lvl = playerState.pierce.cl;
    let pulse = 1 + Math.sin(playTime * 0.015) * 0.05 * (lvl + 1);
    scaleX *= pulse; scaleY *= pulse;
    color = [COLORS.weaponPierce, COLORS.weaponPierce, COLORS.weaponPierceMed, COLORS.weaponPierceMax][lvl];
  }
  return { scaleX, scaleY, color };
}

function updatePlayerTrail(scene, color, delta = 16) {
  playerTrail.push({ x: player.x, y: player.y, born: playTime, color });
  if (playerTrail.length > PLAYER_TRAIL_MAX) playerTrail.shift();
  playerTrailGfx.clear();
  for (let i = 0; i < playerTrail.length; i++) {
    let pt = playerTrail[i];
    pt.x -= gameSpeed * (delta / 1000);
    let age = playTime - pt.born;
    if (age > PLAYER_TRAIL_LIFE) continue;
    let ratio = 1 - age / PLAYER_TRAIL_LIFE;
    playerTrailGfx.lineStyle(3, pt.color, ratio * 0.35);
    playerTrailGfx.strokeCircle(pt.x, pt.y, 12 * ratio * 0.9);
  }
}


function updateBackground(scene, delta) {
  ui.bsg.clear();
  const dt = delta / 1000;
  const layers = [
    [bgStarsFar, STAR_LAYERS[0]],
    [bgStarsMid, STAR_LAYERS[1]],
    [bgStarsNear, STAR_LAYERS[2]],
  ];
  for (const [stars, cfg] of layers) {
    const speed = gameSpeed * cfg.speedMul * dt;
    for (const star of stars) {
      star.x -= speed;
      if (star.x < 0) {
        star.x = GAME_WIDTH;
        star.y = Math.random() * GAME_HEIGHT;
      }
      ui.bsg.fillStyle(cfg.color, star.alpha);
      if (cfg.useCircle) ui.bsg.fillCircle(star.x, star.y, star.size);
      else ui.bsg.fillRect(star.x, star.y, star.size, star.size);
    }
  }
}



function createEnemyBullet(scene, x, y, vx, vy) {
  let b = scene.add.rectangle(x, y, 10, 10, 0xffffff).setDepth(50);
  b.setBlendMode(Phaser.BlendModes.ADD);
  enemyBullets.add(b);
  scene.physics.add.existing(b);
  b.body.allowGravity = false;
  b.body.setVelocity(vx, vy);
  return b;
}

function createPlayerBullet(scene, type, angleRad, cl) {
  let color = getWeaponColor(shootMode);
  let bullet;

  if (type === 'homing') {
    bullet = scene.add.circle(player.x + 15, player.y, 5, color);
  } else if (type === 'auto') {
    bullet = scene.add.rectangle(player.x + 15, player.y, 14, 5, color);
  } else if (type === 'triple') {
    bullet = scene.add.triangle(player.x + 15, player.y, 0, -5, 14, 0, 0, 5, color);
    if (angleRad) bullet.setRotation(angleRad);
  } else if (type === 'pierce') {
    let size = TUNING.S.SMN;
    let damage = TUNING.S.DMN;
    if (cl === 2) { size = TUNING.S.SMD; damage = TUNING.S.DMD; color = COLORS.weaponPierceMed; }
    else if (cl === 3) { size = TUNING.S.SMX; damage = TUNING.S.DMX; color = COLORS.weaponPierceMax; }
    bullet = scene.add.graphics({ x: player.x + 15, y: player.y });
    bullet.fillStyle(color, 1);
    bullet.fillTriangle(0, -size / 2, size / 2, 0, 0, size / 2);
    bullet.fillTriangle(0, -size / 2, -size / 2, 0, 0, size / 2);
    bullet.lineStyle(2, 0xffffff, 0.8);
    bullet.strokeTriangle(0, -size / 2, size / 2, 0, 0, size / 2);
    bullet.strokeTriangle(0, -size / 2, -size / 2, 0, 0, size / 2);
    bullet.setData('damage', damage);
    bullet.setData('pierce', true);
    bullet.setData('cl', cl);
    bullet.setData('hitTargets', new Set());
  }

  bullet.setBlendMode(Phaser.BlendModes.ADD);
  bullet.setDepth(50);
  playerBullets.add(bullet);
  scene.physics.add.existing(bullet);
  bullet.body.allowGravity = false;

  if (type === 'pierce') {
    let hs = cl === 3 ? TUNING.S.SMX : cl === 2 ? TUNING.S.SMD : TUNING.S.SMN;
    bullet.body.setSize(hs, hs);
    bullet.body.setOffset(-hs / 2, -hs / 2);
    bullet.body.setVelocityX(TUNING.S.BS);
  } else if (type === 'triple') {
    bullet.body.setVelocity(TUNING.S.BS * Math.cos(angleRad), TUNING.S.BS * Math.sin(angleRad));
    bullet.setData('damage', TUNING.S.TD);
  } else if (type === 'auto') {
    bullet.body.setVelocityX(TUNING.S.BS);
    bullet.setData('damage', TUNING.S.AD);
  } else {
    bullet.body.setVelocityX(TUNING.S.BS);
    bullet.setData('damage', TUNING.S.HD);
  }

  bullet.setData('type', type);
  return bullet;
}

function createPlatform(scene, x, y, width, opts = {}) {
  const { isMoving = false, color = COLORS.platform } = opts;
  let plat = scene.add.graphics({ x, y });
  plat.setData('isMoving', isMoving);
  plat.setData('width', width);
  plat.setData('color', color);
  plat.setDepth(5);
  plat.setBlendMode(Phaser.BlendModes.ADD);

  function redraw(col) {
    plat.clear();
    const w = width, h = 20;

    plat.fillStyle(col, 0.08);
    plat.fillRect(-w / 2, -h / 2, w, h);

    plat.lineStyle(6, col, 0.22); plat.strokeRect(-w / 2, -h / 2, w, h);
    plat.lineStyle(2.5, col, 1); plat.strokeRect(-w / 2, -h / 2, w, h);
  }
  redraw(color);
  plat._redraw = redraw;

  platforms.add(plat);
  scene.physics.add.existing(plat);
  plat.body.allowGravity = false;
  plat.body.immovable = true;
  plat.body.setSize(width, 20);
  plat.body.setOffset(-width / 2, -10);
  plat.body.checkCollision.down = false;
  plat.body.checkCollision.left = false;
  plat.body.checkCollision.right = false;

  if (isMoving) {
    scene.tweens.add({ targets: plat, y: plat.y - 80, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  return plat;
}

function createSpike(scene, x, y, width) {
  let spike = scene.add.graphics({ x, y });
  spike.setDepth(6);
  spike.setData('width', width);
  spike.setBlendMode(Phaser.BlendModes.ADD);

  const w = width;
  const spikeColor = COLORS.spike;

  const spikeW = 20, spikeH = 22;
  const baseY = 10;
  const tipY = baseY - spikeH;
  const count = Math.floor(w / spikeW);


  spike.lineStyle(7, spikeColor, 0.25);
  for (let i = 0; i < count; i++) {
    let tx = -w / 2 + i * spikeW + spikeW / 2;
    spike.beginPath();
    spike.moveTo(tx - spikeW / 2, baseY);
    spike.lineTo(tx, tipY);
    spike.lineTo(tx + spikeW / 2, baseY);
    spike.strokePath();
  }

  spike.lineStyle(2, spikeColor, 1);
  for (let i = 0; i < count; i++) {
    let tx = -w / 2 + i * spikeW + spikeW / 2;
    spike.beginPath();
    spike.moveTo(tx - spikeW / 2, baseY);
    spike.lineTo(tx, tipY);
    spike.lineTo(tx + spikeW / 2, baseY);
    spike.strokePath();
  }

  spikes.add(spike);
  scene.physics.add.existing(spike);
  spike.body.allowGravity = false;
  spike.body.immovable = true;

  spike.body.setSize(w - 4, spikeH - 4);
  spike.body.setOffset(-w / 2 + 2, tipY + 2);
  return spike;
}

function createPowerup(scene, x, y, type) {
  let pu;
  if (type === 0) pu = scene.add.triangle(x, y, 0, 15, 15, 15, 7.5, 0, COLORS.powerupJump);
  else if (type === 1) pu = scene.add.text(x, y, '❤️', { fontSize: '18px' }).setOrigin(0.5);
  else if (type === 2) pu = scene.add.triangle(x, y, 0, 0, 15, 0, 7.5, 15, 0x00ffff);
  else if (type === 3) pu = scene.add.triangle(x, y, 0, 0, 15, 0, 7.5, 15, 0xff00ff);
  else if (type === 4) pu = scene.add.triangle(x, y, 0, 0, 15, 0, 7.5, 15, 0xff8800);
  else pu = scene.add.star(x, y, 4, 5, 12, 0xff3333);
  powerups.add(pu);
  scene.physics.add.existing(pu);
  pu.body.allowGravity = false;
  pu.body.immovable = true;
  pu.setData('type', type);
  scene.tweens.add({ targets: pu, y: pu.y - 15, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return pu;
}

function createEnemy(scene, level) {
  const stats = {
    1: { r: 18, hp: 2, sides: 3, nc: COLORS.enemyL1 },
    2: { r: 22, hp: 4, sides: 4, nc: COLORS.enemyL2 },
    3: { r: 26, hp: 6, sides: 5, nc: COLORS.enemyL3 },
  }[level];
  let e = scene.add.graphics({ x: GAME_WIDTH + 50, y: Phaser.Math.Between(150, 450) });
  e.setBlendMode(Phaser.BlendModes.ADD);
  e.setDepth(10);
  e.ra = stats.r;
  e.rb = stats.r;
  e.bx = 1;

  e.vr = (Math.random() > 0.5 ? 1 : -1) * (0.012 + level * 0.008);
  e.rotOuter = Math.random() * Math.PI * 2;
  e.rotInner = Math.random() * Math.PI * 2;
  e.ft = Math.random() * 100;
  e.sides = stats.sides;
  e.nc = stats.nc;
  e.hp = stats.hp;
  e.level = level;

  enemies.add(e);
  scene.physics.add.existing(e);
  e.body.allowGravity = false;
  e.body.setSize(stats.r * 2, stats.r * 2);
  e.body.offset.set(-stats.r, -stats.r);
  e.lastFire = playTime + Phaser.Math.Between(1000, 2000);

  let targetX = GAME_WIDTH - 50 - Phaser.Math.Between(0, 40);
  scene.tweens.add({
    targets: e, x: targetX, duration: 800 + Phaser.Math.Between(0, 500), ease: 'Power2',
    onComplete: () => {
      scene.tweens.add({ targets: e, y: e.y + Phaser.Math.Between(-80, 80), duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  });
  return e;
}

function createAirTriangle(scene, y, level) {
  let sizes = { 1: 18, 2: 24, 3: 30 };
  let s = sizes[level] || 18;
  let color = COLORS.airTriangle;

  let tri = scene.add.graphics({ x: 870, y });
  tri.setDepth(15);
  tri.setBlendMode(Phaser.BlendModes.ADD);



  tri.lineStyle(8, color, 0.25);
  tri.beginPath();
  tri.moveTo(-s, 0);
  tri.lineTo(s, -s * 0.7);
  tri.lineTo(s, s * 0.7);
  tri.closePath();
  tri.strokePath();

  tri.fillStyle(color, 0.15);
  tri.fillPath();

  tri.lineStyle(2.5, color, 1);
  tri.beginPath();
  tri.moveTo(-s, 0);
  tri.lineTo(s, -s * 0.7);
  tri.lineTo(s, s * 0.7);
  tri.closePath();
  tri.strokePath();

  airTriangles.add(tri);
  scene.physics.add.existing(tri);
  tri.body.allowGravity = false;
  let speed = level === 1 ? TUNING.A.L1 : TUNING.A.L2;
  tri.body.setVelocityX(-speed);
  tri.body.setSize(s * 2, s * 2);
  tri.body.setOffset(-s, -s);
  tri.setData('level', level);
  tri.setData('fired', false);
  tri.setData('size', s);


  let emitterRef = scene.time.addEvent({
    delay: level === 1 ? 45 : (level === 2 ? 35 : 25),
    loop: true,
    callback: () => {
      if (!tri || !tri.active) { emitterRef.remove(); return; }

      let squareSize = s * 0.7 * (level === 1 ? 0.9 : level === 2 ? 1.0 : 1.1);
      let sq = scene.add.rectangle(tri.x + s, tri.y + Phaser.Math.Between(-3, 3), squareSize, squareSize, color);
      sq.setBlendMode(Phaser.BlendModes.ADD);
      sq.setDepth(14);
      sq.setAlpha(0.55);
      scene.tweens.add({
        targets: sq,
        alpha: 0, scaleX: 0.1, scaleY: 0.1,
        duration: 350, ease: 'Power2',
        onComplete: () => sq.destroy()
      });
    }
  });
  tri._emitterRef = emitterRef;
  return tri;
}

function spawnWarningRing(scene, x, y, delay) {
  scene.time.delayedCall(delay || 0, () => {
    let r = scene.add.graphics().setPosition(x, y).setDepth(80).setBlendMode(Phaser.BlendModes.ADD);
    r.lineStyle(2, 0xff0000, 0.8); r.strokeCircle(0, 0, 5);
    scene.tweens.add({ targets: r, scaleX: 10, scaleY: 10, alpha: 0, duration: 800, ease: 'Power2', onComplete: () => r.destroy() });
  });
}

function isMechanicActive(name) {
  return SECTIONS[currentSection].mechanics.includes(name);
}




function updateHealthHUD() {
  for (let i = 0; i < ui.hb.length; i++) {
    ui.hb[i].setText(i < playerState.h.c ? '❤️' : '🖤');
  }
}




function rebuildBarHUD(scene, key, newMax, createFn) {

  while (ui[key].length > newMax) ui[key].pop().destroy();

  while (ui[key].length < newMax) ui[key].push(createFn(scene, ui[key].length, newMax));

  if (key === 'hb') {
    for (let i = 0; i < ui.hb.length; i++) {
      ui.hb[i].setX(GAME_WIDTH / 2 - (newMax - 1) * 14 + i * 28);
    }
  }
}

function spawnDeathExplosion(scene, x, y, nc, count) {
  let c = count || 6;
  let flash = scene.add.circle(x, y, 24, 0xffffff, 0.85);
  flash.setBlendMode(Phaser.BlendModes.ADD).setDepth(155);
  scene.tweens.add({ targets: flash, alpha: 0, scale: 0.1, duration: 180, ease: 'Power2', onComplete: () => flash.destroy() });
  for (let i = 0; i < c; i++) {
    let ang = Math.random() * Math.PI * 2;
    let dist = Phaser.Math.Between(20, 80);
    let p = scene.add.circle(x, y, Phaser.Math.Between(2, 5), Math.random() < 0.4 ? 0xffffff : nc);
    p.setBlendMode(Phaser.BlendModes.ADD).setDepth(151);
    scene.tweens.add({ targets: p, x: x + Math.cos(ang) * dist, y: y + Math.sin(ang) * dist, alpha: 0, scale: 0, duration: Phaser.Math.Between(280, 500), ease: 'Power2', onComplete: () => p.destroy() });
  }
  let ring = scene.add.graphics({ x, y });
  ring.lineStyle(3, nc, 0.9); ring.strokeCircle(0, 0, 8);
  ring.setBlendMode(Phaser.BlendModes.ADD).setDepth(150);
  scene.tweens.add({ targets: ring, scaleX: 6, scaleY: 6, alpha: 0, duration: 350, ease: 'Power2', onComplete: () => ring.destroy() });
}



function spawnBoss(scene, sectionIdx) {
  bossSection = sectionIdx;
  bossState = 'entering';
  let isBoss2 = sectionIdx === 4;
  bossHpMax = (isBoss2 ? TUNING.B.H2 : TUNING.B.H1) + loopCount * TUNING.B.HL;
  bossHp = bossHpMax;
  bossPattern = 0;
  bossNextAction = 0;
  enemies.clear(true, true);
  enemyBullets.clear(true, true);
  let rb = isBoss2 ? 55 : 42;
  let nc = isBoss2 ? 0xff6600 : 0xff3333;
  boss = scene.add.graphics({ x: GAME_WIDTH + 60, y: GAME_HEIGHT / 2 - 50 });
  boss.setBlendMode(Phaser.BlendModes.ADD);
  boss.setDepth(20);
  boss.ra = rb;
  boss.bx = 1;
  boss.vr = (Math.random() > 0.5 ? 1 : -1) * 0.015;
  boss.ft = Math.random() * 100;
  boss.rb = rb;
  boss.nc = nc;
  boss.sides = isBoss2 ? 5 : 4;
  scene.tweens.add({
    targets: boss,
    x: GAME_WIDTH - 120,
    duration: 1200,
    ease: 'Power2',
    onComplete: () => {
      bossState = 'active';
      bossNextAction = playTime + 1500;
      Audio.bossEnter();
    }
  });

  // Mostrar nombre del boss
  let bossName = isBoss2 ? 'MEGAPLATANUS' : 'PLATANUS PRIME';
  ui.bn.setText(bossName).setVisible(true);
}

function killFinalBoss(scene) {
  if (bossState === 'dying') return;
  bossState = 'dying';
  currentState = 'cutscene';
  scene.physics.pause();
  Audio.bossDie();

  // Limpiar balas
  enemyBullets.clear(true, true);
  playerBullets.clear(true, true);

  // Paso 1: Boss se mueve al centro
  scene.tweens.add({
    targets: boss,
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    duration: 1200,
    ease: 'Power2',
    onComplete: () => {
      // Paso 2: Tiembla
      let shakeCount = 0;
      let shakeTimer = scene.time.addEvent({
        delay: 80,
        loop: true,
        callback: () => {
          if (!boss || !boss.active) { shakeTimer.remove(); return; }
          boss.x = GAME_WIDTH / 2 + Phaser.Math.Between(-8, 8);
          boss.y = GAME_HEIGHT / 2 + Phaser.Math.Between(-8, 8);
          boss.bx = 1 + shakeCount * 0.3;
          shakeCount++;
          if (shakeCount > 18) {
            shakeTimer.remove();
            // Paso 3: Explosiones en cadena
            spawnDeathExplosion(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2, 0xff6600, 20);
            scene.time.delayedCall(200, () => {
              spawnDeathExplosion(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2, 0xffffff, 12);
            });
            if (boss) { boss.destroy(); boss = null; }
            if (ui.bn) ui.bn.setVisible(false);
            scene.cameras.main.shake(500, 0.025);

            // Paso 4: Flash blanco que cubre todo
            let flash = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 1)
              .setOrigin(0, 0).setDepth(400);
            scene.time.delayedCall(700, () => {
              scene.tweens.add({
                targets: flash,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                  flash.destroy();
                  loopCount++;
                  currentState = 'playing';
                  currentSection = 0;
                  sectionTimer = 0;
                  sectionProgress = 0;
                  bossState = null;
                  bossHp = 0;
                  gameSpeed = SECTIONS[0].speedFloor + loopCount * TUNING.B.SL;
                  nextPlatformX = GAME_WIDTH + 200;
                  pendingBonusPowerup = true;
                  player.setPosition(200, 300);
                  player.body.setVelocity(0, 0);
                  playerState.h.c = playerState.h.m;
                  playerState.j.c = playerState.j.m;
                  updateHealthHUD();
                  platforms.clear(true, true);
                  spikes.clear(true, true);
                  powerups.clear(true, true);
                  enemies.clear(true, true);
                  enemyBullets.clear(true, true);
                  airTriangles.clear(true, true);
                  createPlatform(scene, GAME_WIDTH / 2, 550, GAME_WIDTH * 1.5, { color: SECTIONS[0].color });
                  scene.physics.resume();
                  Audio.sectionChange();
                }
              });
            });
          }
        }
      });
    }
  });
}

function killBoss(scene) {
  if (bossSection === 4) {
    killFinalBoss(scene);
    return;
  }
  if (bossState === 'dying') return;
  bossState = 'dying';
  Audio.bossDie();
  let bx = boss.x, by = boss.y;
  let bnc = boss.nc || 0xff6600;
  boss.destroy();
  boss = null;
  let flash = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 1).setOrigin(0, 0).setDepth(300);
  scene.tweens.add({ targets: flash, alpha: 0, duration: 600, onComplete: () => flash.destroy() });
  spawnDeathExplosion(scene, bx, by, bnc, 14);
  scene.time.delayedCall(1000, () => {
    ui.bn.setVisible(false);
    if (currentState !== 'playing') return;
    bossState = null;
    enemyBullets.clear(true, true);

    // Avance de sección normal (ya sabemos que bossSection !== 4 aquí)
    currentSection++;
    sectionTimer = 0;
    sectionProgress = 0;
    gameSpeed = Math.max(SECTIONS[currentSection].speedFloor + loopCount * TUNING.B.SL, gameSpeed * 0.8);
    pendingBonusPowerup = true;
    Audio.sectionChange();
    playerState.h.c = playerState.h.m;
    updateHealthHUD();
    let flash2 = scene.add.graphics();
    flash2.fillStyle(SECTIONS[currentSection].color, 1);
    flash2.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    flash2.setDepth(200);
    scene.tweens.add({ targets: flash2, alpha: 0, duration: 300, onComplete: () => flash2.destroy() });
  });
}

function executeBossPattern(scene) {
  if (!boss || !boss.active || bossState !== 'active') return;
  let numPatterns = bossSection === 4 ? 4 : 3;
  let pat = bossPattern % numPatterns;
  let rb2 = boss.rb || 42;
  scene.tweens.add({ targets: boss, ra: rb2 * 1.3, bx: 2.5, duration: 80, ease: 'Sine.easeOut', yoyo: true, hold: 30 });
  if (pat === 0) {
    spawnWarningRing(scene, boss.x - 40, boss.y);
    let baseAngle = Phaser.Math.Angle.Between(boss.x, boss.y, player.x, player.y);
    for (let i = 0; i < 6; i++) {
      let a = baseAngle - Phaser.Math.DegToRad(50) + i * Phaser.Math.DegToRad(20);
      createEnemyBullet(scene, boss.x - 40, boss.y, Math.cos(a) * TUNING.B.BP, Math.sin(a) * TUNING.B.BP);
    }
    bossNextAction = playTime + TUNING.B.PC;
  } else if (pat === 1) {
    let heights = [100, 230, 360, 480];
    heights.forEach((h, i) => {
      spawnWarningRing(scene, GAME_WIDTH - 50, h, i * TUNING.E.BD);
      scene.time.delayedCall(i * TUNING.E.BD + 500, () => {
        if (bossState !== 'active') return;
        createEnemyBullet(scene, boss ? boss.x - 40 : GAME_WIDTH - 160, h, -TUNING.B.BT, 0);
      });
    });
    bossNextAction = playTime + TUNING.B.PC;
  } else if (pat === 2) {
    let positions = [];
    for (let i = 0; i < 3; i++) {
      positions.push({ x: Phaser.Math.Between(80, 500), y: Phaser.Math.Between(80, 500) });
    }
    positions.forEach(p => spawnWarningRing(scene, p.x, p.y));
    scene.time.delayedCall(1000, () => {
      if (bossState !== 'active' || !boss) return;
      positions.forEach(p => {
        let a = Phaser.Math.Angle.Between(boss.x, boss.y, p.x, p.y);
        createEnemyBullet(scene, boss.x - 40, boss.y, Math.cos(a) * TUNING.B.BS, Math.sin(a) * TUNING.B.BS);
      });
    });
    bossNextAction = playTime + TUNING.B.PC;
  } else {
    spawnWarningRing(scene, boss.x, boss.y);
    for (let i = 0; i < 8; i++) {
      let a = (i / 8) * Math.PI * 2;
      createEnemyBullet(scene, boss.x, boss.y, Math.cos(a) * TUNING.B.BS, Math.sin(a) * TUNING.B.BS);
    }
    bossNextAction = playTime + TUNING.B.PC;
  }
  bossPattern++;
}

function drawNeonEnemy(e, time) {
  e.clear();

  e.rotOuter = (e.rotOuter || 0) + (e.vr || 0.02);
  e.rotInner = (e.rotInner || 0) - (e.vr || 0.02) * 2;

  let sides = e.sides || 3;
  let nc = e.nc || COLORS.enemyL1;
  let bx = e.bx || 1;
  let rBase = e.rb || 18;


  let pulse = Math.sin((time * 0.003) + (e.ft || 0)) * 1.2;
  let rOuter = (e.ra || rBase) + pulse;
  let rInner = rOuter * 0.45;


  function makePoly(radius, rotation) {
    const verts = [];

    const startAngle = (sides % 2 !== 0) ? -Math.PI / 2 : -Math.PI / sides;
    for (let i = 0; i < sides; i++) {
      let a = startAngle + rotation + (i / sides) * Math.PI * 2;
      verts.push({ x: Math.cos(a) * radius, y: Math.sin(a) * radius });
    }
    return verts;
  }

  const outerVerts = makePoly(rOuter, e.rotOuter);
  const innerVerts = makePoly(rInner, e.rotInner);


  e.lineStyle(9, nc, 0.25 * bx);
  e.strokePoints(outerVerts, true, true);
  e.lineStyle(3.5, nc, 1);
  e.strokePoints(outerVerts, true, true);

  e.lineStyle(5, nc, 0.25 * bx);
  e.strokePoints(innerVerts, true, true);
  e.lineStyle(2, nc, 1);
  e.strokePoints(innerVerts, true, true);


  e.fillStyle(nc, 0.4 * bx);
  e.fillCircle(0, 0, rInner * 0.4);
  e.fillStyle(0xffffff, Math.min(1, 0.6 * bx));
  e.fillCircle(0, 0, rInner * 0.2);
}

function lbStorageGet() {
  try {
    let raw = localStorage.getItem('chromadash-leaderboard');
    if (raw) { let v = JSON.parse(raw); if (Array.isArray(v.top)) return v.top; }
  } catch (_) { }
  return [];
}

function lbStorageSet(top) {
  try { localStorage.setItem('chromadash-leaderboard', JSON.stringify({ top })); } catch (_) { }
}

async function fetchLeaderboardTop() {
  try {
    if (window.platanusArcadeStorage) {
      const result = await window.platanusArcadeStorage.get('chromadash-leaderboard');
      if (result && result.found && result.value && Array.isArray(result.value.top)) return result.value.top;
      return [];
    }
    return lbStorageGet();
  } catch (_) {
    return [];
  }
}

async function saveLeaderboardTop(top) {
  try {
    if (window.platanusArcadeStorage) await window.platanusArcadeStorage.set('chromadash-leaderboard', { top });
    else lbStorageSet(top);
  } catch (_) { }
}

async function updateLeaderboard(score, name) {
  ui.lt.setText('Saving score...');
  ui.lt.setVisible(true);

  try {
    let top = await fetchLeaderboardTop();
    top.push({ score, name: name || '???' });
    top.sort((a, b) => b.score - a.score);
    if (top.length > 5) top = top.slice(0, 5);
    await saveLeaderboardTop(top);

    let lbText = 'TOP 5:\n\n';
    for (let i = 0; i < top.length; i++) lbText += `${i + 1}. ${top[i].name || '???'}  ${top[i].score}\n`;
    ui.lt.setText(lbText);
  } catch (err) {
    ui.lt.setText('Error saving');
  }
}

function triggerDeathPulse(scene) {

  let ring = scene.add.graphics();
  ring.lineStyle(4, 0xffffff, 0.9);
  ring.strokeCircle(0, 0, 10);
  ring.setPosition(player.x, player.y);
  ring.setBlendMode(Phaser.BlendModes.ADD);
  ring.setDepth(150);
  scene.tweens.add({
    targets: ring,
    scaleX: 25, scaleY: 25, alpha: 0,
    duration: 450, ease: 'Power2',
    onComplete: () => ring.destroy()
  });

  let bullets = enemyBullets.getChildren().slice();
  bullets.sort((a, b) => {
    let da = Phaser.Math.Distance.Between(player.x, player.y, a.x, a.y);
    let db = Phaser.Math.Distance.Between(player.x, player.y, b.x, b.y);
    return da - db;
  });
  bullets.forEach((bullet, index) => {
    scene.time.delayedCall(index * 40, () => {
      if (!bullet || !bullet.active) return;
      for (let i = 0; i < 5; i++) {
        let angle = Math.random() * Math.PI * 2;
        let dist = Phaser.Math.Between(10, 30);
        let p = scene.add.circle(bullet.x, bullet.y, 3, COLORS.enemyBullet);
        p.setBlendMode(Phaser.BlendModes.ADD);
        p.setDepth(120);
        scene.tweens.add({
          targets: p,
          x: bullet.x + Math.cos(angle) * dist,
          y: bullet.y + Math.sin(angle) * dist,
          alpha: 0, scale: 0,
          duration: 200, ease: 'Power2',
          onComplete: () => p.destroy()
        });
      }
      bullet.destroy();
    });
  });
}

function playerDie(scene, type) {
  if (currentState !== 'playing') return;
  if ((type === 'enemy' || type === 'enemyBullet' || type === 'airTriangle') && !playerState.canBeHit()) return;
  playerState.h.c--;
  updateHealthHUD();
  if (playerState.h.c <= 0) {
    if (playerDying) return; // evitar doble activación
    playerDying = true;
    Audio.die();
    scene.physics.pause();

    // Animación: el jugador escala hacia arriba y desaparece
    scene.tweens.add({
      targets: player,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 800,
      ease: 'Power2'
    });

    // Flash rojo de pantalla
    let deathFlash = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xff0000, 0.4)
      .setOrigin(0, 0).setDepth(299);
    scene.tweens.add({
      targets: deathFlash,
      alpha: 0,
      duration: 1200,
      onComplete: () => deathFlash.destroy()
    });

    // Explosión de partículas en la posición del jugador
    spawnDeathExplosion(scene, player.x, player.y, COLORS.player, 14);

    // Esperar 2 segundos antes de mostrar la pantalla de nombre
    scene.time.delayedCall(2000, () => {
      playerDying = false;
      scene.physics.resume(); // lo vuelve a pausar dentro de nameentry.enter
      changeState(scene, 'nameentry');
    });
  } else {
    playerState.setState('hurt');
    playerState.iu = playTime + TUNING.P.IA;
    Audio.hurt();


    scene.cameras.main.shake(150, 0.01);

    let flash = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xff0000, 0.25).setOrigin(0, 0).setDepth(250);
    scene.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
    if (type === 'enemyBullet') {
      triggerDeathPulse(scene);
      Audio.deathPulse();
    }
  }
}

function preload() { }

function create() {
  const scene = this;


  ui.bsg = scene.add.graphics().setDepth(2);

  bgStarsFar = [];
  for (let i = 0; i < 80; i++) {
    bgStarsFar.push({ x: Math.random() * GAME_WIDTH, y: Math.random() * GAME_HEIGHT, size: (Math.random() * 1.0 + 0.5) * 1.0, alpha: Math.random() * 0.4 + 0.2 });
  }

  bgStarsMid = [];
  for (let i = 0; i < 50; i++) {
    bgStarsMid.push({ x: Math.random() * GAME_WIDTH, y: Math.random() * GAME_HEIGHT, size: (Math.random() * 1.5 + 0.5) * 1.2, alpha: Math.random() * 0.5 + 0.3 });
  }

  bgStarsNear = [];
  for (let i = 0; i < 35; i++) {
    bgStarsNear.push({ x: Math.random() * GAME_WIDTH, y: Math.random() * GAME_HEIGHT, size: Math.random() * 2.5 + 1.5, alpha: Math.random() * 0.6 + 0.4, trail: Math.random() > 0.6 });
  }


  currentThemeColorRGB = Phaser.Display.Color.IntegerToRGB(SECTIONS[0].color);
  let initialBgC = Phaser.Display.Color.GetColor(
    Math.floor(currentThemeColorRGB.r * 0.4),
    Math.floor(currentThemeColorRGB.g * 0.4),
    Math.floor(currentThemeColorRGB.b * 0.4)
  );
  ui.bgRect = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, initialBgC).setOrigin(0, 0).setDepth(0);


  ui.sbb = scene.add.rectangle(0, 0, GAME_WIDTH, 12, 0x333333).setOrigin(0, 0).setDepth(200);
  ui.sbf = scene.add.rectangle(0, 0, 0, 12, SECTIONS[0].color).setOrigin(0, 0).setDepth(201);
  ui.stx = scene.add.text(GAME_WIDTH - 10, 6, 'S1', {
    fontSize: '12px',
    fontFamily: 'Arial',
    color: '#ffffff',
    fontStyle: 'bold'
  }).setOrigin(1, 0.5).setDepth(202);

  // Nombre del boss (aparece debajo de la barra de vida del boss)
  ui.bn = scene.add.text(GAME_WIDTH / 2, 20, '', {
    fontSize: '13px',
    fontFamily: 'Arial',
    color: '#ff6600',
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 3,
    align: 'center'
  }).setOrigin(0.5, 0).setDepth(202).setVisible(false);


  // Start screen elements are dynamically generated in states.start.enter

  ui.so = scene.add.graphics();
  ui.so.fillStyle(0x000000, 0.85);
  ui.so.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ui.so.setDepth(300).setVisible(false);

ui.sti = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 130, '-- TOP SCORES --', {
    fontSize: '28px', fontFamily: 'Arial', color: '#ffff00', fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(301).setVisible(false);

  ui.sd = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
    fontSize: '22px', fontFamily: 'Arial', color: '#ffffff', align: 'center', lineSpacing: 10
  }).setOrigin(0.5).setDepth(301).setVisible(false);

  ui.sb = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 160, 'BUTTON 2 OR START TO RETURN', {
    fontSize: '16px', fontFamily: 'Arial', color: '#888888'
  }).setOrigin(0.5).setDepth(301).setVisible(false);


  // Paused UI is dynamically generated in states.paused.enter




  player = scene.add.graphics({ x: 200, y: 300 });
  player.setDepth(30);
  scene.physics.add.existing(player);
  player.body.setSize(24, 32);
  player.body.setOffset(-12, -16);
  player.body.allowGravity = false;
  player.setVisible(false);


  playerTrailGfx = scene.add.graphics().setDepth(29);
  playerTrailGfx.setBlendMode(Phaser.BlendModes.ADD);




  spikes = scene.physics.add.group({
    allowGravity: false,
    immovable: true
  });


  playerBullets = scene.physics.add.group({ allowGravity: false });


  enemies = scene.physics.add.group({ allowGravity: false });
  airTriangles = scene.physics.add.group({ allowGravity: false });

  scene.physics.add.overlap(player, airTriangles, (pl, tri) => playerDie(scene, 'airTriangle'));
  scene.physics.add.overlap(playerBullets, airTriangles, (bullet, tri) => {
    let isPierce = bullet.getData('pierce');
    if (!isPierce) bullet.destroy();
    let tx = tri.x, ty = tri.y;
    if (tri._emitterRef) tri._emitterRef.remove();
    tri.destroy();
    enemiesDefeated++;
    spawnDeathExplosion(scene, tx, ty, COLORS.airTriangle, 6);
  });


  enemyBullets = scene.physics.add.group({ allowGravity: false });


  powerups = scene.physics.add.group({ allowGravity: false });
  let wlg = scene.add.group();
  scene.wlg = wlg;


  scene.physics.add.overlap(player, spikes, () => playerDie(scene, 'spike'));
  scene.physics.add.overlap(player, enemies, (pl, en) => {
    if (playerState.state === 'downDashing' && (pl.body.velocity.y > 10 || pl.y < en.y)) {
      let ex = en.x, ey = en.y, enc = en.nc || COLORS.enemyL1;
      en.destroy();
      enemiesDefeated++;
      spawnDeathExplosion(scene, ex, ey, enc, 6);
      pl.body.setVelocityY(TUNING.P.DDB);
      playerState.setState('airborne');
    } else {
      playerDie(scene, 'enemy');
    }
  });
  scene.physics.add.overlap(player, enemyBullets, () => playerDie(scene, 'enemyBullet'));
  scene.physics.add.overlap(playerBullets, enemies, (bullet, enemy) => {
    let isPierce = bullet.getData('pierce');
    if (isPierce) {
      let hits = bullet.getData('hitTargets');
      if (hits && hits.has(enemy)) return;
      if (hits) hits.add(enemy);
    }
    let damage = bullet.getData('damage') || 1;
    let hp = (enemy.hp || 1) - damage;
    enemy.hp = hp;
    if (!isPierce) bullet.destroy();
    if (hp <= 0) {
      spawnDeathExplosion(scene, enemy.x, enemy.y, enemy.nc || 0xff0044, 8);
      enemy.destroy();
      enemiesDefeated++;
      Audio.enemyDie();
    } else {
      enemy.bx = 5;
      scene.time.delayedCall(100, () => { if (enemy.active) enemy.bx = 1; });
    }
  });

  scene.physics.add.overlap(player, powerups, (pl, pu) => {
    let pt = pu.getData('type');
    if (pt === 0) {
      if (playerState.j.m < TUNING.P.JM) {
        playerState.j.m++;
        rebuildBarHUD(scene, 'jb', playerState.j.m,
          (sc, i) => { let b = sc.add.rectangle(20 + i * 28, GAME_HEIGHT - 30, 24, 10, COLORS.powerupJump); b.setOrigin(0, 0.5); return b; });
      }
      playerState.j.c = playerState.j.m;
    } else if (pt === 1) {
      if (playerState.h.m < TUNING.P.HM) {
        playerState.h.m++;
        rebuildBarHUD(scene, 'hb', playerState.h.m,
          (sc, i, max) => { let hb = sc.add.text(GAME_WIDTH / 2 - (max - 1) * 14 + i * 28, GAME_HEIGHT - 14, '❤️', { fontSize: '18px' }).setOrigin(0.5); hb.setDepth(202); return hb; });
      }
      playerState.h.c = playerState.h.m;
      updateHealthHUD();
    } else if (pt === 2) {
      shootMode = 'homing';
      updateWeaponUI();
      showWeaponChangeIndicator(scene, 'HOMING', '#00ffff');
    } else if (pt === 3) {
      shootMode = 'triple';
      updateWeaponUI();
      showWeaponChangeIndicator(scene, 'TRIPLE', '#ff00ff');
    } else if (pt === 4) {
      shootMode = 'auto';
      updateWeaponUI();
      showWeaponChangeIndicator(scene, 'AUTO', '#ff8800');
    } else if (pt === 5) {
      shootMode = 'pierce';
      updateWeaponUI();
      showWeaponChangeIndicator(scene, 'PIERCE', '#ff2200');
    }
    Audio.powerup();
    pu.destroy();
  });


  platforms = scene.physics.add.group({
    allowGravity: false,
    immovable: true
  });
  scene.physics.add.collider(player, platforms);


  createPlatform(scene, GAME_WIDTH / 2, 550, GAME_WIDTH * 1.5, { color: SECTIONS[0].color });


  ui.jb = [];
  for (let i = 0; i < playerState.j.m; i++) {
    let bar = scene.add.rectangle(20 + i * 28, GAME_HEIGHT - 30, 24, 10, COLORS.powerupJump);
    bar.setOrigin(0, 0.5);
    ui.jb.push(bar);
  }


  ui.hb = [];
  for (let i = 0; i < playerState.h.m; i++) {
    let hb = scene.add.text(GAME_WIDTH / 2 - (playerState.h.m - 1) * 14 + i * 28, GAME_HEIGHT - 14, '❤️', { fontSize: '18px' }).setOrigin(0.5);
    hb.setDepth(202);
    ui.hb.push(hb);
  }


  ui.smt = scene.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 30, '◆ HOMING', {
    fontSize: '20px',
    fontFamily: 'Arial',
    color: '#00ffff',
    fontStyle: 'bold'
  }).setOrigin(1, 0.5).setDepth(202);


  ui.sct = scene.add.text(20, 20, 'SCORE: 0', {
    fontSize: '24px',
    fontFamily: 'Arial',
    color: '#ffffff',
    fontStyle: 'bold'
  }).setOrigin(0, 0).setDepth(202);


  ui.lt = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, '', {
    fontSize: '18px',
    fontFamily: 'Arial',
    color: '#aaaaaa',
    align: 'center'
  }).setOrigin(0.5).setDepth(101).setVisible(false);

  ui.no = scene.add.graphics();
  ui.no.fillStyle(0x000000, 0.88);
  ui.no.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ui.no.setDepth(400).setVisible(false);

  ui.nt = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 130, 'ENTER YOUR NAME', {
    fontSize: '30px', fontFamily: 'Arial', color: '#ffff00', fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(401).setVisible(false);

  ui.nlt = [0, 1, 2].map(i =>
    scene.add.text(GAME_WIDTH / 2 - 80 + i * 80, GAME_HEIGHT / 2 - 20, 'A', {
      fontSize: '72px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(401).setVisible(false)
  );

  ui.nca = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, '▲', {
    fontSize: '24px', fontFamily: 'Arial', color: '#ffff00'
  }).setOrigin(0.5).setDepth(401).setVisible(false);

  ui.ni = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 110, 'JOYSTICK CHANGE/MOVE   START CONFIRM', {
    fontSize: '14px', fontFamily: 'Arial', color: '#888888'
  }).setOrigin(0.5).setDepth(401).setVisible(false);


  const onKeyDown = (event) => {
    let key = event.key;
    if (key.length === 1 && key !== ' ') {
      key = key.toLowerCase();
    }
    const arcadeCode = KEYBOARD_TO_ARCADE[key];
    if (arcadeCode) {
      if (!controls.held[arcadeCode]) {
        controls.pressed[arcadeCode] = true;
      }
      controls.held[arcadeCode] = true;
    }
  };

  const onKeyUp = (event) => {
    let key = event.key;
    if (key.length === 1 && key !== ' ') {
      key = key.toLowerCase();
    }
    const arcadeCode = KEYBOARD_TO_ARCADE[key];
    if (arcadeCode) {
      controls.held[arcadeCode] = false;
    }
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  scene.events.once('shutdown', () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  });

  states[currentState].enter(scene);
}

function consumePressed(code) {
  if (controls.pressed[code]) {
    controls.pressed[code] = false;
    return true;
  }
  return false;
}

function resetGame(scene) {
  playerDying = false;
  playerTrail = [];
  if (playerTrailGfx) playerTrailGfx.clear();

  for (const code in controls.held) controls.held[code] = false;
  for (const code in controls.pressed) controls.pressed[code] = false;
  player.setPosition(200, 300);
  player.body.setVelocity(0, 0);
  player.body.allowGravity = true;
  player.setScale(1);
  player.setAlpha(1);
  player.setVisible(true);

  playerState.reset();
  rebuildBarHUD(scene, 'jb', playerState.j.m,
    (sc, i) => { let b = sc.add.rectangle(20 + i * 28, GAME_HEIGHT - 30, 24, 10, COLORS.powerupJump); b.setOrigin(0, 0.5); return b; });
  rebuildBarHUD(scene, 'hb', playerState.h.m,
    (sc, i, max) => { let hb = sc.add.text(GAME_WIDTH / 2 - (max - 1) * 14 + i * 28, GAME_HEIGHT - 14, '❤️', { fontSize: '18px' }).setOrigin(0.5); hb.setDepth(202); return hb; });
  updateHealthHUD();
  gameSpeed = TUNING.W.GSS;
  nextPlatformX = GAME_WIDTH + 200;
  playTime = 0;
  lastFireTime = 0;
  nextEnemyTime = TUNING.W.FED;
  lastPlatformRedrawColor = -1;
  shootMode = WEAPON_MODES[Math.floor(Math.random() * WEAPON_MODES.length)];
  updateWeaponUI();

  enemiesDefeated = 0;
  currentScore = 0;
  ui.sct.setText('SCORE: 0');
  ui.lt.setVisible(false);

  currentSection = 0;
  sectionProgress = 0;
  sectionTimer = 0;
  pendingBonusPowerup = false;
  currentThemeColorRGB = Phaser.Display.Color.IntegerToRGB(SECTIONS[0].color);

  bossState = null;
  if (boss && boss.active) boss.destroy();
  boss = null;
  bossHp = 0;
  bossPattern = 0;
  bossNextAction = 0;
  bossSection = 0;
  loopCount = 0;
  if (ui.bn) ui.bn.setVisible(false);

  platforms.clear(true, true);
  spikes.clear(true, true);
  playerBullets.clear(true, true);
  enemies.clear(true, true);
  airTriangles.clear(true, true);
  enemyBullets.clear(true, true);
  powerups.clear(true, true);
  if (scene.wlg) scene.wlg.clear(true, true);
  createPlatform(scene, GAME_WIDTH / 2, 550, GAME_WIDTH * 1.5, { color: SECTIONS[0].color });
}



function refreshNameDisplay() {
  for (let i = 0; i < 3; i++) {
    ui.nlt[i].setText(NAME_CHARS[nameLetters[i]]);
    ui.nlt[i].setColor(i === nameCursor ? '#ffff00' : '#ffffff');
  }
  ui.nca.setX(GAME_WIDTH / 2 - 80 + nameCursor * 80);
}

function confirmName(scene) {
  let name = nameLetters.map(i => NAME_CHARS[i]).join('');
  updateLeaderboard(currentScore, name);
  changeState(scene, 'gameover');
}

const FONT_O = 'Orbitron, Arial';
function clearUI(key) {
  if (ui[key]) ui[key].forEach(e => e && e.destroy && e.destroy());
  ui[key] = [];
}

function addUI(scene, list, obj) {
  list.push(obj);
  return obj;
}

function makeOverlay(scene, list, color, alpha) {
  return addUI(scene, list, scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, color, alpha).setOrigin(0, 0).setDepth(390));
}

function makeText(scene, list, x, y, text, style, ox = 0.5, oy = ox, depth = 401) {
  return addUI(scene, list, scene.add.text(x, y, text, style).setOrigin(ox, oy).setDepth(depth));
}

function pulse(scene, target, alpha = 0.5, scale = null, duration = 800) {
  let cfg = { targets: target, alpha, duration, yoyo: true, repeat: -1 };
  if (scale !== null) cfg.scale = scale;
  scene.tweens.add(cfg);
  return target;
}

async function loadLeaderboard() {
  ui.sd.setText('Loading...');
  try {
    let top = await fetchLeaderboardTop();
    if (top.length === 0) {
      ui.sd.setText('NO SCORES YET\nBE THE FIRST MASTER!');
    } else {
      ui.sd.setText(top.map((e, i) => `${i + 1}.  ${e.name || '???'}  ${e.score}`).join('\n'));
    }
  } catch (_) {
    ui.sd.setText('SCORES OFFLINE');
  }
}

const states = {
  start: {
    enter(scene) {
      const a = ui.sE = [];
      makeOverlay(scene, a, 0x050508, 0.92);
      makeText(scene, a, GAME_WIDTH / 2, 90, 'CROMA DASH', { fontSize: '54px', fontFamily: FONT_O, color: '#00ffff', fontStyle: '900' });
      makeText(scene, a, GAME_WIDTH / 2, 150, 'RUN DASH SHOOT SURVIVE', { fontSize: '16px', fontFamily: FONT_O, color: '#88aacc', fontStyle: '700' });
      makeText(scene, a, GAME_WIDTH / 2, 245, 'JOYSTICK: MOVE / JUMP / STOMP', { fontSize: '18px', fontFamily: FONT_O, color: '#ffffff', fontStyle: '700' });
      makeText(scene, a, GAME_WIDTH / 2, 280, 'BUTTON 1: FIRE   BUTTON 2: SCORES / PAUSE', { fontSize: '18px', fontFamily: FONT_O, color: '#ffaa00', fontStyle: '700' });
      makeText(scene, a, GAME_WIDTH / 2, 350, 'WEAPONS: HOMING / AUTO / TRIPLE / PIERCE', { fontSize: '14px', fontFamily: FONT_O, color: '#c8b4ff' });
      pulse(scene, makeText(scene, a, GAME_WIDTH / 2, 445, 'PRESS START', { fontSize: '32px', fontFamily: FONT_O, color: '#ffff00', fontStyle: '900' }), 0.35, null, 800);
      makeText(scene, a, GAME_WIDTH / 2, 495, 'BUTTON 2: TOP SCORES', { fontSize: '13px', fontFamily: FONT_O, color: '#888888', fontStyle: '500' });
    },
    update(scene) {
      if (consumePressed('START1') || consumePressed('P1_1') || consumePressed('P1_U')) {
        changeState(scene, 'playing');
      } else if (consumePressed('P1_2')) {
        scoresReturnState = 'start';
        changeState(scene, 'scores');
      }
    },
    exit(scene) {
      clearUI('sE');
      resetGame(scene);
    }
  },
  scores: {
    enter(scene) {
      ui.so.setVisible(true);
      ui.sti.setVisible(true);
      ui.sd.setVisible(true);
      ui.sb.setVisible(true);
      loadLeaderboard();
    },
    update(scene) {
      if (consumePressed('START1') || consumePressed('START2') || consumePressed('P1_2')) changeState(scene, scoresReturnState);
    },
    exit() {
      ui.so.setVisible(false);
      ui.sti.setVisible(false);
      ui.sd.setVisible(false);
      ui.sb.setVisible(false);
    }
  },
  playing: {
    enter(scene) {
      scene.physics.resume();
      Audio.startBGM(scene);
    },
    update(scene, time, delta) {
      if (consumePressed('START2') || consumePressed('P1_2')) {
        changeState(scene, 'paused');
        return;
      }
      playingUpdate(scene, time, delta);
    }
  },
  paused: {
    enter(scene) {
      scene.physics.pause();
      const a = ui.pE = [];
      makeOverlay(scene, a, 0x050508, 0.88);
      pulse(scene, makeText(scene, a, GAME_WIDTH / 2, 160, 'PAUSED', { fontSize: '48px', fontFamily: FONT_O, color: '#00ffff', fontStyle: '900' }), 0.8, 0.98, 800);
      makeText(scene, a, GAME_WIDTH / 2, 260, 'START: RESUME', { fontSize: '22px', fontFamily: FONT_O, color: '#00ffcc', fontStyle: '700' });
      makeText(scene, a, GAME_WIDTH / 2, 305, 'UP: GIVE UP AND SAVE', { fontSize: '18px', fontFamily: FONT_O, color: '#ffaa00', fontStyle: '500' });
      makeText(scene, a, GAME_WIDTH / 2, 345, 'DOWN: MAIN MENU', { fontSize: '18px', fontFamily: FONT_O, color: '#aaaaaa', fontStyle: '500' });
      makeText(scene, a, GAME_WIDTH / 2, 385, 'BUTTON 2: TOP SCORES', { fontSize: '18px', fontFamily: FONT_O, color: '#8888aa', fontStyle: '500' });
    },
    update(scene) {
      if (consumePressed('START2') || consumePressed('START1')) {
        changeState(scene, 'playing');
      } else if (consumePressed('P1_U')) {
        changeState(scene, 'nameentry');
      } else if (consumePressed('P1_D')) {
        changeState(scene, 'start');
      } else if (consumePressed('P1_2')) {
        scoresReturnState = 'paused';
        changeState(scene, 'scores');
      }
    },
    exit() {
      clearUI('pE');
    }
  },
  nameentry: {
    enter(scene) {
      scene.physics.pause();
      nameLetters = [0, 0, 0];
      nameCursor = 0;
      ui.no.setVisible(true);
      ui.nt.setVisible(true);
      ui.nca.setVisible(true);
      ui.ni.setVisible(true);
      for (let t of ui.nlt) t.setVisible(true);
      refreshNameDisplay();
    },
    update(scene) {
      if (consumePressed('P1_U')) {
        nameLetters[nameCursor] = (nameLetters[nameCursor] + 1) % 26;
        refreshNameDisplay();
      } else if (consumePressed('P1_D')) {
        nameLetters[nameCursor] = (nameLetters[nameCursor] + 25) % 26;
        refreshNameDisplay();
      } else if (consumePressed('P1_R')) {
        if (nameCursor < 2) {
          nameCursor++;
          refreshNameDisplay();
        } else confirmName(scene);
      } else if (consumePressed('P1_L')) {
        if (nameCursor > 0) {
          nameCursor--;
          refreshNameDisplay();
        }
      } else if (consumePressed('START1')) {
        confirmName(scene);
      }
    },
    exit() {
      ui.no.setVisible(false);
      ui.nt.setVisible(false);
      ui.nca.setVisible(false);
      ui.ni.setVisible(false);
      for (let t of ui.nlt) t.setVisible(false);
    }
  },
  gameover: {
    enter(scene) {
      scene.physics.pause();
      Audio.stopBGM();
      const a = ui.gE = [];
      const score = Math.floor(currentScore);
      makeOverlay(scene, a, 0x0a0505, 0.95);
      pulse(scene, makeText(scene, a, GAME_WIDTH / 2, 100, 'GAME OVER', { fontSize: '60px', fontFamily: FONT_O, color: '#ff1a1a', fontStyle: '900' }), 0.8, 0.98, 800);
      makeText(scene, a, GAME_WIDTH / 2, 170, 'FINAL SCORE: ' + score, { fontSize: '26px', fontFamily: FONT_O, color: '#ffffff', fontStyle: '700' });
      ui.gLB = makeText(scene, a, GAME_WIDTH / 2, 235, 'LOADING...', { fontSize: '18px', fontFamily: FONT_O, color: '#cccccc', align: 'center' }, 0.5, 0);
      pulse(scene, makeText(scene, a, GAME_WIDTH / 2, 500, 'START: PLAY AGAIN', { fontSize: '20px', fontFamily: FONT_O, color: '#00ffcc', fontStyle: '700' }), 0.4, null, 800);
      makeText(scene, a, GAME_WIDTH / 2, 540, 'DOWN: MAIN MENU', { fontSize: '16px', fontFamily: FONT_O, color: '#aaaaaa', fontStyle: '500' });
      fetchLeaderboardTop().then(top => {
        if (currentState !== 'gameover' || !ui.gLB) return;
        if (!top.length) {
          ui.gLB.setText('NO SCORES YET');
          return;
        }
        let used = false;
        ui.gLB.setText(top.slice(0, 5).map((e, i) => {
          let cur = !used && e.score === score;
          if (cur) used = true;
          return (cur ? '> ' : '  ') + (i + 1) + '. ' + (e.name || '???') + '  ' + e.score;
        }).join('\n'));
      });
    },
    update(scene) {
      if (consumePressed('START1') || consumePressed('P1_1')) {
        changeState(scene, 'playing');
      } else if (consumePressed('P1_D')) {
        changeState(scene, 'start');
      }
    },
    exit(scene) {
      ui.gLB = null;
      clearUI('gE');
      resetGame(scene);
    }
  },
  cutscene: { update() {} }
};

let currentState = 'start';

function changeState(scene, newState) {
  if (states[currentState].exit) states[currentState].exit(scene);
  currentState = newState;
  if (states[currentState].enter) states[currentState].enter(scene);
}



function updateSectionProgress(scene, delta) {
  sectionTimer += delta;
  sectionProgress = sectionTimer / SECTIONS[currentSection].duration;

  if (sectionProgress >= 1.0) {
    if ((currentSection === 1 || currentSection === 4) && !bossState) {
      sectionProgress = 1.0;
      sectionTimer = SECTIONS[currentSection].duration;
      if (!boss) spawnBoss(scene, currentSection);
    } else if (currentSection < 4 && !bossState) {
      sectionTimer -= SECTIONS[currentSection].duration;
      sectionProgress = 0;
      currentSection++;
      Audio.sectionChange();
      pendingBonusPowerup = true;
      playerState.h.c = playerState.h.m;
      updateHealthHUD();
      let flash = scene.add.graphics();
      flash.fillStyle(SECTIONS[currentSection].color, 1);
      flash.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      flash.setDepth(200);
      scene.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
      gameSpeed = Math.max(SECTIONS[currentSection].speedFloor + loopCount * TUNING.B.SL, gameSpeed * 0.8);
    } else if (currentSection >= 4) {
      sectionProgress = 1.0;
    }
  }

  if (bossState) {
    ui.sbf.width = GAME_WIDTH * Math.max(0, bossHp / bossHpMax);
    ui.sbf.setFillStyle(0xff0000);
    ui.stx.setText('BOSS');
  } else {
    ui.sbf.width = GAME_WIDTH * Math.min(sectionProgress, 1.0);
    ui.sbf.setFillStyle(SECTIONS[currentSection].color);
    ui.stx.setText(loopCount > 0 ? 'S' + (currentSection + 1) + ' L' + (loopCount + 1) : 'S' + (currentSection + 1));
  }

  let tRGB = SECTION_RGB[currentSection];
  currentThemeColorRGB.r += (tRGB.r - currentThemeColorRGB.r) * 0.02;
  currentThemeColorRGB.g += (tRGB.g - currentThemeColorRGB.g) * 0.02;
  currentThemeColorRGB.b += (tRGB.b - currentThemeColorRGB.b) * 0.02;
  let themeValue = Phaser.Display.Color.GetColor(
    Math.floor(currentThemeColorRGB.r),
    Math.floor(currentThemeColorRGB.g),
    Math.floor(currentThemeColorRGB.b)
  );
  ui.bgRect.setFillStyle(Phaser.Display.Color.GetColor(
    Math.floor(currentThemeColorRGB.r * 0.4),
    Math.floor(currentThemeColorRGB.g * 0.4),
    Math.floor(currentThemeColorRGB.b * 0.4)
  ));

  gameSpeed += TUNING.W.GSA * (delta / 1000);
  if (gameSpeed > TUNING.W.GSM) gameSpeed = TUNING.W.GSM;

  return themeValue;
}

function updateSpawning(scene, delta, themeValue) {
  while (nextPlatformX < GAME_WIDTH + 800) {
    let platY = Phaser.Math.Between(250, 500);
    let platWidth = Phaser.Math.Between(150, 300);
    let randSubtype = Math.random();
    let boss2Active = !!bossState && bossSection === 4;
    let hasSpikes = randSubtype < 0.25 && isMechanicActive('spikes') && (!bossState || boss2Active);
    let isMoving = randSubtype >= 0.25 && randSubtype < 0.5 && isMechanicActive('moving') && !bossState;

    createPlatform(scene, nextPlatformX + platWidth / 2, platY, platWidth, { isMoving, color: isMoving ? COLORS.platformMoving : themeValue });

    if (hasSpikes) {
      let spikeWidth = Math.floor((platWidth * 0.5) / 20) * 20;
      if (spikeWidth < 20) spikeWidth = 20;
      let isLeft = Math.random() < 0.5;
      let spikeX = nextPlatformX + (isLeft ? (spikeWidth / 2) : (platWidth - spikeWidth / 2));
      createSpike(scene, spikeX, platY - 20, spikeWidth);
    } else if (!isMoving && (pendingBonusPowerup || Math.random() < 0.15)) {
      pendingBonusPowerup = false;
      let pType = Phaser.Math.Between(0, 5);
      let currentWeaponType = shootMode === 'homing' ? 2 : shootMode === 'triple' ? 3 : shootMode === 'auto' ? 4 : 5;
      if (pType === currentWeaponType) pType = Phaser.Math.RND.pick([0, 1, 2, 3, 4, 5].filter(t => t !== currentWeaponType));
      if (pType === 0 && playerState.j.m >= TUNING.P.JM) pType = 1;
      createPowerup(scene, nextPlatformX + platWidth / 2, platY - 40, pType);
    }

    nextPlatformX += platWidth + Phaser.Math.Between(100, 250);
  }

  const needsRedraw = themeValue !== lastPlatformRedrawColor;
  platforms.getChildren().forEach(plat => {
    if (needsRedraw && !plat.getData('isMoving') && plat._redraw) plat._redraw(themeValue);
    plat.body.setVelocityX(-gameSpeed);
    if (plat.x + plat.getData('width') / 2 < 0) plat.destroy();
  });
  if (needsRedraw) lastPlatformRedrawColor = themeValue;
  spikes.getChildren().forEach(s => {
    s.body.setVelocityX(-gameSpeed);
    if (s.x + s.getData('width') / 2 < 0) s.destroy();
  });
  powerups.getChildren().forEach(p => {
    p.body.setVelocityX(-gameSpeed);
    if (p.x + p.width < 0) p.destroy();
  });
  nextPlatformX -= gameSpeed * (delta / 1000);

  if (currentSection >= 3 && (!bossState || bossSection === 4) && airTriangles.countActive(true) < 2 && Math.random() < 0.005) {
    let lvl = 1;
    if (currentSection === 3) lvl = Math.random() < 0.5 ? 1 : 2;
    else if (currentSection === 4) lvl = Math.random() < 0.3 ? 2 : 3;
    let zones = [Phaser.Math.Between(50, 150), Phaser.Math.Between(200, 350), Phaser.Math.Between(400, 520)];
    let spawnY = zones[Phaser.Math.Between(0, 2)];
    let wLine = scene.add.rectangle(GAME_WIDTH / 2, spawnY, GAME_WIDTH, 2, 0xff0000, 0.5).setDepth(50);
    if (scene.wlg) scene.wlg.add(wLine);
    scene.time.delayedCall(800, () => wLine.destroy());
    scene.time.delayedCall(1000, () => {
      if (currentState !== 'playing') return;
      createAirTriangle(scene, spawnY, lvl);
    });
  }

  let enemiesInS1Loop = loopCount > 0 && currentSection === 0;
  if (playTime > nextEnemyTime && enemies.countActive(true) < 4 && (isMechanicActive('enemies') || enemiesInS1Loop) && !bossState) {
    let level = 1;
    if (enemiesInS1Loop) level = 2;
    else if (currentSection === 2) level = Math.random() < 0.5 ? 1 : 2;
    else if (currentSection === 3) level = 2;
    else if (currentSection >= 4) level = 3;

    createEnemy(scene, level);
    nextEnemyTime = playTime + Math.max(TUNING.E.SN1, TUNING.E.SN2 - (gameSpeed - 150) * TUNING.E.SSF);
  }
}

function updatePlayerInput(scene, delta, isOnGround) {
  if (consumePressed('P1_L')) {
    if (playTime - playerState.d.tl < TUNING.P.DT && playTime > playerState.d.cu) {
      playerState.d.di = -1;
      playerState.d.au = playTime + TUNING.P.DD;
      playerState.d.cu = playTime + TUNING.P.DC;
      playerState.iu = Math.max(playerState.iu, playTime + 200);
      playerState.setState('dashing');
      Audio.dash();
    }
    playerState.d.tl = playTime;
  }
  if (consumePressed('P1_R')) {
    if (playTime - playerState.d.tr < TUNING.P.DT && playTime > playerState.d.cu) {
      playerState.d.di = 1;
      playerState.d.au = playTime + TUNING.P.DD;
      playerState.d.cu = playTime + TUNING.P.DC;
      playerState.iu = Math.max(playerState.iu, playTime + 200);
      playerState.setState('dashing');
      Audio.dash();
    }
    playerState.d.tr = playTime;
  }

  let playerSpeedX = 0;
  if (playTime < playerState.d.au) {
    playerSpeedX = TUNING.P.DS * playerState.d.di;
    if (Math.random() < 0.3) {
      let trailC = getWeaponColor(shootMode);
      let trail = scene.add.ellipse(player.x, player.y, 24, 32, trailC, 0.4);
      trail.setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: trail, alpha: 0, duration: 200, onComplete: () => trail.destroy() });
    }
  } else {
    if (controls.held['P1_L']) playerSpeedX = -(TUNING.P.WS + gameSpeed);
    else if (controls.held['P1_R']) playerSpeedX = TUNING.P.WS;
    else if (isOnGround) playerSpeedX = -gameSpeed;
  }
  player.body.setVelocityX(playerSpeedX);

  if (player.y > GAME_HEIGHT || player.x + 12 < 0) playerDie(scene, 'fall');

  if (!playerDying) {
    if (!playerState.canBeHit()) {
      player.alpha = (Math.floor(playTime / 100) % 2 === 0) ? 0.3 : 1;
    } else {
      player.alpha = 1;
    }
  }

  if (player.x + 12 > GAME_WIDTH) player.setX(GAME_WIDTH - 12);

  if (isOnGround && playerState.state === 'downDashing') playerState.setState('idle');

  if (consumePressed('START1') || consumePressed('P1_U')) {
    if (controls.held['P1_D'] && !isOnGround) {
      playerState.setState('downDashing');
      player.body.setVelocityY(TUNING.P.DDV);
      Audio.downDash();
    } else if (isOnGround || (playTime - lastGroundTime) < COYOTE_TIME_MS) {
      player.body.setVelocityY(TUNING.P.JV);
      lastGroundTime = 0;
      Audio.jump();
    } else if (playerState.j.c > 0) {
      player.body.setVelocityY(TUNING.P.JV);
      playerState.j.c--;
      Audio.doubleJump();
      let jumpColor = getWeaponColor(shootMode);
      let jx = player.x, jy = player.y + 12;

      let jRing = scene.add.graphics({ x: jx, y: jy });
      jRing.lineStyle(3, jumpColor, 0.85);
      jRing.strokeEllipse(0, 0, 24, 10);
      jRing.setBlendMode(Phaser.BlendModes.ADD);
      jRing.setDepth(28);
      scene.tweens.add({ targets: jRing, scaleX: 3.5, scaleY: 2.5, alpha: 0, duration: 380, ease: 'Power2', onComplete: () => jRing.destroy() });

      let jRing2 = scene.add.graphics({ x: jx, y: jy });
      jRing2.lineStyle(1.5, 0xffffff, 0.6);
      jRing2.strokeEllipse(0, 0, 18, 8);
      jRing2.setBlendMode(Phaser.BlendModes.ADD);
      jRing2.setDepth(27);
      scene.tweens.add({ targets: jRing2, scaleX: 5, scaleY: 3, alpha: 0, duration: 260, ease: 'Power2', onComplete: () => jRing2.destroy() });

      for (let i = 0; i < 8; i++) {
        let angle = (i / 8) * Math.PI * 2;
        let spark = scene.add.circle(
          jx + (Math.random() - 0.5) * 18,
          jy,
          Phaser.Math.Between(2, 4), Math.random() < 0.5 ? 0xffffff : jumpColor
        );
        spark.setBlendMode(Phaser.BlendModes.ADD);
        spark.setDepth(28);
        scene.tweens.add({
          targets: spark,
          x: spark.x + (Math.random() - 0.5) * 28,
          y: spark.y + Phaser.Math.Between(12, 35),
          alpha: 0, scale: 0,
          duration: Phaser.Math.Between(220, 380), ease: 'Power2',
          onComplete: () => spark.destroy()
        });
      }
    }
  }


  if (playerState.state === 'hurt' && playerState.canBeHit()) {
    playerState.setState(isOnGround ? 'idle' : 'airborne');
  } else if (playerState.state !== 'downDashing' && playerState.state !== 'hurt') {
    if (playTime < playerState.d.au) {
      playerState.setState('dashing');
    } else if (!isOnGround) {
      playerState.setState('airborne');
    } else if (Math.abs(player.body.velocity.x) > 1) {
      playerState.setState('running');
    } else {
      playerState.setState('idle');
    }
  }
}

function updateShooting(scene) {
  const held = controls.held['P1_1'];

  if (shootMode === 'pierce') {
    playerState.pierce.pl = playerState.pierce.cl;
    if (held) {
      if (!playerState.pierce.cg) {
        playerState.pierce.cg = true;
        playerState.pierce.cs = playTime;
      }
      let elapsed = playTime - playerState.pierce.cs;
      if (elapsed >= TUNING.S.PMX) playerState.pierce.cl = 3;
      else if (elapsed >= TUNING.S.PMD) playerState.pierce.cl = 2;
      else if (elapsed >= TUNING.S.PMN) playerState.pierce.cl = 1;
      else playerState.pierce.cl = 0;
      if (playerState.pierce.cl > playerState.pierce.pl) {
        Audio.pierceCharge(playerState.pierce.cl);
      }
    } else if (playerState.pierce.cg) {
      if (playerState.pierce.cl > 0) {
        createPlayerBullet(scene, 'pierce', 0, playerState.pierce.cl);
        Audio.pierceShoot(playerState.pierce.cl);
        if (playerState.pierce.cl === 3) scene.cameras.main.shake(80, 0.005);
      }
      playerState.pierce.cg = false;
      playerState.pierce.cs = 0;
      playerState.pierce.cl = 0;
    }
    return;
  }

  if (!held) return;
  let interval;
  if (shootMode === 'homing') interval = TUNING.S.HI2;
  else if (shootMode === 'auto') interval = TUNING.S.AI;
  else if (shootMode === 'triple') interval = TUNING.S.TI;
  if (playTime > lastFireTime + interval) {
    lastFireTime = playTime;
    if (shootMode === 'homing') { createPlayerBullet(scene, 'homing'); Audio.shootHoming(); }
    else if (shootMode === 'auto') { createPlayerBullet(scene, 'auto'); Audio.shootAuto(); }
    else if (shootMode === 'triple') {
      let spread = TUNING.S.TS;
      for (let deg of [-spread, 0, spread]) createPlayerBullet(scene, 'triple', Phaser.Math.DegToRad(deg));
      Audio.shootTriple();
    }
  }
}

function updateEnemies(scene, time) {
  enemies.getChildren().forEach(e => {
    drawNeonEnemy(e, time);
    let level = e.level || 1;
    let cooldown = level === 1 ? TUNING.E.F1 : TUNING.E.F2;
    if (playTime > e.lastFire + cooldown) {
      let rb = e.rb || 14;
      scene.tweens.add({ targets: e, ra: rb * 1.5, bx: 3.5, duration: 100, ease: 'Sine.easeOut', yoyo: true, hold: 50 });
      e.lastFire = playTime;
      if (level === 1) { Audio.enemyShoot(); createEnemyBullet(scene, e.x - 14, e.y, -TUNING.E.BS, 0); }
      else if (level === 2) {
        Audio.enemyShoot(); createEnemyBullet(scene, e.x - 18, e.y, -TUNING.E.BS, 0);
        scene.time.delayedCall(TUNING.E.BD, () => { if (e.active) { Audio.enemyShoot(); createEnemyBullet(scene, e.x - 18, e.y, -TUNING.E.BS, 0); } });
      } else if (level === 3) {
        Audio.enemyShoot();
        for (let ang of [-10, 0, 10]) {
          let rad = Phaser.Math.DegToRad(ang + 180);
          createEnemyBullet(scene, e.x - 22, e.y, Math.cos(rad) * TUNING.E.BS, Math.sin(rad) * TUNING.E.BS);
        }
      }
    }
  });

  enemyBullets.getChildren().forEach(b => {
    b.rotation += 0.15;
    b._trailTick = ((b._trailTick || 0) + 1) % 3;
    if (b._trailTick === 0) {
      let tc = Math.random() < 0.5 ? 0xffffff : 0xff0044;
      let bt = scene.add.rectangle(b.x, b.y, 7, 7, tc);
      bt.setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: bt, alpha: 0, scale: 0.1, duration: 150, onComplete: () => bt.destroy() });
    }
    if (b.x < -50 || b.y < -50 || b.y > GAME_HEIGHT + 50) b.destroy();
  });
}

function updatePlayerBullets(scene, delta) {
  playerBullets.getChildren().forEach(b => {
    if (bossState && boss && boss.active && bossState !== 'dying') {
      let rb = boss.rb || 42;
      let hw = rb + 8;
      if (Math.abs(b.x - boss.x) < hw && Math.abs(b.y - boss.y) < hw) {
        let isPierce = b.getData('pierce');
        if (isPierce) {
          let hits = b.getData('hitTargets');
          if (hits && hits.has(boss)) return;
          if (hits) hits.add(boss);
        }
        let dmg = b.getData('damage') || 1;
        bossHp -= dmg;
        if (!isPierce) b.destroy();
        boss.bx = 5;
        Audio.bossHurt();
        scene.time.delayedCall(80, () => { if (boss && boss.active) boss.bx = 1; });
        if (bossHp <= 0 && bossState !== 'dying') killBoss(scene);
        if (!isPierce) return;
      }
    }
    if (b.getData('type') === 'homing') {
      let closestDest = null;
      let closestDist = Infinity;
      let homingTargets = [...enemies.getChildren()];
      if (bossState && boss && boss.active && bossState !== 'dying') homingTargets.push(boss);
      homingTargets.forEach(e => {
        let dist = Phaser.Math.Distance.Between(b.x, b.y, e.x, e.y);
        if (dist < closestDist && e.x > b.x) { closestDist = dist; closestDest = e; }
      });
      if (closestDest) {
        if (b.y < closestDest.y) b.body.velocity.y += 20 * (delta / 16);
        else if (b.y > closestDest.y) b.body.velocity.y -= 20 * (delta / 16);
        b.body.velocity.y *= 0.92;
      } else {
        b.body.velocity.y *= 0.95;
      }
    }
    b._haloTick = ((b._haloTick || 0) + 1) % 3;
    if (b._haloTick === 0) {
      let trailColor, trailSize = 5;
      let btype = b.getData('type');
      if (btype === 'pierce') {
        trailColor = [COLORS.weaponPierce, COLORS.weaponPierce, COLORS.weaponPierceMed, COLORS.weaponPierceMax][b.getData('cl') || 1];
        trailSize = 7;
      } else if (btype === 'auto') { trailColor = COLORS.weaponAuto; trailSize = 3; }
      else if (btype === 'triple') { trailColor = COLORS.weaponTriple; trailSize = 4; }
      else { trailColor = COLORS.weaponHoming; trailSize = 5; }
      let halo = scene.add.circle(b.x, b.y, trailSize * 1.4, trailColor, 0.28);
      halo.setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: halo, alpha: 0, scale: 0.1, duration: 200, onComplete: () => halo.destroy() });
    }
    if (b.x > GAME_WIDTH + 50 || b.y < -50 || b.y > GAME_HEIGHT + 50) b.destroy();
  });

  airTriangles.getChildren().forEach(tri => {
    if (tri.x < -50) {
      if (tri._emitterRef) tri._emitterRef.remove();
      tri.destroy();
    } else if (tri.getData('level') === 3 && !tri.getData('fired') && tri.x < 600) {
      tri.setData('fired', true);
      let bullet = scene.add.rectangle(tri.x, tri.y, 12, 12, COLORS.enemyBullet);
      enemyBullets.add(bullet);
      scene.physics.add.existing(bullet);
      bullet.body.allowGravity = false;
      let angle = Phaser.Math.Angle.Between(tri.x, tri.y, player.x, player.y);
      bullet.body.setVelocity(Math.cos(angle) * TUNING.A.BS, Math.sin(angle) * TUNING.A.BS);
    }
  });
}

function updateBossLogic(scene, time) {
  if (bossState && boss && boss.active && bossState !== 'dying') {
    drawNeonEnemy(boss, time);
    if (bossState === 'active' && playTime > bossNextAction) executeBossPattern(scene);
  }
}

function updateJumpRecharge(delta) {
  if (playerState.j.c < playerState.j.m) {
    playerState.j.t += delta;
    if (playerState.j.t >= TUNING.P.JR) {
      playerState.j.c++;
      playerState.j.t -= TUNING.P.JR;
    }
  } else {
    playerState.j.t = 0;
  }
}

function updateHUD() {
  currentScore = Math.floor(playTime / 1000) * 10 + enemiesDefeated * 50;
  ui.sct.setText(`SCORE: ${currentScore}`);
  for (let i = 0; i < playerState.j.m; i++) {
    ui.jb[i].setFillStyle(i < playerState.j.c ? COLORS.powerupJump : 0x555555);
  }

}

function playingUpdate(scene, time, delta) {
  playTime += delta;


  const isOnGround = player.body.touching.down;
  const themeValue = updateSectionProgress(scene, delta);
  updateBackground(scene, delta);
  updateSpawning(scene, delta, themeValue);
  updatePlayerInput(scene, delta, isOnGround);
  updateShooting(scene);
  updateEnemies(scene, time);
  updatePlayerBullets(scene, delta);
  updateBossLogic(scene, time);
  updateJumpRecharge(delta);


  if (!wasOnGround && isOnGround) {
    landingSquashTime = playTime;
    Audio.land();
  }
  wasOnGround = isOnGround;
  if (isOnGround) lastGroundTime = playTime;
  if (currentState === 'playing') {
    let st = computeSlimeTransform();
    updatePlayerTrail(scene, st.color, delta);
    drawPlayerNeon(player, st.color, st.scaleX, st.scaleY);
  }

  updateHUD();
}

function update(time, delta) {
  const scene = this;
  states[currentState].update(scene, time, delta);
  for (const code in controls.pressed) {
    controls.pressed[code] = false;
  }
}

