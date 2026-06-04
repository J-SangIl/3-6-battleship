import React, { useState } from 'react';
import { Copy, Check, Download, ExternalLink, Code, X } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const htmlCode = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>배틀쉽 좌표평면 게임 (Battleship Coordinate Game)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="app-container">
    <div class="left-panel">
      <div class="card-container border-glow">
        <div class="radar-header">
          <div class="status-indicator">
            <span class="pulse-dot"></span>
            <span class="indicator-text">COORDINATE RADAR SCOPE</span>
          </div>
          <div class="coordinate-bounds font-mono">X, Y: [-6, 6]</div>
        </div>
        <div class="canvas-wrapper">
          <canvas id="radarCanvas"></canvas>
        </div>
        <div class="radar-footer">
          <div class="coordinate-helper">
             원점 (0,0)은 중앙 빨간 점입니다. 상하좌우 간격은 1단위입니다.
          </div>
        </div>
      </div>
    </div>
    <div class="right-panel">
      <div class="ui-card info-card">
        <h2 class="section-title">작동 상태</h2>
        <div id="statusText" class="status-msg text-pulse">대기 중 - 적을 탐색하세요.</div>
      </div>
      <div class="ui-card action-card">
        <button id="mainBtn" class="btn btn-primary font-bold">적 위치 확인</button>
      </div>
      <div class="ui-card whiteboard-card">
        <div class="whiteboard-header">
          <h2 class="section-title">전자 화이트보드 (메모용)</h2>
          <button id="clearWhiteboardBtn" class="btn btn-outline btn-xs">지우기</button>
        </div>
        <div class="whiteboard-wrapper">
          <canvas id="whiteboardCanvas"></canvas>
        </div>
      </div>
      <div class="ui-card control-card">
        <h2 class="section-title">시스템 제어</h2>
        <div class="control-grid">
          <button id="toggleGridBtn" class="btn btn-outline">격자 ON</button>
          <button id="restartBtn" class="btn btn-danger font-bold">다시 시작</button>
        </div>
      </div>
      <div class="education-info font-mono">
        <p>중학교 1학년 수학: 좌표평면과 그래프</p>
        <p class="text-[10px] text-gray-500">배틀쉽 좌표 학습 시뮬레이터 v1.0</p>
      </div>
    </div>
  </div>
  <script src="script.js"></script>
</body>
</html>`;

  const cssCode = `/* ==========================================================================
   배틀쉽 좌표평면 게임 (Battleship Coordinate Game) Style Rules
   ========================================================================== */

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: #f8fafc;
  color: #1e293b;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-x: hidden;
}

.app-container {
  display: flex;
  flex-direction: row;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  gap: 24px;
  align-items: stretch;
}

.left-panel {
  flex: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.right-panel {
  flex: 0.8;
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: center;
}

.card-container {
  background-color: #060b14;
  width: 100%;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 
              0 8px 10px -6px rgba(0, 0, 0, 0.3);
  border: 1px solid #111827;
  transition: box-shadow 0.3s ease;
}

.border-glow {
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.1), 
              0 10px 25px -5px rgba(0, 0, 0, 0.3);
}

.radar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(75, 85, 99, 0.2);
  padding-bottom: 12px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background-color: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 10px #10b981;
  animation: pulse-glow 2s infinite;
}

.indicator-text {
  font-size: 11px;
  color: #10b981;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.font-mono {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

.coordinate-bounds {
  font-size: 11px;
  color: #6b7280;
  background: rgba(31, 41, 55, 0.6);
  padding: 4px 8px;
  border-radius: 6px;
}

.canvas-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  background-color: #030712;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(16, 185, 129, 0.15);
}

#radarCanvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  touch-action: none;
}

.radar-footer {
  margin-top: 16px;
  color: #4b5563;
  font-size: 12px;
  text-align: center;
  line-height: 1.5;
}

.ui-card {
  background-color: #ffffff;
  border-radius: 16px;
  padding: 18px 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 
              0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border: 1px solid #e2e8f0;
}

.section-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.status-msg {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.4;
  word-break: keep-all;
}

.text-pulse {
  animation: text-pulse-soft 2s infinite ease-in-out;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  outline: none;
}

.btn-primary {
  background-color: #0f172a;
  color: #ffffff;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.2);
}

.btn-primary:hover {
  background-color: #1e293b;
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(1px);
}

