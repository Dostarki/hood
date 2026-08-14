import { useEffect, useState } from 'react';

// Reads from engine and refreshes at ~10fps.
export default function HUD({ engineRef, onPause, playerTeam, aiTeam }) {
  const [state, setState] = useState({ scoreL: 0, scoreR: 0, time: 90 });
  const [flash, setFlash] = useState(null); // 'left' | 'right' | null

  useEffect(() => {
    let last = { scoreL: 0, scoreR: 0 };
    const id = setInterval(() => {
      const e = engineRef.current;
      if (!e) return;
      setState({ scoreL: e.scoreL, scoreR: e.scoreR, time: e.time });
      if (e.scoreL !== last.scoreL) {
        setFlash('left');
        setTimeout(() => setFlash(null), 550);
      }
      if (e.scoreR !== last.scoreR) {
        setFlash('right');
        setTimeout(() => setFlash(null), 550);
      }
      last = { scoreL: e.scoreL, scoreR: e.scoreR };
    }, 100);
    return () => clearInterval(id);
  }, [engineRef]);

  const timeWarn = state.time <= 10;
  const mm = String(Math.floor(state.time / 60)).padStart(1, '0');
  const ss = String(state.time % 60).padStart(2, '0');

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 p-3 sm:p-5">
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="hidden sm:block font-heading text-lg tracking-widest"
            style={{ color: playerTeam?.primary || '#00FF66' }}
            data-testid="team-label-left"
          >
            {playerTeam?.name || 'YOU'}
          </div>
          <div className={`score-badge ${flash === 'left' ? 'flash' : ''}`} data-testid="score-left">
            {state.scoreL}
          </div>
        </div>
        <div className={`timer-badge ${timeWarn ? 'warning' : ''}`} data-testid="timer">
          {mm}:{ss}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`score-badge ${flash === 'right' ? 'flash' : ''}`} data-testid="score-right">
            {state.scoreR}
          </div>
          <div
            className="hidden sm:block font-heading text-lg tracking-widest"
            style={{ color: aiTeam?.primary || '#FF3B30' }}
            data-testid="team-label-right"
          >
            {aiTeam?.name || 'CPU'}
          </div>
        </div>
      </div>
      <div className="flex justify-center mt-2">
        <button
          type="button"
          onClick={onPause}
          data-testid="pause-btn"
          className="pointer-events-auto text-xs tracking-widest uppercase font-heading text-white/70 hover:text-white transition-colors"
        >
          [ ESC ] PAUSE
        </button>
      </div>
    </div>
  );
}
