window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const scoreEl = document.getElementById('score');
  const timerEl = document.getElementById('timer');
  const bestEl = document.getElementById('bestScore');
  const finalScoreEl = document.getElementById('finalScore');
  const startOverlay = document.getElementById('startOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');
  const muteBtn = document.getElementById('muteBtn');

  const game = new window.JejuGame(
    canvas,
    ({ score, timeLeft, best }) => {
      scoreEl.textContent = String(score);
      timerEl.textContent = String(timeLeft);
      bestEl.textContent = String(best);
    },
    ({ score }) => {
      finalScoreEl.textContent = String(score);
      gameOverOverlay.classList.add('show');
    }
  );

  bestEl.textContent = String(Number(localStorage.getItem('natpro10-best-score') || 0));

  const unlockAudio = () => {
    window.retroAudio?.warmupAndStart();
  };

  const startGame = () => {
    unlockAudio();
    startOverlay.classList.remove('show');
    gameOverOverlay.classList.remove('show');
    game.start();
  };

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);

  muteBtn.addEventListener('click', () => {
    const enabled = window.retroAudio?.toggle();
    muteBtn.textContent = enabled ? '사운드 끄기' : '사운드 켜기';
  });

  canvas.addEventListener('pointermove', (event) => {
    game.movePointer(event.clientX);
  });

  canvas.addEventListener('pointerdown', (event) => {
    unlockAudio();
    game.movePointer(event.clientX);
    if (!startOverlay.classList.contains('show') && !gameOverOverlay.classList.contains('show')) {
      game.throwProjectile();
    }
  });

  document.addEventListener('pointerdown', () => {
    if (startOverlay.classList.contains('show')) {
      unlockAudio();
    }
  }, { once: true });

  document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      event.preventDefault();
      unlockAudio();
      if (startOverlay.classList.contains('show') || gameOverOverlay.classList.contains('show')) {
        startGame();
      } else {
        game.throwProjectile();
      }
    }
    if (event.code === 'ArrowLeft') {
      game.pointerX = Math.max(70, game.pointerX - 32);
    }
    if (event.code === 'ArrowRight') {
      game.pointerX = Math.min(canvas.width - 70, game.pointerX + 32);
    }
  });
});