.btn-primary:disabled {
  background-color: #94a3b8;
  color: #e2e8f0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-outline {
  background-color: transparent;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.btn-outline:hover {
  background-color: #f1f5f9;
  color: #0f172a;
}

.btn-outline.active {
  background-color: #f1f5f9;
  color: #0f172a;
  border-color: #0f172a;
}

.btn-danger {
  background-color: #ef4444;
  color: #ffffff;
}

.btn-danger:hover {
  background-color: #dc2626;
}

.btn-xs {
  padding: 6px 12px;
  font-size: 11px;
  border-radius: 6px;
  width: auto;
}

.whiteboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.whiteboard-wrapper {
  background-color: #ffffff;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  position: relative;
  overflow: hidden;
}

#whiteboardCanvas {
  display: block;
  width: 100%;
  height: 160px;
  cursor: crosshair;
  touch-action: none;
}

.control-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.education-info {
  text-align: center;
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  line-height: 1.6;
}

@keyframes pulse-glow {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
    box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
  }
  50% {
    transform: scale(1.2);
    opacity: 0.6;
    box-shadow: 0 0 14px rgba(16, 185, 129, 0.9);
  }
}

@keyframes text-pulse-soft {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

@media (max-width: 900px) {
  .app-container {
    flex-direction: column;
    padding: 16px;
  }
  .left-panel, .right-panel {
    width: 100%;
  }
  .left-panel {
    max-width: 500px;
    margin: 0 auto;
  }
}`;

  const jsCode = `/**
 * 배틀쉽 좌표평면 게임 (Battleship Coordinate Game) Standalone Script
 */

const HIT_RADIUS = 0.75;
const LOGICAL_MIN = -6.5;
const LOGICAL_MAX = 6.5;

let gameState = 'INITIAL';
let showGrid = false;
let enemyPos = null;
let enemyEmoji = '🛳️';
let targetPos = null;

let isFiring = false;
let missileProgress = 0;
let explosionActive = false;
let explosionStartTime = 0;
let isHit = false;

const radarCanvas = document.getElementById('radarCanvas');
const radarCtx = radarCanvas.getContext('2d');
const whiteboardCanvas = document.getElementById('whiteboardCanvas');
const whiteboardCtx = whiteboardCanvas.getContext('2d');

const statusText = document.getElementById('statusText');
const mainBtn = document.getElementById('mainBtn');
const toggleGridBtn = document.getElementById('toggleGridBtn');
const restartBtn = document.getElementById('restartBtn');
const clearWhiteboardBtn = document.getElementById('clearWhiteboardBtn');

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
  const h = 160;

  whiteboardCanvas.width = w;
  whiteboardCanvas.height = h;

  whiteboardCtx.lineCap = 'round';
  whiteboardCtx.lineJoin = 'round';
  whiteboardCtx.strokeStyle = '#1E293B';
  whiteboardCtx.lineWidth = 3;

  whiteboardCtx.drawImage(tempCanvas, 0, 0, w, h);
}

function toPixel(x, y) {
  const scale = radarSize / (LOGICAL_MAX - LOGICAL_MIN);
  const px = (x - LOGICAL_MIN) * scale;
  const py = (LOGICAL_MAX - y) * scale;
  return { x: px, y: py };
}

function toLogical(px, py) {
  const scale = radarSize / (LOGICAL_MAX - LOGICAL_MIN);
  const x = LOGICAL_MIN + px / scale;
  const y = LOGICAL_MAX - py / scale;
  return { x, y };
}

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
      mainBtn.disabled = true;
      mainBtn.style.display = "block";
      break;

    case 'RESULT':
      if (isFiring) {
        statusText.innerHTML = "포탄 발사 중...";
        mainBtn.disabled = true;
        mainBtn.style.display = "none";
      } else {
        if (isHit) {
          statusText.innerHTML = '<span style="color:#10B981;font-weight:700;">명중!</span> 적 함선을 파괴했습니다.';
        } else {
          statusText.innerHTML = '<span style="color:#EF4444;font-weight:700;">실패!</span> 적을 놓쳤습니다.';
        }
        mainBtn.disabled = true;
        mainBtn.style.display = "none";
      }
      break;
  }
}

