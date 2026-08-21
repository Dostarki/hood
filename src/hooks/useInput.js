import { useEffect } from 'react';

// Hold Space longer than this (ms) => lob (aşırtma). Shorter tap => flat shot.
const LOB_HOLD_MS = 160;
// How long a quick Space tap keeps the flat-shot input active (ms).
const SHOOT_PULSE_MS = 90;

// Attaches keyboard listeners and pipes input state to engineRef.current.
export function useKeyboardInput(engineRef, active) {
  useEffect(() => {
    if (!active) return;
    const keys = { left: false, right: false, jump: false, shoot: false, lob: false };

    let spaceHeld = false;
    let lobTimer = null;
    let shootPulseTimer = null;

    const push = () => {
      const eng = engineRef.current;
      if (eng) eng.setInput(keys);
    };

    // Space: quick tap = flat shot (responsive), hold = lob / aşırtma.
    const handleSpace = (val) => {
      if (val) {
        if (spaceHeld) return; // ignore key auto-repeat
        spaceHeld = true;
        // Fire a flat shot immediately for responsive taps...
        keys.shoot = true;
        keys.lob = false;
        push();
        if (shootPulseTimer) clearTimeout(shootPulseTimer);
        shootPulseTimer = setTimeout(() => { keys.shoot = false; push(); }, SHOOT_PULSE_MS);
        // ...but if Space stays held, upgrade to a lob and keep it while held.
        if (lobTimer) clearTimeout(lobTimer);
        lobTimer = setTimeout(() => {
          if (spaceHeld) { keys.lob = true; keys.shoot = false; push(); }
        }, LOB_HOLD_MS);
      } else {
        spaceHeld = false;
        if (lobTimer) { clearTimeout(lobTimer); lobTimer = null; }
        if (shootPulseTimer) { clearTimeout(shootPulseTimer); shootPulseTimer = null; }
        keys.shoot = false;
        keys.lob = false;
        push();
      }
    };

    const setKey = (e, val) => {
      const eng = engineRef.current;
      if (!eng) return;
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          keys.left = val; e.preventDefault(); push(); break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          keys.right = val; e.preventDefault(); push(); break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          keys.jump = val; e.preventDefault(); push(); break;
        case ' ':
        case 'Spacebar':
          e.preventDefault(); handleSpace(val); break;
        default:
          break;
      }
    };

    const down = (e) => setKey(e, true);
    const up = (e) => setKey(e, false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      if (lobTimer) clearTimeout(lobTimer);
      if (shootPulseTimer) clearTimeout(shootPulseTimer);
    };
  }, [engineRef, active]);
}
