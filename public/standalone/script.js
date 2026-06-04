/**
 * 배틀쉽 좌표평면 게임 (Battleship Coordinate Game) Standalone Script
 */

// --- CONSTANTS ---
const HIT_RADIUS = 0.75; // 포탄 명중 성공 오차 범위
const LOGICAL_MIN = -6.5;
const LOGICAL_MAX = 6.5;

// --- GAME STATE VARIABLES ---
let gameState = 'INITIAL'; // INITIAL, OBSERVATION, AIMING, RESULT
let showGrid = false;
let enemyPos = null;       // {x, y}
let enemyEmoji = '🛳️';     // '🛳️' 이나 '✈️'
let targetPos = null;      // {x, y}

// Animation states
let isFiring = false;
let missileProgress = 0;   // 0 to 1
let explosionActive = false;
let explosionStartTime = 0;
let isHit = false;

// --- DOM ELEMENTS ---
const radarCanvas = document.getElementById('radarCanvas');
const radarCtx = radarCanvas.getContext('2d');
const whiteboardCanvas = document.getElementById('whiteboardCanvas');
const whiteboardCtx = whiteboardCanvas.getContext('2d');

const statusText = document.getElementById('statusText');
const mainBtn = document.getElementById('mainBtn');
const toggleGridBtn = document.getElementById('toggleGridBtn');
const restartBtn = document.getElementById('restartBtn');
const clearWhiteboardBtn = document.getElementById('clearWhiteboardBtn');

// --- INITIALIZE SIZES OF CANVASES ---
let radarSize = 400;
function resizeRadarCanvas() {
  const container = radarCanvas.parentElement;
  radarSize = container.clientWidth;
  radarCanvas.width = radarSize;
  radarCanvas.height = radarSize;
}

function resizeWhiteboardCanvas() {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = whiteboardCanvas.width;
  tempCanvas.height = whiteboardCanvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  if (tempCtx) {
    tempCtx.drawImage(whiteboardCanvas, 0, 0);
  }

  const container = whiteboardCanvas.parentElement;
  const w = container.clientWidth;
  const h = 160; // Fixed content height for drawing layout

  whiteboardCanvas.width = w;
  whiteboardCanvas.height = h;

  // re-apply whiteboard stylus config
  whiteboardCtx.lineCap = 'round';
  whiteboardCtx.lineJoin = 'round';
  whiteboardCtx.strokeStyle = '#1E293B';
  whiteboardCtx.lineWidth = 3;

  whiteboardCtx.drawImage(tempCanvas, 0, 0, w, h);
}

// --- COORDINATES CONVERSIONS ---
function toPixel(x, y) {
  const scale = radarSize / (LOGICAL_MAX - LOGICAL_MIN);
  const px = (x - LOGICAL_MIN) * scale;
  const py = (LOGICAL_MAX - y) * scale; // invert Y
  return { x: px, y: py };
}

function toLogical(px, py) {
  const scale = radarSize / (LOGICAL_MAX - LOGICAL_MIN);
  const x = LOGICAL_MIN + px / scale;
  const y = LOGICAL_MAX - py / scale;
  return { x, y };
}

// --- STATE MANAGER ---
function changeState(newState) {
  gameState = newState;
  updateUI();
}

