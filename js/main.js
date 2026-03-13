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

  const startGame = () => {
    startOverlay.classList.remove('show');
    gameOverOverlay.classList.remove('show');
    window.retroAudio?.start();
    game.start();
  };

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);

  muteBtn.addEventListener('click', () => {
    const enabled = window.retroAudio?.toggle();
    muteBtn.textContent = enabled ? '사운드 끄기' : '사운드 켜기';
  });

  const throwAction = (event) => {
    if (event?.target?.closest?.('button')) return;
    game.throwProjectile();
  };

  canvas.addEventListener('pointerdown', throwAction);
  document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      event.preventDefault();
      if (startOverlay.classList.contains('show') || gameOverOverlay.classList.contains('show')) {
        startGame();
      } else {
        game.throwProjectile();
      }
    }
  });
});
