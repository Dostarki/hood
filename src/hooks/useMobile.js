import { useEffect, useState } from 'react';

// Detect mobile / touch device
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => detect());
  useEffect(() => {
    const handler = () => setIsMobile(detect());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

function detect() {
  if (typeof window === 'undefined') return false;
  const touch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const narrow = window.innerWidth <= 900;
  return touch || narrow;
}
