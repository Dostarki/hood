import { useEffect } from 'react';

// Attaches keyboard listeners and pipes input state to engineRef.current.
export function useKeyboardInput(engineRef, active) {
  useEffect(() => {
    if (!active) return;
    const keys = { left: false, right: false, jump: false, shoot: false };

    const setKey = (e, val) => {
      const eng = engineRef.current;
      if (!eng) return;
      let handled = true;
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          keys.left = val; break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          keys.right = val; break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
        case 'Spacebar':
          if (e.key === ' ' || e.key === 'Spacebar') keys.shoot = val;
          else keys.jump = val;
          break;
        default:
          handled = false;
      }
      if (handled) {
        e.preventDefault();
        eng.setInput(keys);
      }
    };

    const down = (e) => setKey(e, true);
    const up = (e) => setKey(e, false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [engineRef, active]);
}