function generateEnemy() {
  function getRandomCoordinate() {
    const signs = [-1, 1];
    const sign = signs[Math.floor(Math.random() * 2)];
    const minStep = 0.75 / 0.25;
    const maxStep = 5.5 / 0.25;
    const stepCount = Math.floor(Math.random() * (maxStep - minStep + 1)) + minStep;
    return sign * (stepCount * 0.25);
  }

  const x = getRandomCoordinate();
  const y = getRandomCoordinate();
  const emojis = ['🛳️', '✈️'];
  const randomizedEmoji = emojis[Math.floor(Math.random() * emojis.length)];

  return { pos: { x, y }, emoji: randomizedEmoji };
}

function fireMissile() {
  if (!targetPos || !enemyPos) return;
  isFiring = true;
  missileProgress = 0;
  explosionActive = false;
  changeState('RESULT');

  const duration = 1500;
  const startAnimTime = performance.now();

  function animateMissile(now) {
    const elapsed = now - startAnimTime;
    missileProgress = Math.min(1, elapsed / duration);

    if (missileProgress < 1) {
      requestAnimationFrame(animateMissile);
    } else {
      isFiring = false;
      explosionActive = true;
      explosionStartTime = performance.now();
      
      const dx = targetPos.x - enemyPos.x;
      const dy = targetPos.y - enemyPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      isHit = dist <= HIT_RADIUS;

      setTimeout(() => {
        explosionActive = false;
        updateUI();
      }, 1000);
    }
  }

  requestAnimationFrame(animateMissile);
}

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
  const cx = Math.max(-6, Math.min(6, logicalCoords.x));
  const cy = Math.max(-6, Math.min(6, logicalCoords.y));

  targetPos = { x: cx, y: cy };
  mainBtn.disabled = false;
}

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

  return { x: clientX - rect.left, y: clientY - rect.top };
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

whiteboardCanvas.addEventListener('mousedown', startDrawing);
whiteboardCanvas.addEventListener('mousemove', draw);
whiteboardCanvas.addEventListener('mouseup', stopDrawing);
whiteboardCanvas.addEventListener('mouseleave', stopDrawing);

whiteboardCanvas.addEventListener('touchstart', startDrawing);
whiteboardCanvas.addEventListener('touchmove', draw);
whiteboardCanvas.addEventListener('touchend', stopDrawing);

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

toggleGridBtn.addEventListener('click', () => {
  showGrid = !showGrid;
  toggleGridBtn.innerHTML = showGrid ? "격자 OFF" : "격자 ON";
  toggleGridBtn.classList.toggle('active', showGrid);
});

restartBtn.addEventListener('click', () => {
  changeState('INITIAL');
});

clearWhiteboardBtn.addEventListener('click', () => {
  whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
});

