// 제주도 게임 - 메인 게임 로직
class JejuGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        
        // 게임 상태
        this.score = 0;
        this.isRunning = false;
        this.gameOver = false;
        this.lastTime = 0;
        this.spawnTimer = 0;
        this.difficultyTimer = 0;
        
        // 게임 설정
        this.gravity = 0.4;
        this.throwPower = -12;
        this.spawnInterval = 1500;
        this.minSpawnInterval = 600;
        this.itemSpeed = 2;
        this.maxItemSpeed = 6;
        
        // 돌하르방 (플레이어)
        this.player = {
            x: 0,
            y: 0,
            width: 60,
            height: 80,
            velocityY: 0,
            isThrown: false,
            rotation: 0
        };
        
        // 게임 오브젝트 배열
        this.items = [];  // 한라봉 (좋은 아이템)
        this.enemies = []; // 문어, 거북이 (피해야 할 것)
        
        // 배경 요소
        this.clouds = [];
        this.waves = [];
        this.initBackground();
        
        // 이벤트 바인딩
        this.handleInput = this.handleInput.bind(this);
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.groundY = this.canvas.height * 0.75;
        this.player.x = this.canvas.width / 2 - this.player.width / 2;
        this.player.y = this.groundY - this.player.height;
    }
    
    initBackground() {
        // 구름 생성
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.canvas.height * 0.3),
                width: 60 + Math.random() * 40,
                speed: 0.3 + Math.random() * 0.3
            });
        }
        
        // 파도 생성
        for (let i = 0; i < 3; i++) {
            this.waves.push({
                offset: i * 100,
                amplitude: 5 + i * 3
            });
        }
    }
    
    start() {
        this.isRunning = true;
        this.gameOver = false;
        this.score = 0;
        this.items = [];
        this.enemies = [];
        this.spawnTimer = 0;
        this.difficultyTimer = 0;
        this.spawnInterval = 1500;
        this.itemSpeed = 2;
        
        this.player.y = this.groundY - this.player.height;
        this.player.velocityY = 0;
        this.player.isThrown = false;
        this.player.rotation = 0;
        
        this.canvas.addEventListener('click', this.handleInput);
        this.canvas.addEventListener('touchstart', this.handleInput);
        
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        this.canvas.removeEventListener('click', this.handleInput);
        this.canvas.removeEventListener('touchstart', this.handleInput);
    }
    
    handleInput(e) {
        e.preventDefault();
        if (this.gameOver) return;
        
        // 돌하르방 던지기
        this.player.velocityY = this.throwPower;
        this.player.isThrown = true;
        retroAudio.playThrowSound();
    }
    
    spawnItem() {
        const side = Math.random() > 0.5 ? 'left' : 'right';
        const type = Math.random();
        
        let item;
        
        if (type < 0.6) {
            // 한라봉 (60% 확률)
            item = {
                type: 'hallabong',
                x: side === 'left' ? -40 : this.canvas.width + 40,
                y: this.groundY - 100 - Math.random() * 200,
                width: 40,
                height: 40,
                speed: (side === 'left' ? 1 : -1) * (this.itemSpeed + Math.random() * 2),
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.1
            };
            this.items.push(item);
        } else if (type < 0.8) {
            // 문어 (20% 확률)
            item = {
                type: 'octopus',
                x: side === 'left' ? -50 : this.canvas.width + 50,
                y: this.groundY - 80 - Math.random() * 150,
                width: 50,
                height: 50,
                speed: (side === 'left' ? 1 : -1) * (this.itemSpeed + Math.random()),
                frame: 0,
                frameTimer: 0
            };
            this.enemies.push(item);
        } else {
            // 거북이 (20% 확률)
            item = {
                type: 'turtle',
                x: side === 'left' ? -50 : this.canvas.width + 50,
                y: this.groundY - 60 - Math.random() * 100,
                width: 55,
                height: 40,
                speed: (side === 'left' ? 1 : -1) * (this.itemSpeed * 0.7),
                frame: 0,
                frameTimer: 0
            };
            this.enemies.push(item);
        }
    }
    
    update(deltaTime) {
        if (this.gameOver) return;
        
        // 난이도 증가
        this.difficultyTimer += deltaTime;
        if (this.difficultyTimer > 5000) {
            this.difficultyTimer = 0;
            this.spawnInterval = Math.max(this.minSpawnInterval, this.spawnInterval - 100);
            this.itemSpeed = Math.min(this.maxItemSpeed, this.itemSpeed + 0.3);
        }
        
        // 아이템/적 스폰
        this.spawnTimer += deltaTime;
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnItem();
        }
        
        // 플레이어 물리
        if (this.player.isThrown) {
            this.player.velocityY += this.gravity;
            this.player.y += this.player.velocityY;
            this.player.rotation += this.player.velocityY * 0.02;
            
            // 바닥 충돌
            if (this.player.y >= this.groundY - this.player.height) {
                this.player.y = this.groundY - this.player.height;
                this.player.velocityY = 0;
                this.player.isThrown = false;
                this.player.rotation = 0;
            }
            
            // 천장 충돌
            if (this.player.y < 50) {
                this.player.y = 50;
                this.player.velocityY = Math.abs(this.player.velocityY) * 0.5;
            }
        }
        
        // 아이템 업데이트 및 충돌 체크
        this.items = this.items.filter(item => {
            item.x += item.speed;
            item.rotation += item.rotationSpeed;
            
            // 충돌 체크
            if (this.checkCollision(this.player, item)) {
                this.score += 10;
                document.getElementById('score').textContent = this.score;
                retroAudio.playCollectSound();
                this.showScorePopup(item.x, item.y, '+10');
                return false;
            }
            
            // 화면 밖으로 나가면 제거
            return item.x > -60 && item.x < this.canvas.width + 60;
        });
        
        // 적 업데이트 및 충돌 체크
        this.enemies = this.enemies.filter(enemy => {
            enemy.x += enemy.speed;
            enemy.frameTimer += deltaTime;
            if (enemy.frameTimer > 200) {
                enemy.frameTimer = 0;
                enemy.frame = (enemy.frame + 1) % 2;
            }
            
            // 충돌 체크
            if (this.checkCollision(this.player, enemy)) {
                this.endGame();
                return false;
            }
            
            return enemy.x > -60 && enemy.x < this.canvas.width + 60;
        });
        
        // 구름 업데이트
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x > this.canvas.width + 100) {
                cloud.x = -100;
            }
        });
    }
    
    checkCollision(a, b) {
        const padding = 10;
        return a.x + padding < b.x + b.width - padding &&
               a.x + a.width - padding > b.x + padding &&
               a.y + padding < b.y + b.height - padding &&
               a.y + a.height - padding > b.y + padding;
    }
    
    showScorePopup(x, y, text) {
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = text;
        popup.style.left = x + 'px';
        popup.style.top = y + 'px';
        document.getElementById('game-screen').appendChild(popup);
        
        setTimeout(() => popup.remove(), 1000);
    }
    
    endGame() {
        this.gameOver = true;
        this.isRunning = false;
        retroAudio.playGameOverSound();
        retroAudio.stopBGM();
        
        // 화면 플래시 효과
        this.canvas.classList.add('game-over-flash');
        setTimeout(() => this.canvas.classList.remove('game-over-flash'), 500);
        
        // 게임 종료 콜백
        if (this.onGameOver) {
            setTimeout(() => this.onGameOver(this.score), 1000);
        }
    }
    
    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 하늘 그라데이션
        const skyGradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.5, '#4a90a4');
        skyGradient.addColorStop(1, '#2c5f7c');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 태양
        this.drawSun(ctx);
        
        // 구름
        this.clouds.forEach(cloud => this.drawCloud(ctx, cloud));
        
        // 한라산 (배경)
        this.drawMountain(ctx);
        
        // 바다/땅
        this.drawGround(ctx);
        
        // 아이템 (한라봉)
        this.items.forEach(item => this.drawHallabong(ctx, item));
        
        // 적 (문어, 거북이)
        this.enemies.forEach(enemy => {
            if (enemy.type === 'octopus') {
                this.drawOctopus(ctx, enemy);
            } else {
                this.drawTurtle(ctx, enemy);
            }
        });
        
        // 플레이어 (돌하르방)
        this.drawDolhareubang(ctx, this.player);
    }
    
    drawSun(ctx) {
        const x = this.canvas.width - 100;
        const y = 80;
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x, y, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // 광선
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * 50, y + Math.sin(angle) * 50);
            ctx.lineTo(x + Math.cos(angle) * 65, y + Math.sin(angle) * 65);
            ctx.stroke();
        }
    }
    
    drawCloud(ctx, cloud) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.width * 0.3, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width * 0.3, cloud.y - 10, cloud.width * 0.25, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width * 0.5, cloud.y, cloud.width * 0.35, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width * 0.3, cloud.y + 5, cloud.width * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawMountain(ctx) {
        // 한라산
        ctx.fillStyle = '#4a7c59';
        ctx.beginPath();
        ctx.moveTo(this.canvas.width * 0.2, this.groundY);
        ctx.lineTo(this.canvas.width * 0.5, this.groundY - 200);
        ctx.lineTo(this.canvas.width * 0.8, this.groundY);
        ctx.fill();
        
        // 산 정상 (백록담 표현)
        ctx.fillStyle = '#6b9b7a';
        ctx.beginPath();
        ctx.moveTo(this.canvas.width * 0.4, this.groundY - 150);
        ctx.lineTo(this.canvas.width * 0.5, this.groundY - 180);
        ctx.lineTo(this.canvas.width * 0.6, this.groundY - 150);
        ctx.fill();
        
        // 눈
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(this.canvas.width * 0.45, this.groundY - 170);
        ctx.lineTo(this.canvas.width * 0.5, this.groundY - 200);
        ctx.lineTo(this.canvas.width * 0.55, this.groundY - 170);
        ctx.fill();
    }
    
    drawGround(ctx) {
        // 바다
        const time = Date.now() * 0.002;
        ctx.fillStyle = '#1e5f74';
        ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);
        
        // 파도
        ctx.fillStyle = '#2980b9';
        ctx.beginPath();
        ctx.moveTo(0, this.groundY);
        for (let x = 0; x <= this.canvas.width; x += 20) {
            const y = this.groundY + Math.sin(x * 0.02 + time) * 8;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(this.canvas.width, this.groundY + 30);
        ctx.lineTo(0, this.groundY + 30);
        ctx.fill();
        
        // 해변 모래
        ctx.fillStyle = '#f4d03f';
        ctx.fillRect(0, this.groundY + 25, this.canvas.width, 10);
    }
    
    // 돌하르방 그리기 (8비트 스타일)
    drawDolhareubang(ctx, player) {
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        ctx.rotate(player.rotation);
        
        const x = -player.width / 2;
        const y = -player.height / 2;
        
        // 몸통 (회색 돌)
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(x + 10, y + 30, 40, 50);
        
        // 머리
        ctx.fillStyle = '#6b6b6b';
        ctx.beginPath();
        ctx.ellipse(x + 30, y + 25, 25, 28, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 모자 (갓)
        ctx.fillStyle = '#2c2c2c';
        ctx.fillRect(x + 5, y, 50, 12);
        ctx.fillRect(x + 15, y - 8, 30, 10);
        
        // 눈
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x + 18, y + 18, 8, 8);
        ctx.fillRect(x + 34, y + 18, 8, 8);
        
        // 코
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(x + 26, y + 28, 8, 12);
        
        // 손 (양 옆으로)
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(x, y + 40, 12, 20);
        ctx.fillRect(x + 48, y + 40, 12, 20);
        
        ctx.restore();
    }
    
    // 한라봉 그리기
    drawHallabong(ctx, item) {
        ctx.save();
        ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
        ctx.rotate(item.rotation);
        
        // 오렌지색 몸체
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.ellipse(0, 0, item.width / 2, item.height / 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 위쪽 돌기
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.ellipse(0, -item.height / 2.5, item.width / 4, item.height / 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 잎
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.ellipse(0, -item.height / 2, 8, 5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        
        // 하이라이트
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(-5, -5, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    // 문어 그리기
    drawOctopus(ctx, enemy) {
        const x = enemy.x;
        const y = enemy.y;
        const bounce = enemy.frame === 0 ? 0 : 3;
        
        // 머리
        ctx.fillStyle = '#E91E63';
        ctx.beginPath();
        ctx.ellipse(x + 25, y + 15 - bounce, 22, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 다리 (8개)
        ctx.fillStyle = '#C2185B';
        const legOffset = enemy.frame === 0 ? 0 : 5;
        for (let i = 0; i < 4; i++) {
            const legX = x + 8 + i * 12;
            ctx.beginPath();
            ctx.moveTo(legX, y + 25);
            ctx.quadraticCurveTo(legX + (i % 2 === 0 ? legOffset : -legOffset), y + 40, legX, y + 50);
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#C2185B';
            ctx.stroke();
        }
        
        // 눈
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + 15, y + 8, 8, 10);
        ctx.fillRect(x + 27, y + 8, 8, 10);
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 17, y + 12, 4, 5);
        ctx.fillRect(x + 29, y + 12, 4, 5);
    }
    
    // 거북이 그리기
    drawTurtle(ctx, enemy) {
        const x = enemy.x;
        const y = enemy.y;
        const flip = enemy.speed > 0 ? 1 : -1;
        
        ctx.save();
        ctx.translate(x + enemy.width / 2, y + enemy.height / 2);
        ctx.scale(flip, 1);
        ctx.translate(-enemy.width / 2, -enemy.height / 2);
        
        const legMove = enemy.frame === 0 ? 0 : 5;
        
        // 다리
        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(5 - legMove, 25, 12, 15);
        ctx.fillRect(38 + legMove, 25, 12, 15);
        ctx.fillRect(10, 0, 10, 12);
        ctx.fillRect(35, 0, 10, 12);
        
        // 등껍질
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.ellipse(27, 20, 25, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 등껍질 무늬
        ctx.fillStyle = '#388E3C';
        ctx.beginPath();
        ctx.arc(27, 20, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2E7D32';
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(27 + Math.cos(angle) * 18, 20 + Math.sin(angle) * 13, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 머리
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.ellipse(55, 20, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 눈
        ctx.fillStyle = '#000000';
        ctx.fillRect(57, 17, 3, 3);
        
        ctx.restore();
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 타이틀 화면 배경 애니메이션
class TitleBackground {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        this.time = 0;
        this.clouds = [];
        this.stars = [];
        
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: 50 + Math.random() * 100,
                width: 60 + Math.random() * 40,
                speed: 0.5 + Math.random() * 0.5
            });
        }
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.groundY = this.canvas.height * 0.7;
    }
    
    draw() {
        const ctx = this.ctx;
        this.time += 0.02;
        
        // 하늘
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.4, '#4a90a4');
        gradient.addColorStop(1, '#2c5f7c');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 태양
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.canvas.width - 100, 100, 50, 0, Math.PI * 2);
        ctx.fill();
        
        // 구름
        ctx.fillStyle = '#FFFFFF';
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x > this.canvas.width + 100) cloud.x = -100;
            
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.width * 0.3, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width * 0.3, cloud.y - 10, cloud.width * 0.25, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width * 0.5, cloud.y, cloud.width * 0.35, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // 한라산
        ctx.fillStyle = '#4a7c59';
        ctx.beginPath();
        ctx.moveTo(this.canvas.width * 0.1, this.groundY);
        ctx.lineTo(this.canvas.width * 0.5, this.groundY - 250);
        ctx.lineTo(this.canvas.width * 0.9, this.groundY);
        ctx.fill();
        
        // 산 정상
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(this.canvas.width * 0.45, this.groundY - 220);
        ctx.lineTo(this.canvas.width * 0.5, this.groundY - 250);
        ctx.lineTo(this.canvas.width * 0.55, this.groundY - 220);
        ctx.fill();
        
        // 바다
        ctx.fillStyle = '#1e5f74';
        ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height);
        
        // 파도 애니메이션
        ctx.fillStyle = '#2980b9';
        ctx.beginPath();
        ctx.moveTo(0, this.groundY);
        for (let x = 0; x <= this.canvas.width; x += 15) {
            ctx.lineTo(x, this.groundY + Math.sin(x * 0.02 + this.time) * 10);
        }
        ctx.lineTo(this.canvas.width, this.groundY + 40);
        ctx.lineTo(0, this.groundY + 40);
        ctx.fill();
        
        // 돌하르방들 (장식)
        this.drawMiniDolhareubang(ctx, this.canvas.width * 0.15, this.groundY - 60, 0.8);
        this.drawMiniDolhareubang(ctx, this.canvas.width * 0.85, this.groundY - 50, 0.7);
        
        // 한라봉 나무
        this.drawHallabongTree(ctx, this.canvas.width * 0.75, this.groundY - 30);
    }
    
    drawMiniDolhareubang(ctx, x, y, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        // 몸통
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(-15, 20, 30, 40);
        
        // 머리
        ctx.fillStyle = '#6b6b6b';
        ctx.beginPath();
        ctx.ellipse(0, 10, 20, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 모자
        ctx.fillStyle = '#2c2c2c';
        ctx.fillRect(-22, -15, 44, 10);
        ctx.fillRect(-12, -22, 24, 8);
        
        // 눈
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-10, 3, 6, 6);
        ctx.fillRect(4, 3, 6, 6);
        
        ctx.restore();
    }
    
    drawHallabongTree(ctx, x, y) {
        // 나무 줄기
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - 8, y, 16, 40);
        
        // 잎
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(x, y - 20, 35, 0, Math.PI * 2);
        ctx.fill();
        
        // 한라봉
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.arc(x - 15, y - 10, 8, 0, Math.PI * 2);
        ctx.arc(x + 10, y - 25, 7, 0, Math.PI * 2);
        ctx.arc(x + 5, y - 5, 6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    animate() {
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}
