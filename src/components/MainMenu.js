import { Volume2, VolumeX, Play, Settings as SettingsIcon, Wifi, User, Footprints } from 'lucide-react';
import { useState } from 'react';
import { audio } from '@/game/audio';
import StatsCard from '@/components/StatsCard';

export default function MainMenu({ onStartAiMatch, onOpenProfile, onOpenBoots, onFindMatch, soundOn, onToggleSound, stats, playerTeamName }) {
  const [showSettings, setShowSettings] = useState(false);

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
          NEON <span style={{ color: '#00FF66' }}>PITCH</span>
          <br />
          <span className="text-white/50">STRIKER</span>
        </h1>

        <p className="mt-5 max-w-lg text-white/70 text-base sm:text-lg font-body leading-relaxed">
          Hızlı arcade futbol. Takımını seç, 90 saniyede rakibi devir. Rekorlarını kır.
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
            OYNA
          </button>
          <button
            type="button"
            data-testid="profile-btn"
            className="btn-brutal flex items-center gap-3"
            style={{ borderColor: playerTeamName ? '#F4E04D' : '#00FF66', color: playerTeamName ? '#F4E04D' : '#00FF66', boxShadow: `4px 4px 0px ${playerTeamName ? '#F4E04D' : '#00FF66'}` }}
            onClick={handleProfile}
          >
            <User size={22} strokeWidth={2.5} />
            PROFİL
          </button>
          <button
            type="button"
            data-testid="boots-btn"
            className="btn-brutal flex items-center gap-3"
            style={{ borderColor: '#FF0055', color: '#FF0055', boxShadow: '4px 4px 0px #FF0055' }}
            onClick={handleBoots}
          >
            <Footprints size={22} strokeWidth={2.5} />
            KRAMPON
          </button>
          <button
            type="button"
            data-testid="find-match-btn"
            className="btn-brutal flex items-center gap-3"
            style={{ borderColor: '#4CC9F0', color: '#4CC9F0', boxShadow: '4px 4px 0px #4CC9F0' }}
            onClick={() => { audio.menu(); onFindMatch && onFindMatch(); }}
          >
            <Wifi size={22} strokeWidth={2.5} />
            MAÇ BUL
          </button>
          <button
            type="button"
            data-testid="settings-btn"
            className="btn-brutal secondary flex items-center gap-3"
            onClick={() => { audio.menu(); setShowSettings(!showSettings); }}
          >
            <SettingsIcon size={22} strokeWidth={2.5} />
            AYARLAR
          </button>
          <button
            type="button"
            data-testid="sound-toggle-btn"
            className="btn-brutal secondary flex items-center gap-3"
            onClick={() => { audio.menu(); onToggleSound(); }}
          >
            {soundOn ? <Volume2 size={22} strokeWidth={2.5} /> : <VolumeX size={22} strokeWidth={2.5} />}
            SES {soundOn ? 'AÇIK' : 'KAPALI'}
          </button>
        </div>

        {showSettings && (
          <div className="mt-8 max-w-xl border border-white/10 bg-black/60 backdrop-blur-md p-6 fade-in" data-testid="settings-panel">
            <div className="font-heading text-2xl tracking-widest text-white mb-4">AYARLAR</div>
            <div className="divider mb-4" />
            <SettingRow label="MAÇ SÜRESİ" value="90 SANİYE" />
            <SettingRow label="AI ZORLUĞU" value="ORTA" />
            <SettingRow label="SES EFEKTLERİ" value={soundOn ? 'AÇIK' : 'KAPALI'} />
            <SettingRow label="TAKIM" value={playerTeamName || '—'} />
            <div className="divider my-4" />
            <div className="text-white/60 text-sm font-body leading-relaxed">
              <div className="font-heading text-white text-lg tracking-widest mb-2">KONTROLLER</div>
              <div>Sol / Sağ  &rarr;  <span className="text-white">A / D veya OKLAR</span></div>
              <div>Zıplama  &rarr;  <span className="text-white">W veya YUKARI OK</span></div>
              <div>Şut  &rarr;  <span className="text-white">SPACE</span></div>
              <div className="mt-2 text-[#00FF66]">Mobilde ekrandaki tuşları kullan.</div>
            </div>
          </div>
        )}

        <div className="mt-12 flex items-center gap-4 text-white/40 text-xs tracking-[0.3em] uppercase font-heading">
          <div className="h-px w-16 bg-white/20" />
          <div>Powered by CANVAS ENGINE</div>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 font-body">
      <div className="text-white/60 tracking-widest text-sm uppercase">{label}</div>
      <div className="text-[#00FF66] font-heading tracking-widest text-lg">{value}</div>
    </div>
  );
}