const startTime = performance.now();
function renderScene(now) {
  const elapsedSeconds = (now - startTime) / 1000;
  radarCtx.fillStyle = '#060B14';
  radarCtx.fillRect(0, 0, radarSize, radarSize);

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

  if (showGrid) {
    radarCtx.lineWidth = 0.8;
    for (let i = -6; i <= 6; i++) {
      if (i === 0) continue;
      const vStart = toPixel(i, -6);
      const vEnd = toPixel(i, 6);
      radarCtx.beginPath();
      radarCtx.moveTo(vStart.x, vStart.y);
      radarCtx.lineTo(vEnd.x, vEnd.y);
      radarCtx.strokeStyle = 'rgba(75, 85, 99, 0.25)';
      radarCtx.stroke();

      const hStart = toPixel(-6, i);
      const hEnd = toPixel(6, i);
      radarCtx.beginPath();
      radarCtx.moveTo(hStart.x, hStart.y);
      radarCtx.lineTo(hEnd.x, hEnd.y);
      radarCtx.strokeStyle = 'rgba(75, 85, 99, 0.25)';
      radarCtx.stroke();
    }

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

  if (gameState === 'OBSERVATION') {
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

    if (enemyPos) {
      const ePx = toPixel(enemyPos.x, enemyPos.y);
      const opacity = 0.5 + 0.5 * Math.cos(Math.PI * elapsedSeconds);

      radarCtx.save();
      radarCtx.globalAlpha = opacity;
      radarCtx.font = \`\${Math.max(16, radarSize / 13)}px sans-serif\`;
      radarCtx.textAlign = 'center';
      radarCtx.textBaseline = 'middle';
      radarCtx.fillText(enemyEmoji, ePx.x, ePx.y);

      radarCtx.beginPath();
      radarCtx.arc(ePx.x, ePx.y, radarSize / 20, 0, 2 * Math.PI);
      radarCtx.strokeStyle = \`rgba(16, 185, 129, \${opacity * 0.5})\`;
      radarCtx.lineWidth = 1;
      radarCtx.stroke();
      radarCtx.restore();
    }
  }

  radarCtx.beginPath();
  radarCtx.arc(centerPx.x, centerPx.y, 5, 0, 2 * Math.PI);
  radarCtx.fillStyle = '#EF4444';
  radarCtx.shadowColor = '#EF4444';
  radarCtx.shadowBlur = 8;
  radarCtx.fill();
  radarCtx.shadowBlur = 0;

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
      radarCtx.font = \`\${Math.max(14, radarSize / 16)}px sans-serif\`;
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
      radarCtx.font = \`\${bigSize}px sans-serif\`;
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
        radarCtx.font = \`\${Math.max(22, radarSize / 10) * pulseRatio}px sans-serif\`;
        radarCtx.textAlign = 'center';
        radarCtx.textBaseline = 'middle';
        radarCtx.fillText('💥', ePx.x, ePx.y);
      } else {
        radarCtx.font = \`\${Math.max(16, radarSize / 13)}px sans-serif\`;
        radarCtx.textAlign = 'center';
        radarCtx.textBaseline = 'middle';
        radarCtx.fillText(enemyEmoji, ePx.x, ePx.y);
      }
      radarCtx.restore();
    }
  }

  requestAnimationFrame(renderScene);
}

window.addEventListener('resize', () => {
  resizeRadarCanvas();
  resizeWhiteboardCanvas();
});

resizeRadarCanvas();
resizeWhiteboardCanvas();
updateUI();
requestAnimationFrame(renderScene);`;

  const handleCopy = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getActiveCode = () => {
    if (activeTab === 'html') return htmlCode;
    if (activeTab === 'css') return cssCode;
    return jsCode;
  };

  const downloadStandaloneZip = () => {
    // Alert instructions of how to use `/standalone/index.html` directly or save files
    const fileContent = getActiveCode();
    const fileName = activeTab === 'html' ? 'index.html' : activeTab === 'css' ? 'style.css' : 'script.js';
    
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <Code size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Netlify & GitHub 1초 배포 코드 추출</h3>
              <p className="text-xs text-gray-500 font-medium">Netlify, GitHub Pages 배포용 HTML/CSS/JS 파일 세트입니다.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info panel */}
        <div className="px-5 py-3 bg-indigo-50 border-b border-indigo-100 text-xs text-indigo-700 font-medium flex gap-2 items-center">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          <span>현재 이 실행 환경의 <a href="/standalone/index.html" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-indigo-900 inline-flex items-center gap-1">/standalone/index.html <ExternalLink size={12}/></a> 에도 실시간으로 똑같이 호스팅 되고 있습니다.</span>
        </div>

        {/* Modal Tabs and Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-gray-200 p-2 gap-2">
          <div className="flex bg-gray-300 p-1 rounded-lg gap-1">
            <button
              onClick={() => setActiveTab('html')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'html'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              index.html
            </button>
            <button
              onClick={() => setActiveTab('css')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'css'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              style.css
            </button>
            <button
              onClick={() => setActiveTab('js')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'js'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              script.js
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(getActiveCode())}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50 border border-gray-300 rounded-lg shadow-sm transition-colors"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-500" />
                  <span className="text-emerald-600">복사 완료!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>코드 클립보드 복사</span>
                </>
              )}
            </button>

            <button
              onClick={downloadStandaloneZip}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <Download size={14} />
              <span>이 파일 다운로드 (.js/.css/.html)</span>
            </button>
          </div>
        </div>

        {/* Code Content Editor Area */}
        <div className="flex-1 overflow-auto bg-gray-900 text-gray-100 p-5 font-mono text-xs leading-relaxed">
          <pre className="whitespace-pre">
            {getActiveCode()}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] text-gray-500">
          <p>💡 위 세개 파일명을 그대로 지정하여 하나의 디렉토리에 저장하면 바로 실행됩니다.</p>
          <div className="flex gap-4">
            <span className="font-bold text-gray-700">Netlify 무료 배포팁:</span>
            <span>세 파일이 든 폴더를 drag-and-drop만 하면 무료 웹서이트가 생성됩니다!</span>
          </div>
        </div>

      </div>
    </div>
  );
};
