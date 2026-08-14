import { useEffect, useRef, useState } from 'react';
import { BOOTS, getBootById } from '@/game/boots';
import { audio } from '@/game/audio';
import { ArrowLeft, ChevronLeft, ChevronRight, FastForward, Zap } from 'lucide-react';

function BootCard({ boot, selected, onClick, testId }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = 220 * dpr;
    c.height = 220 * dpr;
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, 220, 220);
    
    // Draw boot preview
    import('@/game/renderer').then(({ drawBoot }) => {
      drawBoot(ctx, 110, 110, 1, boot, 2, 0);
    });
  }, [boot]);

  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className="flex flex-col items-stretch bg-black/60 backdrop-blur-md hover:bg-black/80 transition-colors"
      style={{
        border: selected ? `2px solid ${boot.color}` : '1px solid rgba(255,255,255,0.15)',
        boxShadow: selected ? `4px 4px 0px ${boot.color}` : 'none',
      }}
    >
      <canvas ref={canvasRef} style={{ width: 220, height: 220, background: 'rgba(255,255,255,0.02)' }} />
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: selected ? boot.color : 'rgba(255,255,255,0.03)' }}>
        <div className="font-heading text-xl tracking-widest text-center w-full" style={{ color: selected ? '#0A0D0B' : '#FFFFFF' }}>
          {boot.name}
        </div>
      </div>
      
      {/* Stats bar */}
      <div className="flex justify-between px-4 py-2 border-t border-white/10 bg-black/40">
        <div className="flex items-center gap-1">
          <FastForward size={14} color="#00FF66" />
          <span className="font-heading text-xs text-white/80 tracking-wider">HIZ: +{boot.spdBonus}</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap size={14} color="#F4E04D" />
          <span className="font-heading text-xs text-white/80 tracking-wider">ŞUT: +{boot.powBonus}</span>
        </div>
      </div>
    </button>
  );
}

export default function BootScreen({ initialBootId, onBack, onSave }) {
  const [bootId, setBootId] = useState(initialBootId || BOOTS[0].id);
  const boot = getBootById(bootId);

  const cycleBoot = (dir) => {
    audio.menu();
    const idx = BOOTS.findIndex((b) => b.id === bootId);
    const next = (idx + dir + BOOTS.length) % BOOTS.length;
    setBootId(BOOTS[next].id);
  };

  const handleSave = () => {
    audio.menu();
    onSave(boot);
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col overflow-y-auto" data-testid="boot-screen">
      <div className="menu-bg" />
      <div className="grid-noise" />

      <div className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-6 sm:px-10 py-8 sm:py-12 fade-in">
        <button
          type="button"
          data-testid="back-btn"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors font-heading tracking-widest text-sm mb-8"
          onClick={() => { audio.menuBack(); onBack(); }}
        >
          <ArrowLeft size={16} strokeWidth={2.5} /> GERİ
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-3 w-3" style={{ background: boot.color }} />
          <div className="font-heading text-sm tracking-[0.4em] text-white/70">KRAMPON SEÇİMİ</div>
        </div>
        <h2
          className="font-heading uppercase text-white leading-none tracking-tighter"
          style={{ fontSize: 'clamp(2.5rem, 8vw, 5.5rem)' }}
        >
          AYAKKABINI <span style={{ color: boot.color }}>SEÇ</span>
        </h2>
        <p className="font-heading text-white/60 tracking-widest mt-2">{boot.desc}</p>

        {/* Selection preview */}
        <div className="mt-8 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="flex items-center justify-center gap-6">
              <button
                type="button"
                data-testid="boot-prev"
                className="w-14 h-14 flex items-center justify-center border border-white/20 bg-black/60 hover:bg-white/10 transition-colors"
                onClick={() => cycleBoot(-1)}
              >
                <ChevronLeft size={32} strokeWidth={2.5} />
              </button>
              <BootCard boot={boot} selected testId="player-boot-card" />
              <button
                type="button"
                data-testid="boot-next"
                className="w-14 h-14 flex items-center justify-center border border-white/20 bg-black/60 hover:bg-white/10 transition-colors"
                onClick={() => cycleBoot(1)}
              >
                <ChevronRight size={32} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Grid of all boots as quick-pick */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="font-heading text-white/50 tracking-[0.3em] text-xs mb-3 text-center">HIZLI SEÇİM</div>
          <div className="flex flex-wrap justify-center gap-4">
            {BOOTS.map((b) => {
              const isSelected = b.id === bootId;
              return (
                <button
                  type="button"
                  key={b.id}
                  data-testid={`quick-boot-${b.id}`}
                  onClick={() => { audio.menu(); setBootId(b.id); }}
                  className="flex flex-col items-center gap-2 px-6 py-4 border transition-colors rounded-lg min-w-[120px]"
                  style={{
                    borderColor: isSelected ? b.color : 'rgba(255,255,255,0.15)',
                    background: isSelected ? `${b.color}22` : 'rgba(0,0,0,0.4)',
                  }}
                  title={b.name}
                >
                  <div className="font-heading text-sm tracking-widest mt-1" style={{ color: isSelected ? b.color : '#ffffff90' }}>{b.name}</div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-[#00FF66]">H:{b.spdBonus}</span>
                    <span className="text-xs text-[#F4E04D]">Ş:{b.powBonus}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <button
            type="button"
            data-testid="boot-save-btn"
            className="btn-brutal flex items-center gap-3"
            onClick={handleSave}
          >
            GİY VE KAYDET
          </button>
        </div>
      </div>
    </div>
  );
}