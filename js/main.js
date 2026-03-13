// 메인 애플리케이션 컨트롤러
class GameApp {
    constructor() {
        this.currentScreen = 'title';
        this.playerEmail = '';
        this.titleBackground = null;
        this.game = null;
        
        this.init();
    }
    
    init() {
        // 화면 요소
        this.screens = {
            title: document.getElementById('title-screen'),
            email: document.getElementById('email-screen'),
            game: document.getElementById('game-screen'),
            ranking: document.getElementById('ranking-screen')
        };
        
        // 캔버스 초기화
        this.titleCanvas = document.getElementById('title-canvas');
        this.gameCanvas = document.getElementById('game-canvas');
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 타이틀 화면 시작
        this.showScreen('title');
        this.startTitleAnimation();
    }
    
    setupEventListeners() {
        // 타이틀 화면 클릭
        this.screens.title.addEventListener('click', (e) => {
            if (e.target.id === 'sound-toggle') return;
            this.handleTitleClick();
        });
        
        this.screens.title.addEventListener('touchstart', (e) => {
            if (e.target.id === 'sound-toggle') return;
            e.preventDefault();
            this.handleTitleClick();
        });
        
        // 사운드 토글
        document.getElementById('sound-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSound();
        });
        
        // 이메일 입력 폼
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.handleEmailSubmit();
        });
        
        document.getElementById('email-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleEmailSubmit();
            }
        });
        
        // 재시작 버튼
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });
    }
    
    handleTitleClick() {
        // 오디오 초기화 및 BGM 재생
        retroAudio.init();
        retroAudio.playBGM();
        
        this.showScreen('email');
        this.stopTitleAnimation();
        
        // 이메일 입력 필드 포커스
        setTimeout(() => {
            document.getElementById('email-input').focus();
        }, 300);
    }
    
    toggleSound() {
        const isMuted = retroAudio.toggleMute();
        document.getElementById('sound-toggle').textContent = isMuted ? '🔇' : '🔊';
        
        if (!isMuted && this.currentScreen === 'title') {
            retroAudio.init();
            retroAudio.playBGM();
        }
    }
    
    handleEmailSubmit() {
        const emailInput = document.getElementById('email-input');
        const errorElement = document.getElementById('email-error');
        const email = emailInput.value.trim();
        
        // 이메일 유효성 검사
        if (!email) {
            errorElement.textContent = '이메일을 입력해주세요';
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errorElement.textContent = '올바른 이메일 형식이 아닙니다';
            return;
        }
        
        this.playerEmail = email;
        errorElement.textContent = '';
        
        // 게임 시작
        this.startGame();
    }
    
    startGame() {
        this.showScreen('game');
        retroAudio.stopBGM();
        
        // 게임 초기화
        this.game = new JejuGame(this.gameCanvas);
        this.game.onGameOver = (score) => this.handleGameOver(score);
        
        // 점수 초기화
        document.getElementById('score').textContent = '0';
        
        // 게임 시작
        setTimeout(() => {
            this.game.start();
        }, 500);
    }
    
    async handleGameOver(score) {
        // 점수 저장
        await this.saveScore(this.playerEmail, score);
        
        // 최종 점수 표시
        document.getElementById('final-score-value').textContent = score;
        
        // 랭킹 로드 및 표시
        await this.loadAndShowRanking(score);
        
        this.showScreen('ranking');
    }
    
    async saveScore(email, score) {
        try {
            const response = await fetch('tables/players', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    score: score,
                    played_at: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to save score');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error saving score:', error);
        }
    }
    
    async loadAndShowRanking(currentScore) {
        try {
            // 상위 점수 가져오기
            const response = await fetch('tables/players?sort=-score&limit=100');
            const result = await response.json();
            
            // 중복 이메일 제거 (각 이메일당 최고 점수만)
            const emailScores = {};
            result.data.forEach(record => {
                if (!emailScores[record.email] || record.score > emailScores[record.email].score) {
                    emailScores[record.email] = record;
                }
            });
            
            // 배열로 변환하고 점수순 정렬
            const rankings = Object.values(emailScores)
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);
            
            this.displayRanking(rankings, currentScore);
        } catch (error) {
            console.error('Error loading ranking:', error);
            this.displayRanking([], currentScore);
        }
    }
    
    displayRanking(rankings, currentScore) {
        const rankingList = document.getElementById('ranking-list');
        rankingList.innerHTML = '';
        
        if (rankings.length === 0) {
            rankingList.innerHTML = '<p style="color: #666; font-size: 10px;">아직 기록이 없습니다</p>';
            return;
        }
        
        rankings.forEach((record, index) => {
            const item = document.createElement('div');
            item.className = 'ranking-item';
            
            // 현재 플레이어 하이라이트
            if (record.email === this.playerEmail && record.score === currentScore) {
                item.classList.add('current-player');
            }
            
            // 순위 메달
            let rankClass = '';
            let rankText = `${index + 1}`;
            if (index === 0) {
                rankClass = 'gold';
                rankText = '🥇';
            } else if (index === 1) {
                rankClass = 'silver';
                rankText = '🥈';
            } else if (index === 2) {
                rankClass = 'bronze';
                rankText = '🥉';
            }
            
            // 이메일 마스킹 (보안)
            const maskedEmail = this.maskEmail(record.email);
            
            item.innerHTML = `
                <span class="rank ${rankClass}">${rankText}</span>
                <span class="email">${maskedEmail}</span>
                <span class="score">${record.score}</span>
            `;
            
            rankingList.appendChild(item);
        });
    }
    
    maskEmail(email) {
        const [local, domain] = email.split('@');
        if (local.length <= 3) {
            return local.charAt(0) + '***@' + domain;
        }
        return local.substring(0, 3) + '***@' + domain;
    }
    
    restartGame() {
        this.showScreen('email');
        document.getElementById('email-input').value = this.playerEmail;
    }
    
    showScreen(screenName) {
        Object.keys(this.screens).forEach(name => {
            this.screens[name].classList.remove('active');
        });
        this.screens[screenName].classList.add('active');
        this.currentScreen = screenName;
    }
    
    startTitleAnimation() {
        this.titleBackground = new TitleBackground(this.titleCanvas);
        this.titleBackground.animate();
    }
    
    stopTitleAnimation() {
        if (this.titleBackground) {
            this.titleBackground.stop();
        }
    }
}

// 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    window.gameApp = new GameApp();
});

// PWA 지원을 위한 서비스 워커 등록 (선택사항)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // 서비스 워커는 HTTPS에서만 작동
        // navigator.serviceWorker.register('/sw.js');
    });
}
