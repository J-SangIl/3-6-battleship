import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import enemyShipImg from '../assets/images/enemy_fighter_jet_1780567377889.png';

export enum GameState {
  INITIAL = 'INITIAL',
  OBSERVATION = 'OBSERVATION',
  AIMING = 'AIMING',
  RESULT = 'RESULT'
}

export interface Point {
  x: number;
  y: number;
}

interface RadarBoardProps {
  gameState: GameState;
  showGrid: boolean;
  enemyPos: Point | null;
  enemyEmoji: string;
  targetPos: Point | null;
  setTargetPos: (pos: Point) => void;
  missileProgress: number; // 0 to 1
  isFiring: boolean;
  isHit: boolean;
  explosionActive: boolean;
}

export const RadarBoard: React.FC<RadarBoardProps> = ({
  gameState,
  showGrid,
  enemyPos,
  enemyEmoji,
  targetPos,
  setTargetPos,
  missileProgress,
  isFiring,
  isHit,
  explosionActive,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<number>(400);
  const [shipImage, setShipImage] = useState<HTMLImageElement | HTMLCanvasElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      // Process image to remove white background dynamically
      const offscreen = document.createElement('canvas');
      offscreen.width = img.width;
      offscreen.height = img.height;
      const oCtx = offscreen.getContext('2d');
      if (oCtx) {
        oCtx.drawImage(img, 0, 0);
        try {
          const imgData = oCtx.getImageData(0, 0, offscreen.width, offscreen.height);
          const data = imgData.data;
          // Filter white pixels (r > 245, g > 245, b > 245) and make them fully transparent
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (r > 245 && g > 245 && b > 245) {
              data[i + 3] = 0; // alpha = 0 (fully transparent)
            }
          }
          oCtx.putImageData(imgData, 0, 0);
          setShipImage(offscreen);
        } catch (error) {
          console.error('Failed to make background transparent', error);
          setShipImage(img);
        }
      } else {
        setShipImage(img);
      }
    };
    img.src = enemyShipImg;
  }, []);

  // Maintain symmetry $[-6.5, 6.5]$ in the view matrix so $[-6, 6]$ is fully inside with marginal padding.
  const logicalMin = -6.5;
  const logicalMax = 6.5;

  // Handle Resize beautifully
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      const width = containerRef.current?.clientWidth || 400;
      // Keep it a perfect square
      setSize(width);
    };

    updateSize();
    const observer = new ResizeObserver(() => updateSize());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Logical coordinates to pixel conversion
  const toPixel = (x: number, y: number) => {
    const scale = size / (logicalMax - logicalMin);
    const px = (x - logicalMin) * scale;
    const py = (logicalMax - y) * scale; // Keep normal mathematical orientation (y up is positive)
    return { x: px, y: py };
  };

  // Pixel coordinates to logical coordinate conversion (snapping or free form)
  const toLogical = (px: number, py: number): Point => {
    const scale = size / (logicalMax - logicalMin);
    const x = logicalMin + px / scale;
    const y = logicalMax - py / scale;
    return { x, y };
  };

  // Handle Click/Touch targeting
  const handleInteraction = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState !== GameState.AIMING) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const px = clientX - rect.left;
    const py = clientY - rect.top;

    // Convert to logical coordinates
    const logical = toLogical(px, py);

    // Limit logical coordinates within [-6, 6] range for strict gameplay constraints
    const clampedX = Math.max(-6, Math.min(6, logical.x));
    const clampedY = Math.max(-6, Math.min(6, logical.y));

    // For better game play and education context, let's round target position to nearest 0.25 (optional, or let it be continuous)
    // The user target can be precise or on a 0.25 grid. Let's make it continuous for precise coordinate estimation!
    setTargetPos({ x: clampedX, y: clampedY });
  };

  // Redraw Canvas content loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const startTime = performance.now();

    const render = () => {
      const currentTime = performance.now();
      const elapsedSeconds = (currentTime - startTime) / 1000;

      const centerPx = toPixel(0, 0);

      // 1. Clear with crisp white/light-blue background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);

      // 2. Draw Grid and Coordinates if turned ON
      if (showGrid) {
        // Horizontal and Vertical Tick Lines
        ctx.lineWidth = 1;
        for (let i = -6; i <= 6; i++) {
          if (i === 0) continue; // Skip axis line for now

          // Vertical Lines
          const verticalStart = toPixel(i, -6);
          const verticalEnd = toPixel(i, 6);
          ctx.beginPath();
          ctx.moveTo(verticalStart.x, verticalStart.y);
          ctx.lineTo(verticalEnd.x, verticalEnd.y);
          ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)'; // Fine slate-gray grid lines
          ctx.stroke();

          // Horizontal Lines
          const horizontalStart = toPixel(-6, i);
          const horizontalEnd = toPixel(6, i);
          ctx.beginPath();
          ctx.moveTo(horizontalStart.x, horizontalStart.y);
          ctx.lineTo(horizontalEnd.x, horizontalEnd.y);
          ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)';
          ctx.stroke();
        }

        // Bolder Origin Axes (X and Y axis)
        ctx.lineWidth = 2.0;
        ctx.strokeStyle = 'rgba(2, 132, 199, 0.35)'; // Modern sky blue axes

        // Y Axis line
        const yStart = toPixel(0, -6);
        const yEnd = toPixel(0, 6.2); // Extended slightly to top for arrow
        ctx.beginPath();
        ctx.moveTo(yStart.x, yStart.y);
        ctx.lineTo(yEnd.x, yEnd.y);
        ctx.stroke();

        // X Axis line
        const xStart = toPixel(-6.2, 0); // Extended slightly to left for arrow
        const xEnd = toPixel(6, 0);
        ctx.beginPath();
        ctx.moveTo(xStart.x, xStart.y);
        ctx.lineTo(xEnd.x, xEnd.y);
        ctx.stroke();

        // Draw arrowheads at Y-axis top (pointing up) and X-axis left (pointing left)
        const arrowH = Math.max(10, size * 0.018);
        const arrowW = arrowH * 0.5;

        ctx.save();
        ctx.fillStyle = 'rgba(2, 132, 199, 0.65)';
        
        ctx.beginPath();
        ctx.moveTo(yEnd.x, yEnd.y);
        ctx.lineTo(yEnd.x - arrowW, yEnd.y + arrowH);
        ctx.lineTo(yEnd.x + arrowW, yEnd.y + arrowH);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(xStart.x, xStart.y);
        ctx.lineTo(xStart.x + arrowH, xStart.y - arrowW);
        ctx.lineTo(xStart.x + arrowH, xStart.y + arrowW);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // 3. Status 2 Scan line & Blinking Enemy
      if (gameState === GameState.OBSERVATION) {
        // Sweeping scanner line
        const angle = elapsedSeconds * 1.5; // Custom speed of swept line
        const rLen = size * 0.9;
        const targetX = Math.cos(angle) * rLen;
        const targetY = Math.sin(angle) * rLen;

        // Draw sweeping scan segment
        ctx.beginPath();
        ctx.moveTo(centerPx.x, centerPx.y);
        ctx.lineTo(centerPx.x + targetX, centerPx.y + targetY);
        ctx.lineWidth = 4; // Bolder sweep indicator
        const sweepGradLine = ctx.createLinearGradient(centerPx.x, centerPx.y, centerPx.x + targetX, centerPx.y + targetY);
        sweepGradLine.addColorStop(0, 'rgba(14, 165, 233, 0.75)'); // Glowing sky-blue
        sweepGradLine.addColorStop(1, 'rgba(14, 165, 233, 0)');
        ctx.strokeStyle = sweepGradLine;
        ctx.stroke();

        // Draw sweep gradient fan for beautiful cyber feel
        ctx.beginPath();
        ctx.moveTo(centerPx.x, centerPx.y);
        ctx.arc(centerPx.x, centerPx.y, size * 0.8, angle - 0.3, angle, false);
        ctx.closePath();
        const scanGrad = ctx.createRadialGradient(centerPx.x, centerPx.y, 0, centerPx.x, centerPx.y, size * 0.8);
        scanGrad.addColorStop(0, 'rgba(14, 165, 233, 0.18)'); // Soft cyber fan glow
        scanGrad.addColorStop(1, 'rgba(14, 165, 233, 0.0)');
        ctx.fillStyle = scanGrad;
        ctx.fill();

        // Blinking Enemy
        if (enemyPos) {
          const ePx = toPixel(enemyPos.x, enemyPos.y);
          // Blinking period 2 seconds exactly: full loop = 2 * PI radians over 2s => coefficient = PI
          const phase = Math.PI * elapsedSeconds;
          const opacity = 0.5 + 0.5 * Math.cos(phase);

          ctx.save();
          ctx.globalAlpha = opacity;
          if (shipImage) {
            const width = Math.max(34, size / 8);
            const height = width * (shipImage.height / shipImage.width || 0.4);
            ctx.drawImage(shipImage, ePx.x - width / 2, ePx.y - height / 2, width, height);
          } else {
            ctx.font = `${Math.max(16, size / 13)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(enemyEmoji, ePx.x, ePx.y);
          }

          ctx.restore();
        }
      }

      // 4. Draw Center Red Point (Always present)
      ctx.beginPath();
      ctx.arc(centerPx.x, centerPx.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#EF4444'; // Hot red center point (0,0)
      ctx.shadowColor = '#EF4444';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      // 5. State 4 (Missile and Explosion flight animation)
      if (gameState === GameState.RESULT) {
        // If missile is currently flying
        if (isFiring && targetPos) {
          const startPx = toPixel(0, 0);
          const endPx = toPixel(targetPos.x, targetPos.y);

          // Compute interpolated position
          const curPxX = startPx.x + (endPx.x - startPx.x) * missileProgress;
          const curPxY = startPx.y + (endPx.y - startPx.y) * missileProgress;

          // Draw flying Rocket Emoji (rotated in motion direction)
          ctx.save();
          ctx.translate(curPxX, curPxY);

          const dx = endPx.x - startPx.x;
          const dy = endPx.y - startPx.y;
          const headingAngle = Math.atan2(dy, dx);
          // Unicode 🚀 rocket emoji points diagonally up-right (-45 deg or -Math.PI / 4) in standard view.
          // To align it to headingAngle, we rotate it by headingAngle + Math.PI / 4.
          ctx.rotate(headingAngle + Math.PI / 4);

          ctx.font = `${Math.max(14, size / 16)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🚀', 0, 0);
          ctx.restore();
        }

        // If target explosion is currently happening
        if (explosionActive && targetPos) {
          const tPx = toPixel(targetPos.x, targetPos.y);
          ctx.save();
          // Expanding explosion effect!
          const pulse = (Math.sin(elapsedSeconds * 20) + 1) / 2; // quick oscillation
          const explSize = Math.max(30, size / 8) + pulse * 15;
          ctx.font = `${explSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💥', tPx.x, tPx.y);
          ctx.restore();
        }

        // Show the ultimate state of enemy ship
        if (!isFiring && enemyPos) {
          const ePx = toPixel(enemyPos.x, enemyPos.y);
          ctx.save();

          if (shipImage) {
            const width = Math.max(34, size / 8);
            const height = width * (shipImage.height / shipImage.width || 0.4);
            ctx.drawImage(shipImage, ePx.x - width / 2, ePx.y - height / 2, width, height);
          } else {
            ctx.font = `${Math.max(16, size / 13)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(enemyEmoji, ePx.x, ePx.y);
          }

          ctx.restore();
        }
      }

      // 6. Draw Target Crosshair (State 3 & 4) layered on top of ship and visuals
      if ((gameState === GameState.AIMING || gameState === GameState.RESULT) && targetPos) {
        const tPx = toPixel(targetPos.x, targetPos.y);
        const radius = size * 0.04; // Adaptive size
        
        ctx.save();
        ctx.strokeStyle = '#EF4444'; // Bold Red
        ctx.lineWidth = 2;

        // Custom Crosshair: Circular ring
        ctx.beginPath();
        ctx.arc(tPx.x, tPx.y, radius, 0, 2 * Math.PI);
        ctx.stroke();

        // Inner core point
        ctx.beginPath();
        ctx.arc(tPx.x, tPx.y, 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#EF4444';
        ctx.fill();

        // Crosshairs lines
        ctx.beginPath();
        ctx.moveTo(tPx.x - radius * 1.5, tPx.y);
        ctx.lineTo(tPx.x + radius * 1.5, tPx.y);
        ctx.moveTo(tPx.x, tPx.y - radius * 1.5);
        ctx.lineTo(tPx.x, tPx.y + radius * 1.5);
        ctx.stroke();
        
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [size, gameState, showGrid, enemyPos, enemyEmoji, targetPos, missileProgress, isFiring, isHit, explosionActive, shipImage]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square bg-[#ffffff] rounded-[24px] overflow-hidden shadow-lg border border-slate-300"
      id="radar-board-container"
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="block cursor-crosshair touch-none"
        onMouseDown={handleInteraction}
        onMouseMove={(e) => e.buttons === 1 && handleInteraction(e)}
        onTouchStart={handleInteraction}
        onTouchMove={handleInteraction}
        id="radar-board-canvas"
      />
      {/* Dynamic Radar Scope Sweep Lines (Overlay decoration) */}
      <div className="absolute inset-0 pointer-events-none rounded-[24px] border border-slate-300/10" />
    </div>
  );
};
