import { Play, Home } from 'lucide-react';

export default function PauseOverlay({ onResume, onMenu }) {
  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center"
      style={{ background: 'rgba(10, 13, 11, 0.85)', backdropFilter: 'blur(8px)' }}
      data-testid="pause-overlay"
    >
      <div className="w-full max-w-lg px-8 text-center fade-in">
        <div className="font-heading text-white/50 tracking-[0.4em] text-sm mb-2">DURDURULDU</div>
        <div
          className="font-heading uppercase leading-none tracking-tighter text-white"
          style={{ fontSize: 'clamp(3rem, 9vw, 6rem)' }}
        >
          MOLA
        </div>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            type="button"
            data-testid="resume-btn"
            className="btn-brutal flex items-center gap-3"
            onClick={onResume}
          >
            <Play size={20} strokeWidth={3} />
            DEVAM
          </button>
          <button
            type="button"
            data-testid="quit-btn"
            className="btn-brutal secondary flex items-center gap-3"
            onClick={onMenu}
          >
            <Home size={20} strokeWidth={2.5} />
            ANA MENÜ
          </button>
        </div>
      </div>
    </div>
  );
}
