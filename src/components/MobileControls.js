import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowUp, Zap } from 'lucide-react';

// Multi-touch mobile controls. Uses pointer events so multiple buttons can be pressed simultaneously.
export default function MobileControls({ engineRef }) {
  const state = useRef({ left: false, right: false, jump: false, shoot: false });
  const [pressed, setPressed] = useState({ left: false, right: false, jump: false, shoot: false });

  const commit = () => {
    setPressed({ ...state.current });
    if (engineRef.current) engineRef.current.setInput({ ...state.current });
  };

  const set = (name, val) => {
    state.current[name] = val;
    commit();
  };

  // If pointer leaves button while pressed, release
  const handlers = (name) => ({
    onPointerDown: (e) => {
      e.preventDefault();
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      set(name, true);
    },
    onPointerUp: (e) => { e.preventDefault(); set(name, false); },
    onPointerCancel: () => set(name, false),
    onPointerLeave: (e) => {
      // Only release if pointer is not captured
      if (!e.currentTarget.hasPointerCapture || !e.currentTarget.hasPointerCapture(e.pointerId)) {
        set(name, false);
      }
    },
    onContextMenu: (e) => e.preventDefault(),
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) engineRef.current.setInput({ left: false, right: false, jump: false, shoot: false });
    };
  }, [engineRef]);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between items-end p-4 sm:p-6 z-40"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex gap-3 pointer-events-auto">
        <button
          type="button"
          data-testid="mobile-btn-left"
          className={`ctrl-btn ${pressed.left ? 'pressed' : ''}`}
          {...handlers('left')}
        >
          <ChevronLeft size={38} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          data-testid="mobile-btn-right"
          className={`ctrl-btn ${pressed.right ? 'pressed' : ''}`}
          {...handlers('right')}
        >
          <ChevronRight size={38} strokeWidth={2.5} />
        </button>
      </div>
      <div className="flex gap-3 pointer-events-auto">
        <button
          type="button"
          data-testid="mobile-btn-jump"
          className={`ctrl-btn ${pressed.jump ? 'pressed' : ''}`}
          {...handlers('jump')}
        >
          <ArrowUp size={38} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          data-testid="mobile-btn-shoot"
          className={`ctrl-btn action ${pressed.shoot ? 'pressed' : ''}`}
          {...handlers('shoot')}
        >
          <Zap size={34} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
