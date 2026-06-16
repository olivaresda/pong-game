// Retro Neon Pong - Game Logic
// Creado con Web Audio API y sistema de partículas

class SoundEffects {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playHitPaddle() {
        if (!this.enabled) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(560, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playHitWall() {
        if (!this.enabled) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playScore() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        
        const playNote = (freq, start, duration, vol) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(vol, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
            osc.start(start);
            osc.stop(start + duration);
        };
        
        playNote(523.25, now, 0.08, 0.06);     // C5
        playNote(659.25, now + 0.08, 0.12, 0.06); // E5
    }

    playGameOver(win) {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        
        const playNote = (freq, start, duration, vol) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(vol, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
            osc.start(start);
            osc.stop(start + duration);
        };
        
        if (win) {
            playNote(523.25, now, 0.08, 0.06);
            playNote(659.25, now + 0.08, 0.08, 0.06);
            playNote(783.99, now + 0.16, 0.08, 0.06);
            playNote(1046.50, now + 0.24, 0.3, 0.06);
        } else {
            playNote(392.00, now, 0.12, 0.06);
            playNote(349.23, now + 0.12, 0.12, 0.06);
            playNote(311.13, now + 0.24, 0.15, 0.06);
            playNote(246.94, now + 0.39, 0.35, 0.06);
        }
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 2;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6;
        this.color = color;
        this.alpha = 1;
        this.decay = Math.random() * 0.025 + 0.015;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Game Settings & Objects
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const sound = new SoundEffects();

const WINNING_SCORE = 10;
let gameState = 'start-screen'; // 'start-screen', 'playing', 'paused', 'game-over'
let gameMode = 'vs-cpu'; // 'vs-cpu', 'pvp'
let difficulty = 'medium'; // 'easy', 'medium', 'hard', 'impossible'
let winner = null;
let gameTime = 0;

const diffSettings = {
    easy: { speed: 3.5, error: 40, responseDelay: 0.12 },
    medium: { speed: 5.5, error: 22, responseDelay: 0.06 },
    hard: { speed: 8.5, error: 8, responseDelay: 0.02 },
    impossible: { speed: 14, error: 0, responseDelay: 0 }
};

const paddleWidth = 12;
const paddleHeight = 85;

const player1 = {
    x: 25,
    y: canvas.height / 2 - paddleHeight / 2,
    score: 0,
    color: ''
};

const player2 = {
    x: canvas.width - 25 - paddleWidth,
    y: canvas.height / 2 - paddleHeight / 2,
    score: 0,
    color: ''
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 7,
    vx: 0,
    vy: 0,
    baseSpeed: 5,
    speed: 5,
    maxSpeed: 15,
    color: ''
};

let particles = [];
const keys = {};
let useMouseControl = false;

// Helper to get CSS theme colors dynamically
function updateColorsFromCSS() {
    const style = getComputedStyle(document.documentElement);
    player1.color = style.getPropertyValue('--color-player1').trim() || '#ff007f';
    player2.color = style.getPropertyValue('--color-player2').trim() || '#00f0ff';
    ball.color = style.getPropertyValue('--color-ball').trim() || '#ffffff';
}

// Setup input listeners
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    keys[e.key] = true;
    
    if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePause();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    keys[e.key] = false;
});

// Setup Mouse Control listener
canvas.addEventListener('mousemove', (e) => {
    if (!useMouseControl || gameState !== 'playing') return;
    
    // Get mouse position relative to canvas container
    const rect = canvas.getBoundingClientRect();
    const relativeY = (e.clientY - rect.top) / rect.height;
    
    // Convert to logical canvas resolution (450px height)
    const canvasY = relativeY * canvas.height;
    
    // Center the paddle on the mouse cursor
    player1.y = canvasY - paddleHeight / 2;
    
    // Clamp to screen limits
    player1.y = Math.max(0, Math.min(canvas.height - paddleHeight, player1.y));
});

// Setup Control Panel Handlers
document.getElementById('btnModeVsCpu').addEventListener('click', () => {
    setGameMode('vs-cpu');
});
document.getElementById('btnModePvp').addEventListener('click', () => {
    setGameMode('pvp');
});

document.getElementById('btnDiffEasy').addEventListener('click', () => setDifficulty('easy'));
document.getElementById('btnDiffMedium').addEventListener('click', () => setDifficulty('medium'));
document.getElementById('btnDiffHard').addEventListener('click', () => setDifficulty('hard'));
document.getElementById('btnDiffImpossible').addEventListener('click', () => setDifficulty('impossible'));

// Setup Themes
const themeButtons = [
    { btn: document.getElementById('btnThemeCyber'), name: 'cyberpunk' },
    { btn: document.getElementById('btnThemeMatrix'), name: 'matrix' },
    { btn: document.getElementById('btnThemeAmber'), name: 'amber' }
];

themeButtons.forEach(item => {
    item.btn.addEventListener('click', () => {
        themeButtons.forEach(i => i.btn.classList.remove('active'));
        item.btn.classList.add('active');
        
        document.body.className = '';
        document.body.classList.add(`theme-${item.name}`);
        
        // Brief delay to allow CSS transitions to apply
        setTimeout(updateColorsFromCSS, 20);
    });
});

// Setup Audio Toggle
const soundToggle = document.getElementById('soundToggle');
soundToggle.addEventListener('change', (e) => {
    sound.enabled = e.target.checked;
});

// Setup Mouse Control Toggle
const mouseToggle = document.getElementById('mouseToggle');
mouseToggle.addEventListener('change', (e) => {
    useMouseControl = e.target.checked;
    // Hide standard cursor when inside canvas during play
    canvas.style.cursor = useMouseControl ? 'none' : 'default';
});

// Setup HUD overlay Play Button
const hudBtnStart = document.getElementById('hudBtnStart');
hudBtnStart.addEventListener('click', () => {
    sound.init(); // Initialize audio context on click
    if (gameState === 'start-screen' || gameState === 'game-over') {
        resetGame();
        gameState = 'playing';
        hideOverlay();
    }
});

function setGameMode(mode) {
    gameMode = mode;
    document.getElementById('btnModeVsCpu').classList.toggle('active', mode === 'vs-cpu');
    document.getElementById('btnModePvp').classList.toggle('active', mode === 'pvp');
    
    // Show/hide difficulty group and update instructions
    const diffGroup = document.getElementById('difficultyGroup');
    const p2Instructions = document.getElementById('p2Instructions');
    
    if (mode === 'vs-cpu') {
        diffGroup.style.display = 'flex';
        p2Instructions.innerHTML = '<strong>CPU (Derecha)</strong><span>Control Inteligente</span>';
    } else {
        diffGroup.style.display = 'none';
        p2Instructions.innerHTML = '<strong>Jugador 2 (Derecha)</strong><span>Mover: <span class="keycap">▲</span> y <span class="keycap">▼</span></span>';
    }
}

function setDifficulty(diff) {
    difficulty = diff;
    const diffs = ['easy', 'medium', 'hard', 'impossible'];
    diffs.forEach(d => {
        const id = `btnDiff${d.charAt(0).toUpperCase() + d.slice(1)}`;
        document.getElementById(id).classList.toggle('active', d === diff);
    });
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        showOverlay('PAUSADO', 'Presiona la barra espaciadora o el botón de abajo para reanudar.', 'REANUDAR');
    } else if (gameState === 'paused') {
        gameState = 'playing';
        hideOverlay();
    }
}

function showOverlay(title, subtitle, btnText) {
    const overlay = document.getElementById('hudOverlay');
    const titleEl = document.getElementById('hudTitle');
    const subEl = document.getElementById('hudSubtitle');
    const btnEl = document.getElementById('hudBtnStart');
    
    titleEl.textContent = title;
    // Apply drop shadow glow dynamically
    titleEl.style.textShadow = `0 0 20px ${player1.color}`;
    subEl.textContent = subtitle;
    btnEl.textContent = btnText;
    
    overlay.classList.remove('hidden');
}

function hideOverlay() {
    document.getElementById('hudOverlay').classList.add('hidden');
}

// Spark Effects
function createSparks(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// Ball Reset
function resetBall(direction = 1) {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = ball.baseSpeed;
    
    // Choose starting angle between -30deg and +30deg
    const angle = (Math.random() - 0.5) * Math.PI / 4;
    ball.vx = Math.cos(angle) * ball.speed * direction;
    ball.vy = Math.sin(angle) * ball.speed;
}

// Full Reset
function resetGame() {
    player1.score = 0;
    player2.score = 0;
    player1.y = canvas.height / 2 - paddleHeight / 2;
    player2.y = canvas.height / 2 - paddleHeight / 2;
    particles = [];
    resetBall(Math.random() > 0.5 ? 1 : -1);
}

// AI Controller
function runCpuLogic() {
    const diff = diffSettings[difficulty];
    const paddleCenter = player2.y + paddleHeight / 2;
    let targetY = canvas.height / 2; // Default to center

    if (ball.vx > 0) {
        // Ball is coming towards CPU
        // Easy mode reacts only after mid-field
        if (difficulty === 'easy' && ball.x < canvas.width / 2) {
            targetY = canvas.height / 2;
        } else {
            // Apply delay-based tracking error
            const errorFactor = Math.sin(gameTime * 0.05) * diff.error;
            targetY = ball.y + errorFactor;
        }
    } else {
        // Ball is moving away: reposition slowly to center
        targetY = canvas.height / 2;
    }

    // Move smoothly towards target
    const diffY = targetY - paddleCenter;
    const moveStep = Math.sign(diffY) * Math.min(Math.abs(diffY), diff.speed);
    player2.y += moveStep;
}

// Update loop
function update() {
    if (gameState !== 'playing') return;

    gameTime++;

    // Refresh colors in case theme changed
    updateColorsFromCSS();

    // 1. Move Player 1 (W/S keys) - Only if mouse control is disabled
    if (!useMouseControl) {
        const moveSpeed = 6;
        if (keys['w']) {
            player1.y -= moveSpeed;
        }
        if (keys['s']) {
            player1.y += moveSpeed;
        }
        player1.y = Math.max(0, Math.min(canvas.height - paddleHeight, player1.y));
    }

    // 2. Move Player 2 (AI or Arrow Keys)
    if (gameMode === 'pvp') {
        if (keys['arrowup'] || keys['ArrowUp']) {
            player2.y -= moveSpeed;
        }
        if (keys['arrowdown'] || keys['ArrowDown']) {
            player2.y += moveSpeed;
        }
        player2.y = Math.max(0, Math.min(canvas.height - paddleHeight, player2.y));
    } else {
        runCpuLogic();
        player2.y = Math.max(0, Math.min(canvas.height - paddleHeight, player2.y));
    }

    // 3. Move Ball
    ball.x += ball.vx;
    ball.y += ball.vy;

    // 4. Wall Collisions (Top / Bottom)
    if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.vy = -ball.vy;
        sound.playHitWall();
        createSparks(ball.x, 0, ball.color, 6);
    } else if (ball.y + ball.radius >= canvas.height) {
        ball.y = canvas.height - ball.radius;
        ball.vy = -ball.vy;
        sound.playHitWall();
        createSparks(ball.x, canvas.height, ball.color, 6);
    }

    // 5. Paddle Collision (Player 1 - Left)
    if (ball.vx < 0 && 
        ball.x - ball.radius <= player1.x + paddleWidth && 
        ball.x - ball.radius >= player1.x) {
        
        if (ball.y >= player1.y && ball.y <= player1.y + paddleHeight) {
            // Hit paddle! Calculate bounce angle depending on hit point relative to paddle center
            const relativeHit = (ball.y - (player1.y + paddleHeight / 2)) / (paddleHeight / 2);
            const bounceAngle = relativeHit * (Math.PI / 3.5); // Max angle ~50 degrees
            
            // Speed up slightly on each hit
            ball.speed = Math.min(ball.maxSpeed, ball.speed + 0.5);
            
            ball.vx = Math.cos(bounceAngle) * ball.speed;
            ball.vy = Math.sin(bounceAngle) * ball.speed;
            
            // Reposition ball outside paddle to avoid stickiness
            ball.x = player1.x + paddleWidth + ball.radius;
            
            sound.playHitPaddle();
            createSparks(ball.x - ball.radius, ball.y, player1.color, 15);
        }
    }

    // 6. Paddle Collision (Player 2 - Right)
    if (ball.vx > 0 && 
        ball.x + ball.radius >= player2.x && 
        ball.x + ball.radius <= player2.x + paddleWidth) {
        
        if (ball.y >= player2.y && ball.y <= player2.y + paddleHeight) {
            const relativeHit = (ball.y - (player2.y + paddleHeight / 2)) / (paddleHeight / 2);
            const bounceAngle = relativeHit * (Math.PI / 3.5);
            
            ball.speed = Math.min(ball.maxSpeed, ball.speed + 0.5);
            
            ball.vx = -Math.cos(bounceAngle) * ball.speed;
            ball.vy = Math.sin(bounceAngle) * ball.speed;
            
            ball.x = player2.x - ball.radius;
            
            sound.playHitPaddle();
            createSparks(ball.x + ball.radius, ball.y, player2.color, 15);
        }
    }

    // 7. Scoring
    if (ball.x - ball.radius < 0) {
        // Player 2 scores
        player2.score++;
        sound.playScore();
        createSparks(10, ball.y, player2.color, 25);
        checkScoreLimit(2);
    } else if (ball.x + ball.radius > canvas.width) {
        // Player 1 scores
        player1.score++;
        sound.playScore();
        createSparks(canvas.width - 10, ball.y, player1.color, 25);
        checkScoreLimit(1);
    }

    // 8. Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

function checkScoreLimit(lastScorer) {
    if (player1.score >= WINNING_SCORE) {
        endGame(1);
    } else if (player2.score >= WINNING_SCORE) {
        endGame(2);
    } else {
        // Reset ball in direction of the scorer (helps keep pace balanced)
        resetBall(lastScorer === 1 ? -1 : 1);
    }
}

function endGame(winnerId) {
    gameState = 'game-over';
    winner = winnerId;
    const isPlayerWin = winnerId === 1;
    const winMessage = isPlayerWin 
        ? "¡FELICIDADES! ¡HAS GANADO!" 
        : (gameMode === 'vs-cpu' ? "HAS SIDO DERROTADO POR LA CPU" : "¡EL JUGADOR 2 HA GANADO!");
    
    sound.playGameOver(isPlayerWin);
    
    showOverlay(
        isPlayerWin ? "¡VICTORIA!" : "FIN DE JUEGO", 
        `${winMessage} (Marcador final: ${player1.score} - ${player2.score})`, 
        "JUGAR DE NUEVO"
    );
}

// Drawing loop
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Court / Center Dashed Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dashed line style

    // 2. Draw Digital Scores
    ctx.font = '900 64px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Left Score
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillText(player1.score.toString().padStart(2, '0'), canvas.width / 4, canvas.height / 2);
    
    // Right Score
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillText(player2.score.toString().padStart(2, '0'), (canvas.width * 3) / 4, canvas.height / 2);

    // 3. Draw Player 1 Paddle (Left) with rounded design and neon glow
    ctx.save();
    ctx.fillStyle = player1.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = player1.color;
    ctx.beginPath();
    ctx.roundRect(player1.x, player1.y, paddleWidth, paddleHeight, 6);
    ctx.fill();
    ctx.restore();

    // 4. Draw Player 2 Paddle (Right)
    ctx.save();
    ctx.fillStyle = player2.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = player2.color;
    ctx.beginPath();
    ctx.roundRect(player2.x, player2.y, paddleWidth, paddleHeight, 6);
    ctx.fill();
    ctx.restore();

    // 5. Draw Particles
    particles.forEach(p => p.draw(ctx));

    // 6. Draw Ball with retro trailing glow
    if (gameState === 'playing' || gameState === 'paused') {
        ctx.save();
        ctx.fillStyle = ball.color;
        ctx.shadowBlur = 18;
        ctx.shadowColor = ball.color;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Main Game Loop
function mainLoop() {
    update();
    draw();
    requestAnimationFrame(mainLoop);
}

// Initial initialization
updateColorsFromCSS();
resetGame();
mainLoop();
