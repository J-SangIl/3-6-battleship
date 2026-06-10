import { useState, useRef, useEffect } from 'react';
import { RadarBoard, GameState, Point } from './components/RadarBoard';
import { Whiteboard, WhiteboardHandle } from './components/Whiteboard';
import { RefreshCw, Grid, Shield, Radio, Clock } from 'lucide-react';

const HIT_RADIUS = 0.5; // 포탄 명중 성공 오차 범위 (난이도 조절용 상수)

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.INITIAL);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [showRadar, setShowRadar] = useState<boolean>(true);
  const [enemyPos, setEnemyPos] = useState<Point | null>(null);
  const [enemyEmoji, setEnemyEmoji] = useState<string>('✈️');
  const [targetPos, setTargetPos] = useState<Point | null>(null);

  // Timer Configuration & State
  const [observationLimit, setObservationLimit] = useState<number>(30);
  const [aimingLimit, setAimingLimit] = useState<number>(30);
  const [timeLeft, setTimeLeft] = useState<number>(30);

  // Sync / Reset timer value when entering a state
  useEffect(() => {
    if (gameState === GameState.OBSERVATION) {
      setTimeLeft(observationLimit);
    } else if (gameState === GameState.AIMING) {
      setTimeLeft(aimingLimit);
    } else {
      setTimeLeft(0);
    }
  }, [gameState]);

  // Countdown timer clock interval
  useEffect(() => {
    if (gameState !== GameState.OBSERVATION && gameState !== GameState.AIMING) {
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 0.1));
    }, 100);

    return () => clearInterval(timerId);
  }, [gameState]);

  // Animations State
  const [isFiring, setIsFiring] = useState<boolean>(false);
  const [missileProgress, setMissileProgress] = useState<number>(0);
  const [isHit, setIsHit] = useState<boolean>(false);
  const [explosionActive, setExplosionActive] = useState<boolean>(false);

  // Whiteboard control handle
  const whiteboardRef = useRef<WhiteboardHandle>(null);

  // Generate a random valid coordinate
  const generateRandomCoordinate = (): number => {
    const signs = [-1, 1];
    const sign = signs[Math.floor(Math.random() * 2)];

    // MULTIPLES of 0.25 within [0.75, 5.5]
    const minStep = 0.75 / 0.25; // 3
    const maxStep = 5.5 / 0.25;  // 22
    const stepCount = Math.floor(Math.random() * (maxStep - minStep + 1)) + minStep;

    return sign * (stepCount * 0.25);
  };

  // Setup a new wave
  const initEnemy = () => {
    let x = generateRandomCoordinate();
    let y = generateRandomCoordinate();

    // x좌표 절댓값 + y좌표 절댓값의 합이 4 이상이 되도록 함
    while (Math.abs(x) + Math.abs(y) < 4) {
      x = generateRandomCoordinate();
      y = generateRandomCoordinate();
    }

    setEnemyPos({ x, y });
    setEnemyEmoji('✈️');
    setTargetPos(null);
    setIsFiring(false);
    setMissileProgress(0);
    setIsHit(false);
    setExplosionActive(false);

    setGameState(GameState.OBSERVATION);
  };

  // Main Action state advancement handler
  const handleMainActionClick = () => {
    if (gameState === GameState.INITIAL) {
      initEnemy();
    } else if (gameState === GameState.OBSERVATION) {
      setGameState(GameState.WAITING_FOR_AIMING);
    } else if (gameState === GameState.WAITING_FOR_AIMING) {
      setGameState(GameState.AIMING);
    } else if (gameState === GameState.AIMING) {
      if (targetPos) {
        setGameState(GameState.AIMING_COMPLETED);
      }
    } else if (gameState === GameState.AIMING_COMPLETED) {
      if (targetPos) {
        triggerFiringAnimation();
      }
    }
  };

  // Missile travel animation trigger
  const triggerFiringAnimation = () => {
    if (!targetPos || !enemyPos) return;

    setIsFiring(true);
    setMissileProgress(0);
    setExplosionActive(false);
    setGameState(GameState.RESULT);

    const duration = 600; // Snappy 0.6s flight travel
    const startAnimTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startAnimTime;
      const progress = Math.min(1, elapsed / duration);
      setMissileProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Impact! Hide flying rocket and showcase explosion
        setIsFiring(false);
        setExplosionActive(true);

        const dx = targetPos.x - enemyPos.x;
        const dy = targetPos.y - enemyPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const hitConfirmed = distance <= HIT_RADIUS;
        setIsHit(hitConfirmed);

        // Turn off explosion after 1.2s to reveal state outcome clearly
        setTimeout(() => {
          setExplosionActive(false);
        }, 1200);
      }
    };

    requestAnimationFrame(animate);
  };

  // Toggle grid trigger
  const handleToggleGrid = () => {
    setShowGrid(!showGrid);
  };

  // Toggle radar sweep wave trigger
  const handleToggleRadar = () => {
    setShowRadar(!showRadar);
  };

  // Full reset trigger
  const handleResetGame = () => {
    setGameState(GameState.INITIAL);
    setEnemyPos(null);
    setTargetPos(null);
    setIsFiring(false);
    setMissileProgress(0);
    setIsHit(false);
    setExplosionActive(false);
    whiteboardRef.current?.clear();
  };

  // Clear whiteboard drawing session
  const handleClearWhiteboard = () => {
    whiteboardRef.current?.clear();
  };

  // Dynamic UI indicators computed based on Current state
  const getStatusText = () => {
    switch (gameState) {
      case GameState.INITIAL:
        return '대기 중';
      case GameState.OBSERVATION:
        return '위치 관측 중';
      case GameState.WAITING_FOR_AIMING:
        return '관측 완료 (아래 조준 시작 버튼을 누르세요)';
      case GameState.AIMING:
        return '조준 중';
      case GameState.AIMING_COMPLETED:
        return '조준 완료 (아래 포탄 발사 버튼을 누르세요)';
      case GameState.RESULT:
        if (isFiring) {
          return '포탄 발사 중';
        } else {
          if (isHit) {
            return (
              <span className="text-emerald-600 font-bold block animate-bounce">
                명중! 💥
              </span>
            );
          } else {
            return (
              <span className="text-red-500 font-bold block">
                실패! ❌
              </span>
            );
          }
        }
    }
  };

  const getMainBtnLabel = () => {
    switch (gameState) {
      case GameState.INITIAL:
        return '적 위치 확인';
      case GameState.OBSERVATION:
        return '위치 작성 완료';
      case GameState.WAITING_FOR_AIMING:
        return '조준 시작';
      case GameState.AIMING:
        return '조준 완료';
      case GameState.AIMING_COMPLETED:
        return '포탄 발사';
      case GameState.RESULT:
        return '사격 대기';
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col md:flex-row text-[#1e293b] select-none" id="main-app-container">
      {/* LEFT PANEL: Tactical Coordinate Radar Scope Canvas */}
      <section className="flex-grow bg-[#f1f5f9] flex flex-col items-center justify-center p-4 md:p-6 relative md:min-h-screen">
        <div className="w-full max-w-[min(900px,88vh)] flex flex-col">
          {/* Canvas Viewport mapping */}
          <RadarBoard
            gameState={gameState}
            showGrid={showGrid}
            showRadar={showRadar}
            enemyPos={enemyPos}
            enemyEmoji={enemyEmoji}
            targetPos={targetPos}
            setTargetPos={(pos) => {
              setTargetPos(pos);
            }}
            missileProgress={missileProgress}
            isFiring={isFiring}
            isHit={isHit}
            explosionActive={explosionActive}
          />
        </div>
      </section>

      {/* RIGHT PANEL: Interactive controls and whiteboard notepad */}
      <section className="w-full md:w-[384px] p-6 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-[#e2e8f0] bg-white text-[#1e293b] shadow-sm">
        {/* Console Header / Branding section */}
        <header className="flex flex-col gap-2 pb-3 border-b border-[#e2e8f0]">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <div className="bg-[#0a192f] text-white p-1.5 rounded-lg">
                <Shield className="w-4.5 h-4.5 text-emerald-400" />
              </div>
              <h1 className="text-base font-bold tracking-tight text-[#0a192f]">배틀쉽 게임</h1>
            </div>
          </div>
        </header>

        {/* 1. Status Display block */}
        <article className="bg-[#f8fafc] rounded-[16px] p-5 border border-[#e2e8f0] flex flex-col items-center justify-center min-h-[108px] transition-all">
          <div className="w-full flex flex-col items-center justify-center text-center gap-1" id="state-text-panel">
            {gameState !== GameState.OBSERVATION && gameState !== GameState.AIMING ? (
              <div className="text-base font-bold text-[#1e293b] leading-[1.45]">
                {getStatusText()}
              </div>
            ) : (
              /* Giant Timer Display */
              <div className="flex flex-col items-center justify-center w-full">
                <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1 flex items-center gap-1">
                  <Clock className={`w-3 h-3 ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : ''}`} />
                  남은 시간
                </span>
                <div 
                  className={`font-mono transition-all duration-200 select-none ${
                    timeLeft <= 0 
                      ? 'text-rose-600 font-extrabold text-5xl animate-pulse filter drop-shadow-[0_2px_10px_rgba(225,29,72,0.3)]' 
                      : timeLeft <= 5 
                        ? 'text-rose-500 font-extrabold text-4xl animate-pulse'
                        : 'text-[#0a192f] font-extrabold text-4xl'
                  }`}
                  id="giant-countdown-timer"
                >
                  {timeLeft.toFixed(1)}<span className="text-xl font-bold ml-0.5">초</span>
                </div>
              </div>
            )}
          </div>
        </article>

        {/* 2. Main Action controller triggers & Restart */}
        <article className="flex flex-col gap-2.5">
          {(gameState !== GameState.RESULT || isFiring) && (
            <button
              onClick={handleMainActionClick}
              disabled={gameState === GameState.AIMING && !targetPos}
              className="w-full py-3.5 px-4 text-sm font-bold bg-[#0a192f] text-white rounded-[12px] hover:opacity-90 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              id="main-action-button"
            >
              <span>{getMainBtnLabel()}</span>
            </button>
          )}

          <button
            onClick={handleResetGame}
            className="w-full py-2.5 px-4 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-[12px] transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
            id="reset-game-button"
          >
            <RefreshCw className="w-3.5 h-3.5 opacity-90" />
            <span>다시 시작</span>
          </button>
        </article>

        {/* 3. Electronic whiteboard drawing region */}
        <article className="flex flex-col gap-2">
          <div className="flex justify-between items-center bg-transparent">
            <h2 className="text-[12px] uppercase tracking-[1.5px] font-bold text-[#64748b]">적 함선 위치</h2>
            <button
              onClick={handleClearWhiteboard}
              className="text-[11px] font-bold text-slate-500 hover:text-red-500 border border-slate-200 hover:border-red-200 px-2.5 py-0.5 rounded transition-colors bg-white hover:bg-rose-50 cursor-pointer"
              id="clear-whiteboard-button"
            >
              지우기
            </button>
          </div>

          <Whiteboard ref={whiteboardRef} />
        </article>

        {/* 4. Utility Controls - Grid toggles and Radar sweep toggles */}
        <article className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleToggleGrid}
              className={`py-3 px-2 text-xs font-semibold rounded-[12px] border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                showGrid
                  ? 'bg-sky-500 border-sky-600 text-white font-bold shadow-md'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              id="grid-toggle-button"
            >
              <Grid className="w-4 h-4 opacity-90" />
              <span>격자 {showGrid ? 'OFF' : 'ON'}</span>
            </button>

            <button
              onClick={handleToggleRadar}
              className={`py-3 px-2 text-xs font-semibold rounded-[12px] border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                showRadar
                  ? 'bg-teal-500 border-teal-600 text-white font-bold shadow-md'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              id="radar-toggle-button"
            >
              <Radio className="w-4 h-4 opacity-90" />
              <span>레이더 {showRadar ? 'OFF' : 'ON'}</span>
            </button>
          </div>
        </article>

        {/* 5. Timer Settings Configuration */}
        <article className="flex flex-col gap-2.5 p-3.5 bg-slate-50 rounded-[12px] border border-slate-200" id="timer-config-panel">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">제한 시간 설정 (초)</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-1">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="obs-timer-limit" className="text-[11px] font-semibold text-slate-500">관측 단계 (설명)</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setObservationLimit(prev => Math.max(1, prev - 1))}
                  className="w-7 h-7 flex items-center justify-center bg-white border border-slate-200 rounded-[6px] text-slate-600 font-bold hover:bg-slate-100 cursor-pointer feedback-btn"
                  id="obs-minus-btn"
                >
                  -
                </button>
                <input
                  id="obs-timer-limit"
                  type="number"
                  min="1"
                  value={observationLimit}
                  onChange={(e) => setObservationLimit(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-12 text-xs py-1 border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 text-center font-semibold text-slate-700 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setObservationLimit(prev => prev + 1)}
                  className="w-7 h-7 flex items-center justify-center bg-white border border-slate-200 rounded-[6px] text-slate-600 font-bold hover:bg-slate-100 cursor-pointer feedback-btn"
                  id="obs-plus-btn"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="aim-timer-limit" className="text-[11px] font-semibold text-slate-500">조준 단계 (사격)</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAimingLimit(prev => Math.max(1, prev - 1))}
                  className="w-7 h-7 flex items-center justify-center bg-white border border-slate-200 rounded-[6px] text-slate-600 font-bold hover:bg-slate-100 cursor-pointer feedback-btn"
                  id="aim-minus-btn"
                >
                  -
                </button>
                <input
                  id="aim-timer-limit"
                  type="number"
                  min="1"
                  value={aimingLimit}
                  onChange={(e) => setAimingLimit(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-12 text-xs py-1 border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 text-center font-semibold text-slate-700 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setAimingLimit(prev => prev + 1)}
                  className="w-7 h-7 flex items-center justify-center bg-white border border-slate-200 rounded-[6px] text-slate-600 font-bold hover:bg-slate-100 cursor-pointer feedback-btn"
                  id="aim-plus-btn"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </article>
      </section>

    </div>
  );
}
