import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

interface WhiteboardProps {
  onClearCallback?: () => void;
}

export interface WhiteboardHandle {
  clear: () => void;
}

export const Whiteboard = forwardRef<WhiteboardHandle, WhiteboardProps>(({ onClearCallback }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvas size responsively
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      // Keep existing drawing data during resize
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(canvas, 0, 0);
      }

      // Resize
      const rect = container.getBoundingClientRect();
      const newWidth = Math.max(280, rect.width);
      const newHeight = Math.max(180, rect.height || 220);

      canvas.width = newWidth;
      canvas.height = newHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#1E293B'; // Slate dark gray ink
        ctx.lineWidth = 3;

        // Draw temporary backup back
        ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);
      }
    };

    resizeCanvas();
    const observer = new ResizeObserver(() => resizeCanvas());
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // Expose clear function via ref
  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (onClearCallback) onClearCallback();
    },
  }));

  const getPosition = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getPosition(e);
    if (!pos) return;

    setIsDrawing(true);
    lastPos.current = pos;

    // Draw a single dot right on start
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#1E293B';
      ctx.fill();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPos.current) return;
    e.preventDefault();

    const currPos = getPosition(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!currPos || !ctx) return;

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(currPos.x, currPos.y);
    ctx.stroke();

    lastPos.current = currPos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[220px] bg-white rounded-xl border-2 border-[#e2e8f0] overflow-hidden flex flex-col"
      id="whiteboard-container"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none cursor-crosshair bg-white"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        id="whiteboard-canvas"
      />
    </div>
  );
});

Whiteboard.displayName = 'Whiteboard';
