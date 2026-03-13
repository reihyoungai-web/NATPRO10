const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('bestScore');
const finalScoreEl = document.getElementById('finalScore');
const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const W = canvas.width;
const H = canvas.height;
const GRAVITY = 0.42;
const JUMP = -7.2;
const GROUND_H = 68;
const BEST_KEY = 'jeju-jump-best';

let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function beep(freq = 440, duration = 0.08, type = 'sine', volume = 0.04) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.start(now);
  osc.stop(now + duration);
}

function toneSequence() {
  if (!audioCtx) return;
  [262, 330, 392].forEach((f, i) => {
    setTimeout(() => beep(f, 0.12, 'triangle', 0.03), i * 120);
  });
}

const state = {
  running: false,
  over: false,
  score: 0,
  best: Number(localStorage.getItem(BEST_KEY) || 0),
  time: 0,
  spawnTimer: 0,
  itemTimer: 0,
  bgOffset: 0,
  player: null,
  enemies: [],
  items: []
};
bestScoreEl.textContent = state.best;

function resetGame() {
  state.running = true;
  state.over = false;
  state.score = 0;
  state.time = 0;
  state.spawnTimer = 0;
  state.itemTimer = 60;
  state.bgOffset = 0;
  state.enemies = [];
  state.items = [];
  state.player = {
    x: 160,
    y: H / 2,
    w: 72,
    h: 92,
    vy: 0,
    rotation: 0
  };
  scoreEl.textContent = state.score;
  startOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
}

function jump() {
  if (!state.running || state.over) return;
  state.player.vy = JUMP;
  beep(540, 0.08, 'square', 0.035);
}

function addEnemy() {
  const kind = Math.random() < 0.5 ? 'octopus' : 'turtle';
  const size = kind === 'octopus' ? 62 : 70;
  state.enemies.push({
    kind,
    x: W + size,
    y: 80 + Math.random() * (H - GROUND_H - 180),
    w: size,
    h: size,
    speed: 3.4 + Math.random() * 1.7,
    phase: Math.random() * Math.PI * 2
  });
}

function addHallabong() {
  state.items.push({
    kind: 'hallabong',
    x: W + 42,
    y: 90 + Math.random() * (H - GROUND_H - 180),
    w: 42,
    h: 42,
    speed: 3.1
  });
}

function collide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function gameOver() {
  state.over = true;
  state.running = false;
  finalScoreEl.textContent = state.score;
  if (state.score > state.best) {
    state.best = state.score;
    localStorage.setItem(BEST_KEY, String(state.best));
    bestScoreEl.textContent = state.best;
  }
  gameOverOverlay.classList.remove('hidden');
  beep(180, 0.2, 'sawtooth', 0.04);
  setTimeout(() => beep(120, 0.25, 'sawtooth', 0.04), 120);
}

function update() {
  if (!state.running || state.over) return;

  state.time++;
  state.bgOffset += 1.2;
  state.spawnTimer--;
  state.itemTimer--;

  const p = state.player;
  p.vy += GRAVITY;
  p.y += p.vy;
  p.rotation = Math.max(-0.35, Math.min(0.45, p.vy * 0.03));

  if (p.y < 0) {
    p.y = 0;
    p.vy = 0;
  }

  if (p.y + p.h > H - GROUND_H) {
    gameOver();
  }

  if (state.spawnTimer <= 0) {
    addEnemy();
    state.spawnTimer = 70 + Math.floor(Math.random() * 40);
  }

  if (state.itemTimer <= 0) {
    addHallabong();
    state.itemTimer = 100 + Math.floor(Math.random() * 60);
  }

  state.enemies.forEach((e) => {
    e.x -= e.speed;
    e.phase += 0.08;
    if (e.kind === 'octopus') e.y += Math.sin(e.phase) * 0.8;
    if (e.kind === 'turtle') e.y += Math.cos(e.phase * 0.7) * 0.35;
  });
  state.items.forEach((i) => {
    i.x -= i.speed;
  });

  state.enemies = state.enemies.filter((e) => e.x + e.w > -20);
  state.items = state.items.filter((i) => i.x + i.w > -20);

  for (const e of state.enemies) {
    if (collide(p, e)) {
      gameOver();
      return;
    }
  }

  state.items = state.items.filter((i) => {
    if (collide(p, i)) {
      state.score += 10;
      scoreEl.textContent = state.score;
      beep(880, 0.07, 'triangle', 0.035);
      setTimeout(() => beep(1175, 0.09, 'triangle', 0.03), 50);
      return false;
    }
    return true;
  });
}

