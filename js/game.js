(function () {
  const TYPES = {
    octopus: { emoji: '🐙', color: '#fb7185', points: 15 },
    dolphin: { emoji: '🐬', color: '#60a5fa', points: 15 },
    hallabong: { emoji: '🍊', color: '#fbbf24', points: 12 },
  };
  const ORDER = ['octopus', 'dolphin', 'hallabong'];

  class JejuGame {
    constructor(canvas, onUpdate, onGameOver) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.onUpdate = onUpdate;
      this.onGameOver = onGameOver;
      this.loop = this.loop.bind(this);
      this.reset();
    }

    reset() {
      this.running = false;
      this.score = 0;
      this.combo = 0;
      this.best = Number(localStorage.getItem('natpro10-best-score') || 0);
      this.timeLeft = 60;
      this.lastTime = 0;
      this.timerAcc = 0;
      this.spawnAcc = 0;
      this.projectiles = [];
      this.targets = [];
      this.particles = [];
      this.player = { x: this.canvas.width / 2, y: this.canvas.height - 92, size: 42 };
      this.nextTypeIndex = 0;
      this.pointerX = this.player.x;
      this.updateHud();
    }

    start() {
      this.reset();
      this.running = true;
      requestAnimationFrame(this.loop);
    }

    stop() {
      this.running = false;
    }

    updateHud() {
      if (this.onUpdate) {
        this.onUpdate({ score: this.score, timeLeft: this.timeLeft, best: this.best });
      }
    }

    currentType() {
      return ORDER[this.nextTypeIndex % ORDER.length];
    }

    movePointer(clientX) {
      const rect = this.canvas.getBoundingClientRect();
      const scale = this.canvas.width / rect.width;
      this.pointerX = Math.max(70, Math.min(this.canvas.width - 70, (clientX - rect.left) * scale));
    }

    throwProjectile() {
      if (!this.running) return;
      const key = this.currentType();
      const data = TYPES[key];
      this.projectiles.push({
        kind: key,
        emoji: data.emoji,
        color: data.color,
        x: this.player.x,
        y: this.player.y - 10,
        vy: -9.6,
        radius: 24,
      });
      this.nextTypeIndex += 1;
      window.retroAudio?.throw();
    }

    spawnTarget() {
      const key = ORDER[Math.floor(Math.random() * ORDER.length)];
      const data = TYPES[key];
      const lane = Math.floor(Math.random() * 5);
      const x = 120 + lane * 180;
      this.targets.push({
        kind: key,
        emoji: data.emoji,
        color: data.color,
        x,
        y: -40,
        vy: 1.6 + Math.random() * 1.4 + Math.min(this.score / 80, 1.8),
        phase: Math.random() * Math.PI * 2,
      });
    }

    addBurst(x, y, color, emoji) {
      for (let i = 0; i < 12; i += 1) {
        this.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          life: 24 + Math.random() * 18,
          color,
          emoji: i < 3 ? emoji : '',
        });
      }
    }

    hitTest(a, b) {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.hypot(dx, dy) < 42;
    }

    scoreHit(target, matched) {
      if (matched) {
        this.combo += 1;
        const base = TYPES[target.kind].points;
        const gain = base + Math.min(this.combo * 2, 20);
        this.score += gain;
        this.timeLeft = Math.min(60, this.timeLeft + 1);
        window.retroAudio?.hit();
      } else {
        this.combo = 0;
        this.timeLeft = Math.max(0, this.timeLeft - 2);
        window.retroAudio?.miss();
      }
      this.best = Math.max(this.best, this.score);
      localStorage.setItem('natpro10-best-score', String(this.best));
      this.updateHud();
    }

    update(delta) {
      this.timerAcc += delta;
      this.spawnAcc += delta;

      if (this.timerAcc >= 1000) {
        this.timerAcc -= 1000;
        this.timeLeft -= 1;
        this.updateHud();
        if (this.timeLeft <= 0) {
          this.endGame();
          return;
        }
      }

      const smoothing = Math.min(delta / 16, 2);
      this.player.x += (this.pointerX - this.player.x) * 0.18 * smoothing;

      const spawnEvery = Math.max(440, 920 - Math.min(this.score * 2, 360));
      if (this.spawnAcc >= spawnEvery) {
        this.spawnAcc = 0;
        this.spawnTarget();
      }

      this.projectiles.forEach((p) => {
        p.y += p.vy;
      });
      this.projectiles = this.projectiles.filter((p) => p.y > -60);

      this.targets.forEach((t) => {
        t.y += t.vy;
        t.x += Math.sin(performance.now() * 0.002 + t.phase) * 0.45;
      });

      const escaped = [];
      this.targets = this.targets.filter((t) => {
        if (t.y > this.canvas.height + 50) {
          escaped.push(t);
          return false;
        }
        return true;
      });
      if (escaped.length) {
        this.combo = 0;
        this.timeLeft = Math.max(0, this.timeLeft - escaped.length);
        this.updateHud();
      }

      this.particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
      });
      this.particles = this.particles.filter((p) => p.life > 0);

      for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
        for (let j = this.targets.length - 1; j >= 0; j -= 1) {
          const projectile = this.projectiles[i];
          const target = this.targets[j];
          if (this.hitTest(projectile, target)) {
            const matched = projectile.kind === target.kind;
            this.scoreHit(target, matched);
            this.addBurst(target.x, target.y, matched ? TYPES[target.kind].color : '#ffffff', target.emoji);
            this.projectiles.splice(i, 1);
            this.targets.splice(j, 1);
            break;
          }
        }
      }

      if (this.timeLeft <= 0) {
        this.endGame();
      }
    }

    drawBackground() {
      const ctx = this.ctx;
      const { width, height } = this.canvas;
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#163a6b');
      sky.addColorStop(0.45, '#1b6ca8');
      sky.addColorStop(0.46, '#0f5b7a');
      sky.addColorStop(1, '#082032');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#254d7d';
      ctx.beginPath();
      ctx.moveTo(0, 245);
      ctx.lineTo(120, 205);
      ctx.lineTo(220, 252);
      ctx.lineTo(350, 188);
      ctx.lineTo(470, 238);
      ctx.lineTo(600, 171);
      ctx.lineTo(760, 244);
      ctx.lineTo(width, 184);
      ctx.lineTo(width, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#0b6b80';
      ctx.fillRect(0, height - 170, width, 170);
      for (let i = 0; i < 7; i += 1) {
        ctx.strokeStyle = `rgba(255,255,255,${0.08 + i * 0.015})`;
        ctx.beginPath();
        ctx.moveTo(0, height - 150 + i * 18);
        for (let x = 0; x <= width; x += 30) {
          ctx.lineTo(x, height - 150 + i * 18 + Math.sin((x + performance.now() * 0.12) * 0.03) * 6);
        }
        ctx.stroke();
      }

      ctx.fillStyle = '#3a2a1c';
      ctx.fillRect(0, height - 70, width, 70);

      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      for (let i = 0; i < 12; i += 1) {
        const x = (i * 97 + performance.now() * 0.02) % width;
        const y = 290 + (i % 5) * 42;
        ctx.beginPath();
        ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawPlayer() {
      const ctx = this.ctx;
      const p = this.player;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = '#8b6b4a';
      ctx.fillRect(-18, -42, 36, 62);
      ctx.fillStyle = '#6b4b2a';
      ctx.fillRect(-20, 20, 40, 10);
      ctx.fillStyle = '#13293d';
      ctx.fillRect(-10, -20, 4, 6);
      ctx.fillRect(6, -20, 4, 6);
      ctx.fillRect(-2, -8, 4, 10);
      ctx.restore();

      const next = TYPES[this.currentType()];
      ctx.save();
      ctx.font = '30px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(next.emoji, p.x, p.y - 52);
      ctx.restore();
    }

    drawTarget(t) {
      const ctx = this.ctx;
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.beginPath();
      ctx.roundRect(-28, -28, 56, 56, 16);
      ctx.fill();
      ctx.strokeStyle = t.color;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.font = '34px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.emoji, 0, 4);
      ctx.restore();
    }

    drawProjectile(p) {
      const ctx = this.ctx;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.font = '30px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.emoji, 0, 0);
      ctx.restore();
    }

    drawParticles() {
      const ctx = this.ctx;
      this.particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / 40);
        if (p.emoji) {
          ctx.font = '20px Arial';
          ctx.fillText(p.emoji, p.x, p.y);
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, 4, 4);
        }
        ctx.restore();
      });
    }

    drawLaneHints() {
      const ctx = this.ctx;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      for (let i = 0; i < 5; i += 1) {
        const x = 120 + i * 180;
        ctx.beginPath();
        ctx.moveTo(x, 80);
        ctx.lineTo(x, this.canvas.height - 120);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawHudInside() {
      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = 'rgba(2, 8, 23, 0.52)';
      ctx.fillRect(18, 18, 200, 54);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 18px Arial';
      ctx.fillText(`콤보 ${this.combo}`, 30, 38);
      ctx.font = '14px Arial';
      ctx.fillStyle = '#b9c7d9';
      ctx.fillText('같은 아이콘을 맞혀 시간을 늘리세요', 30, 60);
      ctx.restore();
    }

    draw() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawBackground();
      this.drawLaneHints();
      this.drawPlayer();
      this.targets.forEach((t) => this.drawTarget(t));
      this.projectiles.forEach((p) => this.drawProjectile(p));
      this.drawParticles();
      this.drawHudInside();
    }

    loop(timestamp) {
      if (!this.running) return;
      if (!this.lastTime) this.lastTime = timestamp;
      const delta = Math.min(32, timestamp - this.lastTime);
      this.lastTime = timestamp;
      this.update(delta);
      this.draw();
      if (this.running) {
        requestAnimationFrame(this.loop);
      }
    }

    endGame() {
      this.running = false;
      window.retroAudio?.end();
      if (this.onGameOver) {
        this.onGameOver({ score: this.score });
      }
    }
  }

  window.JejuGame = JejuGame;
})();
