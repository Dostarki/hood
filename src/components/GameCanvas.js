import { useEffect, useRef } from 'react';
import { GameEngine } from '@/game/engine';
import { draw } from '@/game/renderer';

export default function GameCanvas({ engineRef, onScore, onEnd, matchDuration = 90, running, playerTeam, aiTeam, mode = 'ai' }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const engine = new GameEngine({ onScore, onEnd, matchDuration, playerTeam, aiTeam, mode });
    engineRef.current = engine;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    engine.canvas = canvas; // expose for screenshot sharing
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);

    const fps = 120;
    const interval = 1000 / fps;

    const loop = (now) => {
      rafRef.current = requestAnimationFrame(loop);
      
      const elapsed = now - last;
      if (elapsed >= interval) {
        const dt = Math.min(32, elapsed);
        last = now - (elapsed % interval);
        
        engine.step(dt);
        const rect = canvas.getBoundingClientRect();
        draw(ctx, engine, rect.width, rect.height);
      }
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
    };
  }, [matchDuration, onScore, onEnd, engineRef, playerTeam, aiTeam, mode]);

  useEffect(() => {
    if (engineRef.current) engineRef.current.paused = !running;
  }, [running, engineRef]);

  return <canvas ref={canvasRef} className="game-canvas" data-testid="game-canvas" />;
}
