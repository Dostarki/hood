import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ArrowRight, ArrowUp } from 'lucide-react';

// Soccer-cleat icon with a direction arrow, styled like the reference art.
function BootIcon({ dir }) {
  return (
    <span className="boot-icon">
      <svg width="40" height="26" viewBox="0 0 64 40" aria-hidden="true">
        <path
          d="M6 9c0-2 1-3 3-3h19c3 0 6 1 9 3l15 9c4 2 6 4 6 8v1c0 2-1 3-3 3H9c-2 0-3-1-3-3V9z"
          fill="currentColor"
        />
        <rect x="6" y="31" width="52" height="4" rx="2" fill="rgba(0,0,0,0.35)" />
        <circle cx="14" cy="37" r="2" fill="currentColor" />
        <circle cx="26" cy="37" r="2" fill="currentColor" />
        <circle cx="40" cy="37" r="2" fill="currentColor" />
        <circle cx="52" cy="37" r="2" fill="currentColor" />
      </svg>
      {dir === 'forward' ? (
        <ArrowRight size={16} strokeWidth={3.5} className="boot-arrow boot-arrow-fwd" />
      ) : (
        <ArrowUp size={16} strokeWidth={3.5} className="boot-arrow boot-arrow-up" />
      )}
    </span>
  );
}

// Multi-touch mobile controls. Uses pointer events so multiple buttons can be pressed simultaneously.
// Layout mirrors the classic head-football reference: movement arrows (left) + action cleats (right).
export default function MobileControls({ engineRef }) {
  const state = useRef({ left: false, right: false, jump: false, shoot: false, lob: false });
  const [pressed, setPressed] = useState({ left: false, right: false, jump: false, shoot: false, lob: false });

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
      if (engineRef.current) engineRef.current.setInput({ left: false, right: false, jump: false, shoot: false, lob: false });
    };
  }, [engineRef]);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between items-end p-4 sm:p-6 z-40"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      {/* Movement cluster */}
      <div className="flex gap-3 pointer-events-auto">
        <button
          type="button"
          data-testid="mobile-btn-left"
          className={`ctrl-btn hb ${pressed.left ? 'pressed' : ''}`}
          {...handlers('left')}
        >
          <ChevronLeft size={38} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          data-testid="mobile-btn-right"
          className={`ctrl-btn hb ${pressed.right ? 'pressed' : ''}`}
          {...handlers('right')}
        >
          <ChevronRight size={38} strokeWidth={2.5} />
        </button>
      </div>

      {/* Action cluster: jump + shoot (flat) + lob (aşırtma) */}
      <div className="flex gap-3 pointer-events-auto">
        <button
          type="button"
          data-testid="mobile-btn-jump"
          className={`ctrl-btn hb ${pressed.jump ? 'pressed' : ''}`}
          {...handlers('jump')}
        >
          <ChevronUp size={38} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          data-testid="mobile-btn-shoot"
          aria-label="Şut"
          className={`ctrl-btn hb action ${pressed.shoot ? 'pressed' : ''}`}
          {...handlers('shoot')}
        >
          <BootIcon dir="forward" />
        </button>
        <button
          type="button"
          data-testid="mobile-btn-lob"
          aria-label="Aşırtma"
          className={`ctrl-btn hb action ${pressed.lob ? 'pressed' : ''}`}
          {...handlers('lob')}
        >
          <BootIcon dir="up" />
        </button>
      </div>
    </div>
  );
}
