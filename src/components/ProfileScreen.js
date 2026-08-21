import { useEffect, useRef, useState } from 'react';
import { TEAMS, getTeamById } from '@/game/teams';
import { drawTeamPreview } from '@/game/renderer';
import { audio } from '@/game/audio';
import { ArrowLeft, Play, ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';

function TeamCard({ team, selected, onClick, testId }) {
  const canvasRef = useRef(null);
  const Icon = team.icon;

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = 220 * dpr;
    c.height = 220 * dpr;
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, 220, 220);
    drawTeamPreview(ctx, 110, 105, 130, team);
  }, [team]);

  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className="flex flex-col items-stretch bg-black/60 backdrop-blur-md hover:bg-black/80 transition-colors"
      style={{
        border: selected ? `2px solid ${team.primary}` : '1px solid rgba(255,255,255,0.15)',
        boxShadow: selected ? `4px 4px 0px ${team.primary}` : 'none',
      }}
    >
      <canvas ref={canvasRef} style={{ width: 220, height: 220, background: 'rgba(255,255,255,0.02)' }} />
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: selected ? team.primary : 'rgba(255,255,255,0.03)' }}>
        <Icon size={20} strokeWidth={2.5} color={selected ? '#0A0D0B' : team.primary} />
        <div className="font-heading text-xl tracking-widest" style={{ color: selected ? '#0A0D0B' : '#FFFFFF' }}>
          {team.name}
        </div>
      </div>
    </button>
  );
}

export default function ProfileScreen({ initialPlayerId, onBack, onSave }) {
  const [playerId, setPlayerId] = useState(initialPlayerId || TEAMS[0].id);

  const player = getTeamById(playerId);

  const cyclePlayer = (dir) => {
    audio.menu();
    const idx = TEAMS.findIndex((t) => t.id === playerId);
    const next = (idx + dir + TEAMS.length) % TEAMS.length;
    setPlayerId(TEAMS[next].id);
  };

  const handleSave = () => {
    audio.menu();
    onSave(player);
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col overflow-y-auto" data-testid="profile-screen">
      <div className="menu-bg" />
      <div className="grid-noise" />

      <div className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-6 sm:px-10 py-8 sm:py-12 fade-in">
        <button
          type="button"
          data-testid="back-btn"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors font-heading tracking-widest text-sm mb-8"
          onClick={() => { audio.menuBack(); onBack(); }}
        >
          <ArrowLeft size={16} strokeWidth={2.5} /> BACK
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-3 w-3 bg-[#00FF66]" />
          <div className="font-heading text-sm tracking-[0.4em] text-white/70">PROFILE</div>
        </div>
        <h2
          className="font-heading uppercase text-white leading-none tracking-tighter"
          style={{ fontSize: 'clamp(2.5rem, 8vw, 5.5rem)' }}
        >
          CHOOSE YOUR <span style={{ color: player.primary }}>CHARACTER</span>
        </h2>

        {/* Selection preview */}
        <div className="mt-8 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="flex items-center justify-center gap-6">
              <button
                type="button"
                data-testid="player-prev"
                className="w-14 h-14 flex items-center justify-center border border-white/20 bg-black/60 hover:bg-white/10 transition-colors"
                onClick={() => cyclePlayer(-1)}
              >
                <ChevronLeft size={32} strokeWidth={2.5} />
              </button>
              <TeamCard team={player} selected testId="player-team-card" />
              <button
                type="button"
                data-testid="player-next"
                className="w-14 h-14 flex items-center justify-center border border-white/20 bg-black/60 hover:bg-white/10 transition-colors"
                onClick={() => cyclePlayer(1)}
              >
                <ChevronRight size={32} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Grid of all teams as quick-pick */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="font-heading text-white/50 tracking-[0.3em] text-xs mb-3 text-center">QUICK SELECT</div>
          <div className="flex flex-wrap justify-center gap-4">
            {TEAMS.map((t) => {
              const Icon = t.icon;
              const isMe = t.id === playerId;
              return (
                <button
                  type="button"
                  key={t.id}
                  data-testid={`quick-team-${t.id}`}
                  onClick={() => { audio.menu(); setPlayerId(t.id); }}
                  className="flex flex-col items-center gap-2 px-6 py-4 border transition-colors rounded-lg min-w-[120px]"
                  style={{
                    borderColor: isMe ? t.primary : 'rgba(255,255,255,0.15)',
                    background: isMe ? `${t.primary}22` : 'rgba(0,0,0,0.4)',
                  }}
                  title={t.name}
                >
                  <Icon size={28} strokeWidth={2.5} color={t.primary} />
                  <div className="font-heading text-sm tracking-widest mt-1" style={{ color: isMe ? t.primary : '#ffffff90' }}>{t.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <button
            type="button"
            data-testid="profile-save-btn"
            className="btn-brutal flex items-center gap-3"
            onClick={handleSave}
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
}
