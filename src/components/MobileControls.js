import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Soccer-cleat icon with an optional direction indicator, styled like the reference art.
// variant: 'forward' (→ shoot) | 'up' (↑ jump) | 'lob' (chip / aşırtma, motion lines)
function BootIcon({ variant }) {
  return (
    <span className="boot-icon">
      {variant === 'lob' && (
        <svg className="boot-lines" width="18" height="24" viewBox="0 0 18 24" aria-hidden="true">
          <rect x="2" y="4" width="12" height="3" rx="1.5" fill="currentColor" opacity="0.9" />
          <rect x="0" y="10.5" width="16" height="3" rx="1.5" fill="currentColor" opacity="0.75" />
          <rect x="3" y="17" width="10" height="3" rx="1.5" fill="currentColor" opacity="0.6" />
        </svg>
      )}
      <svg className="boot-svg" width="34" height="22" viewBox="0 0 64 40" aria-hidden="true">
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
      {variant === 'forward' && (
        <svg className="boot-dir boot-dir-fwd" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 12h13M12 6l7 6-7 6" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {variant === 'up' && (
        <svg className="boot-dir boot-dir-up" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 20V7M6 12l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

// Multi-touch mobile controls. Uses pointer events so multiple buttons can be pressed simultaneously.
// Single anchored bar: movement arrows (left) + action cleats (right), matching the reference art.
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
    <div className="mobile-controls">
      {/* Movement cluster */}
      <div className="mc-group">
        <button
          type="button"
          data-testid="mobile-btn-left"
          aria-label="Move left"
          className={`ctrl-btn hb ${pressed.left ? 'pressed' : ''}`}
          {...handlers('left')}
        >
          <ChevronLeft className="mc-ico" strokeWidth={3} />
        </button>
        <button
          type="button"
          data-testid="mobile-btn-right"
          aria-label="Move right"
          className={`ctrl-btn hb ${pressed.right ? 'pressed' : ''}`}
          {...handlers('right')}
        >
          <ChevronRight className="mc-ico" strokeWidth={3} />
        </button>
      </div>

      {/* Action cluster: shoot (flat) + jump + lob (chip / aşırtma) */}
      <div className="mc-group">
        <button
          type="button"
          data-testid="mobile-btn-shoot"
          aria-label="Shot"
          className={`ctrl-btn hb action ${pressed.shoot ? 'pressed' : ''}`}
          {...handlers('shoot')}
        >
          <BootIcon variant="forward" />
        </button>
        <button
          type="button"
          data-testid="mobile-btn-jump"
          aria-label="Jump"
          className={`ctrl-btn hb action ${pressed.jump ? 'pressed' : ''}`}
          {...handlers('jump')}
        >
          <BootIcon variant="up" />
        </button>
        <button
          type="button"
          data-testid="mobile-btn-lob"
          aria-label="Lob"
          className={`ctrl-btn hb action ${pressed.lob ? 'pressed' : ''}`}
          {...handlers('lob')}
        >
          <BootIcon variant="lob" />
        </button>
      </div>
    </div>
  );
}