function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#60c5f1');
  g.addColorStop(0.55, '#1f7ab8');
  g.addColorStop(1, '#0a365a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // clouds
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 5; i++) {
    const x = ((i * 220) - state.bgOffset * 0.3) % (W + 300) - 150;
    const y = 40 + i * 28;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x + 60, y + 20, 60, 20, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 110, y + 18, 42, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 20, y + 18, 38, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // sea
  ctx.fillStyle = '#1778a8';
  ctx.fillRect(0, H - 160, W, 92);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  for (let y = H - 150; y < H - 70; y += 18) {
    ctx.beginPath();
    for (let x = 0; x <= W; x += 18) {
      const wave = Math.sin((x + state.bgOffset * 2 + y) * 0.03) * 4;
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }

  // hallasan silhouette
  ctx.fillStyle = '#315b3b';
  ctx.beginPath();
  ctx.moveTo(0, H - 90);
  ctx.lineTo(180, H - 145);
  ctx.lineTo(335, H - 210);
  ctx.lineTo(500, H - 150);
  ctx.lineTo(700, H - 185);
  ctx.lineTo(860, H - 130);
  ctx.lineTo(W, H - 95);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // ground
  ctx.fillStyle = '#68482a';
  ctx.fillRect(0, H - GROUND_H, W, GROUND_H);
  ctx.fillStyle = '#7fb069';
  ctx.fillRect(0, H - GROUND_H, W, 12);
}

function drawDolhareubang(p) {
  ctx.save();
  ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
  ctx.rotate(p.rotation);

  // body
  ctx.fillStyle = '#b8b1a5';
  ctx.beginPath();
  ctx.roundRect(-26, -26, 52, 72, 18);
  ctx.fill();

  // head
  ctx.beginPath();
  ctx.roundRect(-24, -46, 48, 34, 16);
  ctx.fill();

  // hat
  ctx.fillStyle = '#90887b';
  ctx.beginPath();
  ctx.ellipse(0, -48, 28, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -58, 17, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#433d37';
  ctx.beginPath();
  ctx.arc(-9, -30, 3, 0, Math.PI * 2);
  ctx.arc(9, -30, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = '#433d37';
  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.lineTo(0, -16);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, -10, 8, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // arms
  ctx.strokeStyle = '#8f8778';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-20, 0);
  ctx.lineTo(-34, 16);
  ctx.moveTo(20, 0);
  ctx.lineTo(34, 16);
  ctx.stroke();

  ctx.restore();
}

function drawOctopus(e) {
  ctx.save();
  ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
  ctx.fillStyle = '#9b5de5';
  ctx.beginPath();
  ctx.arc(0, -8, 22, Math.PI, 0);
  ctx.lineTo(22, 10);
  ctx.lineTo(-22, 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#7a39c9';
  ctx.lineWidth = 4;
  for (let i = -16; i <= 16; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, 10);
    ctx.lineTo(i + Math.sin((state.time + i) * 0.1) * 5, 24);
    ctx.stroke();
  }
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-7, -8, 5, 0, Math.PI * 2);
  ctx.arc(7, -8, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(-7, -8, 2, 0, Math.PI * 2);
  ctx.arc(7, -8, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTurtle(e) {
  ctx.save();
  ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
  ctx.fillStyle = '#4caf50';
  ctx.beginPath();
  ctx.ellipse(0, 0, 24, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#66bb6a';
  ctx.beginPath();
  ctx.arc(24, -2, 9, 0, Math.PI * 2);
  ctx.fill();
  [[-14, -15], [-14, 15], [10, -15], [10, 15]].forEach(([x,y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawHallabong(i) {
  ctx.save();
  ctx.translate(i.x + i.w / 2, i.y + i.h / 2);
  ctx.fillStyle = '#ff9f1c';
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffbf69';
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 6, Math.sin(a) * 6, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#5f8f2d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -17);
  ctx.lineTo(0, -24);
  ctx.stroke();
  ctx.fillStyle = '#7cb342';
  ctx.beginPath();
  ctx.ellipse(6, -20, 7, 4, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function draw() {
  drawBackground();

  for (const item of state.items) drawHallabong(item);
  for (const enemy of state.enemies) {
    if (enemy.kind === 'octopus') drawOctopus(enemy);
    else drawTurtle(enemy);
  }
  drawDolhareubang(state.player);

  // subtle instruction on gameplay
  if (state.running && !state.over) {
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.font = '18px Arial';
    ctx.fillText('클릭/터치로 점프 · 한라봉 +10점 · 문어/거북이 충돌 시 게임 오버', 22, H - 24);
  }
}

function loop() {
  update();
  if (!state.player) resetGame();
  draw();
  requestAnimationFrame(loop);
}

function handleInput(evt) {
  evt?.preventDefault?.();
  ensureAudio();
  if (!state.running && !state.over) return;
  if (state.over) return;
  jump();
}

canvas.addEventListener('pointerdown', handleInput, { passive: false });
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    handleInput(e);
  }
});

startBtn.addEventListener('click', () => {
  ensureAudio();
  toneSequence();
  resetGame();
});
restartBtn.addEventListener('click', () => {
  ensureAudio();
  resetGame();
});

resetGame();
state.running = false;
startOverlay.classList.remove('hidden');
loop();
