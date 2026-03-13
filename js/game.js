(function () {
  class JejuGame {
    constructor(canvas, onUpdate, onGameOver) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.onUpdate = onUpdate;
      this.onGameOver = onGameOver;
      this.reset();
      this.loop = this.loop.bind(this);
    }

    reset() {
      this.running = false;
      this.score = 0;
      this.best = Number(localStorage.getItem('natpro10-best-score') || 0);
      this.timeLeft = 45;
      this.lastTime = 0;
      this.timerAcc = 0;
      this.spawnAcc = 0;
      this.projectiles = [];
      this.targets = [];
      this.particles = [];
      this.player = { x: 110, y: this.canvas.height - 110, size: 34 };
      this.wave = 0;
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

    throwProjectile() {
      if (!this.running) return;
      this.projectiles.push({
        x: this.player.x + 26,
        y: this.player.y - 24,
        vx: 7.8,
        vy: -8.8,
        radius: 13,
        rotation: 0,
      });
      window.retroAudio?.throw();
    }

    spawnTarget() {
      const types = [
        { name: 'octopus', color: '#fb7185', points: 12, size: 34 },
        { name: 'turtle', color: '#5eead4', points: 10, size: 38 },
        { name: 'hallabong', color: '#fbbf24', points: 8, size: 28 },
      ];
      const type = types[Math.floor(Math.random() * types.length)];
      const y = 110 + Math.random() * (this.canvas.height - 260);
      const speed = 2.5 + Math.random() * 2.2 + this.wave * 0.06;
      this.targets.push({
        ...type,
        x: this.canvas.width + 50,
        y,
        speed,
        wobble: Math.random() * Math.PI * 2,
      });
    }

    addBurst(x, y, color) {
      for (let i = 0; i < 10; i += 1) {
        this.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          life: 28 + Math.random() * 16,
          color,
        });
      }
    }

    hitTest(p, t) {
      const dx = p.x - t.x;
      const dy = p.y - t.y;
      const dist = Math.hypot(dx, dy);
      return dist < p.radius + t.size * 0.55;
    }

    update(delta) {
      this.timerAcc += delta;
      this.spawnAcc += delta;
      this.wave += delta * 0.001;

      if (this.timerAcc >= 1000) {
        this.timerAcc -= 1000;
        this.timeLeft -= 1;
        this.updateHud();
        if (this.timeLeft <= 0) {
          this.endGame();
          return;
        }
      }

      const spawnEvery = Math.max(450, 1000 - this.wave * 40);
      if (this.spawnAcc >= spawnEvery) {
        this.spawnAcc = 0;
        this.spawnTarget();
      }

      this.projectiles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.24;
        p.rotation += 0.2;
      });
      this.projectiles = this.projectiles.filter((p) => p.x < this.canvas.width + 40 && p.y < this.canvas.height + 40);

      this.targets.forEach((t) => {
        t.x -= t.speed;
        t.y += Math.sin((performance.now() * 0.003) + t.wobble) * 0.6;
      });
      this.targets = this.targets.filter((t) => t.x > -60);

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
            this.score += target.points;
            this.best = Math.max(this.best, this.score);
            localStorage.setItem('natpro10-best-score', String(this.best));
            this.addBurst(target.x, target.y, target.color);
            this.projectiles.splice(i, 1);
            this.targets.splice(j, 1);
            this.updateHud();
            window.retroAudio?.hit();
            break;
          }
        }
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
      ctx.moveTo(0, 250);
      ctx.lineTo(120, 210);
      ctx.lineTo(220, 255);
      ctx.lineTo(350, 190);
      ctx.lineTo(470, 240);
      ctx.lineTo(600, 175);
      ctx.lineTo(760, 245);
      ctx.lineTo(width, 190);
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
    }

    drawProjectile(p) {
      const ctx = this.ctx;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = '#d6b38b';
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8b6b4a';
      ctx.fillRect(-4, -2, 8, 4);
      ctx.restore();
    }

    drawTarget(t) {
      const ctx = this.ctx;
      ctx.save();
      ctx.translate(t.x, t.y);
      if (t.name === 'octopus') {
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.arc(0, 0, t.size * 0.45, Math.PI, Math.PI * 2);
        ctx.fill();
        for (let i = -3; i <= 3; i += 1) {
          ctx.strokeStyle = t.color;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(i * 6, 2);
          ctx.quadraticCurveTo(i * 7, 18, i * 4, 30);
          ctx.stroke();
        }
      } else if (t.name === 'turtle') {
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, t.size * 0.55, t.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-10, -6, 20, 12);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(t.size * 0.45, -5, 10, 10);
      } else {
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.arc(0, 0, t.size * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(-3, -t.size * 0.58, 6, 10);
      }
      ctx.restore();
    }

    drawParticles() {
      const ctx = this.ctx;
      this.particles.forEach((p) => {
        ctx.globalAlpha = Math.max(0, p.life / 40);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
      ctx.globalAlpha = 1;
    }

    draw() {
      this.drawBackground();
      this.drawPlayer();
      this.targets.forEach((t) => this.drawTarget(t));
      this.projectiles.forEach((p) => this.drawProjectile(p));
      this.drawParticles();
    }

    loop(timestamp) {
      if (!this.running) return;
      if (!this.lastTime) this.lastTime = timestamp;
      const delta = Math.min(32, timestamp - this.lastTime);
      this.lastTime = timestamp;
      this.update(delta);
      this.draw();
      if (this.running) requestAnimationFrame(this.loop);
    }

    endGame() {
      this.running = false;
      localStorage.setItem('natpro10-best-score', String(this.best));
      window.retroAudio?.end();
      if (this.onGameOver) {
        this.onGameOver({ score: this.score, best: this.best });
      }
    }
  }

  window.JejuGame = JejuGame;
})();