function updateUI() {
  switch (gameState) {
    case 'INITIAL':
      statusText.innerHTML = "대기 중 - 적을 탐색하세요.";
      mainBtn.innerHTML = "적 위치 확인";
      mainBtn.disabled = false;
      mainBtn.style.display = "block";
      targetPos = null;
      enemyPos = null;
      isFiring = false;
      explosionActive = false;
      break;

    case 'OBSERVATION':
      statusText.innerHTML = "위치 설명 중 - 화이트보드에 적의 위치를 기록하세요.";
      mainBtn.innerHTML = "위치 작성 완료";
      mainBtn.disabled = false;
      mainBtn.style.display = "block";
      break;

    case 'AIMING':
      statusText.innerHTML = "조준 요망 - 화면을 터치하여 적의 예상 위치를 조준하세요.";
      mainBtn.innerHTML = "포탄 발사";
      mainBtn.disabled = true; // Disabled until they set a target crosshair!
      mainBtn.style.display = "block";
      break;

    case 'RESULT':
      if (isFiring) {
        statusText.innerHTML = "포탄 발사 중...";
        mainBtn.disabled = true;
        mainBtn.style.display = "none";
      } else {
        if (isHit) {
          statusText.innerHTML = `<span style="color:#10B981;font-weight:700;">명중!</span> 적 함선을 파괴했습니다. (좌표: ${enemyPos.x.toFixed(2)}, ${enemyPos.y.toFixed(2)})`;
        } else {
          statusText.innerHTML = `<span style="color:#EF4444;font-weight:700;">실패!</span> 적을 놓쳤습니다. (적 좌표: ${enemyPos.x.toFixed(2)}, ${enemyPos.y.toFixed(2)})`;
        }
        mainBtn.disabled = true;
        mainBtn.style.display = "none";
      }
      break;
  }
}

// --- GENERATE RANDOM ENEMY ---
function generateEnemy() {
  // x, y 모두 0.25 단위
  // 절댓값은 0.75 이상 5.5 이하
  
  // Pick random coordinates matching intervals
  function getRandomCoordinate() {
    const signs = [-1, 1];
    const sign = signs[Math.floor(Math.random() * 2)];
    
    // Choose multiples of 0.25 inside [0.75, 5.5]
    const minStep = 0.75 / 0.25; // 3
    const maxStep = 5.5 / 0.25;  // 22
    const stepCount = Math.floor(Math.random() * (maxStep - minStep + 1)) + minStep;
    
    return sign * (stepCount * 0.25);
  }

  const x = getRandomCoordinate();
  const y = getRandomCoordinate();

  const emojis = ['🛳️', '✈️'];
  const randomizedEmoji = emojis[Math.floor(Math.random() * emojis.length)];

  return { pos: { x, y }, emoji: randomizedEmoji };
}

// --- ROCKET FIRE MECHANICS ---
function fireMissile() {
  if (!targetPos || !enemyPos) return;
  isFiring = true;
  missileProgress = 0;
  explosionActive = false;
  changeState('RESULT');

  const duration = 1500; // 1.5 seconds travel
  const startAnimTime = performance.now();

  function animateMissile(now) {
    const elapsed = now - startAnimTime;
    missileProgress = Math.min(1, elapsed / duration);

    if (missileProgress < 1) {
      requestAnimationFrame(animateMissile);
    } else {
      // Missile reached crosshair! Launch explosion effect
      isFiring = false;
      explosionActive = true;
      explosionStartTime = performance.now();
      
      // Calculate distance for Hit Judge
      const dx = targetPos.x - enemyPos.x;
      const dy = targetPos.y - enemyPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      isHit = dist <= HIT_RADIUS;

      // Update state outcome
      setTimeout(() => {
        explosionActive = false;
        updateUI();
      }, 1000); // 1.0 second explosion period
    }
  }

  requestAnimationFrame(animateMissile);
}

// --- INTERACTION LISTENERS ON RADAR CANVAS ---
function handleRadarInteraction(e) {
  if (gameState !== 'AIMING') return;

  const rect = radarCanvas.getBoundingClientRect();
  let clientX = 0;
  let clientY = 0;

  if (e.touches) {
    if (e.touches.length === 0) return;
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  const px = clientX - rect.left;
  const py = clientY - rect.top;

  const logicalCoords = toLogical(px, py);

  // Constraints inside [-6, 6] bounds strictly
  const cx = Math.max(-6, Math.min(6, logicalCoords.x));
  const cy = Math.max(-6, Math.min(6, logicalCoords.y));

  targetPos = { x: cx, y: cy };
  
  // Enable firing command now that they pointed a coord
  mainBtn.disabled = false;
}

// Attach radar event bindings
radarCanvas.addEventListener('mousedown', (e) => {
  handleRadarInteraction(e);
  const onMouseMove = (moveEv) => handleRadarInteraction(moveEv);
  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
});

radarCanvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  handleRadarInteraction(e);
});

radarCanvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  handleRadarInteraction(e);
});

// --- WHITEBOARD HANDLER ---
let isDrawing = false;
let lastDrawPos = null;

function getWhiteboardPos(e) {
  const rect = whiteboardCanvas.getBoundingClientRect();
  let clientX = 0;
  let clientY = 0;

  if (e.touches) {
    if (e.touches.length === 0) return null;
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function startDrawing(e) {
  e.preventDefault();
  const pos = getWhiteboardPos(e);
  if (!pos) return;

  isDrawing = true;
  lastDrawPos = pos;

  whiteboardCtx.beginPath();
  whiteboardCtx.arc(pos.x, pos.y, 1.5, 0, 2 * Math.PI);
  whiteboardCtx.fillStyle = '#1E293B';
  whiteboardCtx.fill();
}

function draw(e) {
  if (!isDrawing || !lastDrawPos) return;
  e.preventDefault();

  const currPos = getWhiteboardPos(e);
  if (!currPos) return;

  whiteboardCtx.beginPath();
  whiteboardCtx.moveTo(lastDrawPos.x, lastDrawPos.y);
  whiteboardCtx.lineTo(currPos.x, currPos.y);
  whiteboardCtx.stroke();

  lastDrawPos = currPos;
}

function stopDrawing() {
  isDrawing = false;
  lastDrawPos = null;
}

// Attach whiteboard canvas event bindings
whiteboardCanvas.addEventListener('mousedown', startDrawing);
whiteboardCanvas.addEventListener('mousemove', draw);
whiteboardCanvas.addEventListener('mouseup', stopDrawing);
whiteboardCanvas.addEventListener('mouseleave', stopDrawing);

whiteboardCanvas.addEventListener('touchstart', startDrawing);
whiteboardCanvas.addEventListener('touchmove', draw);
whiteboardCanvas.addEventListener('touchend', stopDrawing);

// --- MAIN CONTROLLER TRIGGER COMMAND ---
mainBtn.addEventListener('click', () => {
  if (gameState === 'INITIAL') {
    const enemyData = generateEnemy();
    enemyPos = enemyData.pos;
    enemyEmoji = enemyData.emoji;
    changeState('OBSERVATION');
  } else if (gameState === 'OBSERVATION') {
    changeState('AIMING');
  } else if (gameState === 'AIMING') {
    if (targetPos) {
      fireMissile();
    }
  }
});

// --- GRID TOGGLE COMMAND ---
toggleGridBtn.addEventListener('click', () => {
  showGrid = !showGrid;
  toggleGridBtn.innerHTML = showGrid ? "격자 OFF" : "격자 ON";
  toggleGridBtn.classList.toggle('active', showGrid);
});

// --- RESET SYSTEM COMMAND ---
restartBtn.addEventListener('click', () => {
  changeState('INITIAL');
});

// --- CLEAR WHITEBOARD ---
clearWhiteboardBtn.addEventListener('click', () => {
  whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
});

// --- MAIN CONTINUOUS RENDERING LOOP ---
const startTime = performance.now();
function renderScene(now) {
  const elapsedSeconds = (now - startTime) / 1000;

  // Clear background
  radarCtx.fillStyle = '#060B14';
  radarCtx.fillRect(0, 0, radarSize, radarSize);

  // Radar circular rings
  const centerPx = toPixel(0, 0);
  const ringSteps = [1, 2, 3, 4, 5, 6];
  ringSteps.forEach((r) => {
    const edgePx = toPixel(r, 0);
    const radius = edgePx.x - centerPx.x;
    radarCtx.beginPath();
    radarCtx.arc(centerPx.x, centerPx.y, radius, 0, 2 * Math.PI);
    radarCtx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
    radarCtx.lineWidth = 1;
    radarCtx.stroke();
  });

  // Draw Grid ON/OFF
  if (showGrid) {
    radarCtx.lineWidth = 0.8;
    for (let i = -6; i <= 6; i++) {
      if (i === 0) continue;

      // Vertical
      const vStart = toPixel(i, -6);
      const vEnd = toPixel(i, 6);
      radarCtx.beginPath();
      radarCtx.moveTo(vStart.x, vStart.y);
      radarCtx.lineTo(vEnd.x, vEnd.y);
      radarCtx.strokeStyle = 'rgba(75, 85, 99, 0.25)';
      radarCtx.stroke();

      // Horizontal
      const hStart = toPixel(-6, i);
      const hEnd = toPixel(6, i);
      radarCtx.beginPath();
      radarCtx.moveTo(hStart.x, hStart.y);
      radarCtx.lineTo(hEnd.x, hEnd.y);
      radarCtx.strokeStyle = 'rgba(75, 85, 99, 0.25)';
      radarCtx.stroke();
    }

    // Coordinates Axes
    radarCtx.lineWidth = 2.0;
    radarCtx.strokeStyle = 'rgba(16, 185, 129, 0.4)';

    const yStart = toPixel(0, -6);
    const yEnd = toPixel(0, 6);
    radarCtx.beginPath();
    radarCtx.moveTo(yStart.x, yStart.y);
    radarCtx.lineTo(yEnd.x, yEnd.y);
    radarCtx.stroke();

    const xStart = toPixel(-6, 0);
    const xEnd = toPixel(6, 0);
    radarCtx.beginPath();
    radarCtx.moveTo(xStart.x, xStart.y);
    radarCtx.lineTo(xEnd.x, xEnd.y);
    radarCtx.stroke();
  }

  // State specific drawing details
  if (gameState === 'OBSERVATION') {
    // Rotating sweep scan line
    const angle = elapsedSeconds * 1.5;
    const radarRadius = radarSize * 0.9;
    const endX = Math.cos(angle) * radarRadius;
    const endY = Math.sin(angle) * radarRadius;

    radarCtx.beginPath();
    radarCtx.moveTo(centerPx.x, centerPx.y);
    radarCtx.lineTo(centerPx.x + endX, centerPx.y + endY);
    radarCtx.lineWidth = 2;
    radarCtx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
    radarCtx.stroke();

    radarCtx.beginPath();
    radarCtx.moveTo(centerPx.x, centerPx.y);
    radarCtx.arc(centerPx.x, centerPx.y, radarSize * 0.8, angle - 0.3, angle, false);
    radarCtx.closePath();
    const grad = radarCtx.createRadialGradient(centerPx.x, centerPx.y, 0, centerPx.x, centerPx.y, radarSize * 0.8);
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
    grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
    radarCtx.fillStyle = grad;
    radarCtx.fill();

    // Blinking Enemy Pos (exactly 2s cycle opacity sinus oscillation)
    if (enemyPos) {
      const ePx = toPixel(enemyPos.x, enemyPos.y);
      const opacity = 0.5 + 0.5 * Math.cos(Math.PI * elapsedSeconds);

      radarCtx.save();
      radarCtx.globalAlpha = opacity;
      radarCtx.font = `${Math.max(16, radarSize / 13)}px sans-serif`;
      radarCtx.textAlign = 'center';
      radarCtx.textBaseline = 'middle';
      radarCtx.fillText(enemyEmoji, ePx.x, ePx.y);

      radarCtx.beginPath();
      radarCtx.arc(ePx.x, ePx.y, radarSize / 20, 0, 2 * Math.PI);
      radarCtx.strokeStyle = `rgba(16, 185, 129, ${opacity * 0.5})`;
      radarCtx.lineWidth = 1;
      radarCtx.stroke();
      radarCtx.restore();
    }
  }

  // Red Center point (0,0)
  radarCtx.beginPath();
  radarCtx.arc(centerPx.x, centerPx.y, 5, 0, 2 * Math.PI);
  radarCtx.fillStyle = '#EF4444';
  radarCtx.shadowColor = '#EF4444';
  radarCtx.shadowBlur = 8;
  radarCtx.fill();
  radarCtx.shadowBlur = 0; // reset shader

  // Target Crosshair Reticle for AIMING or RESULT states
  if ((gameState === 'AIMING' || gameState === 'RESULT') && targetPos) {
    const tPx = toPixel(targetPos.x, targetPos.y);
    const radius = radarSize * 0.04;

    radarCtx.save();
    radarCtx.strokeStyle = '#EF4444';
    radarCtx.lineWidth = 2;

    radarCtx.beginPath();
    radarCtx.arc(tPx.x, tPx.y, radius, 0, 2 * Math.PI);
    radarCtx.stroke();

    radarCtx.beginPath();
    radarCtx.arc(tPx.x, tPx.y, 2, 0, 2 * Math.PI);
    radarCtx.fillStyle = '#EF4444';
    radarCtx.fill();

    radarCtx.beginPath();
    radarCtx.moveTo(tPx.x - radius * 1.5, tPx.y);
    radarCtx.lineTo(tPx.x + radius * 1.5, tPx.y);
    radarCtx.moveTo(tPx.x, tPx.y - radius * 1.5);
    radarCtx.lineTo(tPx.x, tPx.y + radius * 1.5);
    radarCtx.stroke();
    radarCtx.restore();
  }

  // Missile travel flight path / Tracer and target explosion
  if (gameState === 'RESULT') {
    if (isFiring && targetPos) {
      const startPx = toPixel(0, 0);
      const endPx = toPixel(targetPos.x, targetPos.y);

      const curPxX = startPx.x + (endPx.x - startPx.x) * missileProgress;
      const curPxY = startPx.y + (endPx.y - startPx.y) * missileProgress;

      radarCtx.beginPath();
      radarCtx.moveTo(startPx.x, startPx.y);
      radarCtx.lineTo(curPxX, curPxY);
      radarCtx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      radarCtx.lineWidth = 2.5;
      radarCtx.setLineDash([4, 4]);
      radarCtx.stroke();
      radarCtx.setLineDash([]);

      radarCtx.save();
      radarCtx.font = `${Math.max(14, radarSize / 16)}px sans-serif`;
      radarCtx.textAlign = 'center';
      radarCtx.textBaseline = 'middle';
      radarCtx.fillText('🚀', curPxX, curPxY);
      radarCtx.restore();
    }

    if (explosionActive && targetPos) {
      const tPx = toPixel(targetPos.x, targetPos.y);
      radarCtx.save();
      const pulseSpeed = (Math.sin(elapsedSeconds * 20) + 1) / 2;
      const bigSize = Math.max(30, radarSize / 8) + pulseSpeed * 15;
      radarCtx.font = `${bigSize}px sans-serif`;
      radarCtx.textAlign = 'center';
      radarCtx.textBaseline = 'middle';
      radarCtx.fillText('💥', tPx.x, tPx.y);
      radarCtx.restore();
    }

    if (!isFiring && enemyPos) {
      const ePx = toPixel(enemyPos.x, enemyPos.y);
      radarCtx.save();
      if (isHit) {
        const pulseRatio = 1.3 + 0.2 * Math.sin(elapsedSeconds * 12);
        radarCtx.font = `${Math.max(22, radarSize / 10) * pulseRatio}px sans-serif`;
        radarCtx.textAlign = 'center';
        radarCtx.textBaseline = 'middle';
        radarCtx.fillText('💥', ePx.x, ePx.y);
      } else {
        radarCtx.font = `${Math.max(16, radarSize / 13)}px sans-serif`;
        radarCtx.textAlign = 'center';
        radarCtx.textBaseline = 'middle';
        radarCtx.fillText(enemyEmoji, ePx.x, ePx.y);
      }
      radarCtx.restore();
    }
  }

  requestAnimationFrame(renderScene);
}

// --- ON DOCUMENT MOUNT INITIALIZATION ---
window.addEventListener('resize', () => {
  resizeRadarCanvas();
  resizeWhiteboardCanvas();
});

// Setup Initial Sizes and run
resizeRadarCanvas();
resizeWhiteboardCanvas();
updateUI();
requestAnimationFrame(renderScene);
