import { Volume2, VolumeX, Play, Wifi, User, ShoppingBag } from 'lucide-react';
import { audio } from '@/game/audio';
import StatsCard from '@/components/StatsCard';

export default function MainMenu({ onStartAiMatch, onOpenProfile, onOpenBoots, onFindMatch, soundOn, onToggleSound, stats, playerTeamName }) {
  const handleStart = () => {
    audio.menu();
    onStartAiMatch();
  };

  const handleProfile = () => {
    audio.menu();
    onOpenProfile();
  };

  const handleBoots = () => {
    audio.menu();
    onOpenBoots();
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center overflow-y-auto">
      <div className="menu-bg" />
      <div className="grid-noise" />

      <div className="relative z-10 w-full max-w-5xl px-6 sm:px-10 py-8 sm:py-12 fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-3 w-3 bg-[#00FF66]" />
          <div className="font-heading text-sm tracking-[0.4em] text-white/70">ARCADE / SIDE VIEW</div>
        </div>

        <h1
          className="font-heading uppercase text-white leading-[0.85] tracking-tighter"
          style={{ fontSize: 'clamp(3rem, 11vw, 8rem)' }}
        >
          KICK<span style={{ color: '#00FF66' }}>HOOD</span>
        </h1>

        <p className="mt-5 max-w-lg text-white/70 text-base sm:text-lg font-body leading-relaxed">
          Fast-paced arcade football. Pick your fighter and take down your rival in 90 seconds. Break your records.
        </p>

        <div className="mt-6 max-w-3xl">
          <StatsCard stats={stats} />
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 items-start flex-wrap">
          <button
            type="button"
            data-testid="play-btn"
            className="btn-brutal flex items-center gap-3"
            onClick={handleStart}
          >
            <Play size={22} strokeWidth={3} />
            AI-PLAY
          </button>
          <button
            type="button"
            data-testid="profile-btn"
            className="btn-brutal flex items-center gap-3"
            style={{ borderColor: playerTeamName ? '#F4E04D' : '#00FF66', color: playerTeamName ? '#F4E04D' : '#00FF66', boxShadow: `4px 4px 0px ${playerTeamName ? '#F4E04D' : '#00FF66'}` }}
            onClick={handleProfile}
          >
            <User size={22} strokeWidth={2.5} />
            PROFILE
          </button>
          <button
            type="button"
            data-testid="boots-btn"
            className="btn-brutal flex items-center gap-3"
            style={{ borderColor: '#FF0055', color: '#FF0055', boxShadow: '4px 4px 0px #FF0055' }}
            onClick={handleBoots}
          >
            <ShoppingBag size={22} strokeWidth={2.5} />
            SHOP
          </button>
          <button
            type="button"
            data-testid="find-match-btn"
            className="btn-brutal flex items-center gap-3"
            style={{ borderColor: '#4CC9F0', color: '#4CC9F0', boxShadow: '4px 4px 0px #4CC9F0' }}
            onClick={() => { audio.menu(); onFindMatch && onFindMatch(); }}
          >
            <Wifi size={22} strokeWidth={2.5} />
            RANKED PLAY
          </button>
          <button
            type="button"
            data-testid="sound-toggle-btn"
            className="btn-brutal secondary flex items-center gap-3"
            onClick={() => { audio.menu(); onToggleSound(); }}
          >
            {soundOn ? <Volume2 size={22} strokeWidth={2.5} /> : <VolumeX size={22} strokeWidth={2.5} />}
            SOUND {soundOn ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="mt-12 flex items-center gap-4 text-white/40 text-xs tracking-[0.3em] uppercase font-heading">
          <div className="h-px w-16 bg-white/20" />
          <div>Powered by CANVAS ENGINE</div>
        </div>
      </div>
    </div>
  );
}
