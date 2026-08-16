import { useEffect, useState } from 'react';
import { X, Loader2, Wifi } from 'lucide-react';
import { net } from '@/game/net';
import { TEAMS, getTeamById } from '@/game/teams';
import { audio } from '@/game/audio';

// Matchmaking screen: connects to WS, sends find_match, waits for match_start.
export default function Matchmaking({ playerTeam, playerName, onCancel, onMatched }) {
  const [status, setStatus] = useState('connecting'); // connecting | searching | error
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let unsubs = [];
    let cancelled = false;

    const start = async () => {
      try {
        await net.connect();
        if (cancelled) return;
        setStatus('searching');
        net.findMatch(playerName || playerTeam.name, playerTeam.id);
      } catch (e) {
        setStatus('error');
        setError('Could not connect. Check your connection.');
      }
    };

    unsubs.push(net.on('match_start', (msg) => {
      if (cancelled) return;
      const opponentTeam = getTeamById(msg.opponent?.teamId);
      onMatched({
        role: msg.role,
        roomId: msg.roomId,
        opponent: msg.opponent,
        opponentTeam,
      });
    }));
    unsubs.push(net.on('error', () => {
      if (cancelled) return;
      setStatus('error');
      setError('Connection error.');
    }));
    unsubs.push(net.on('close', () => {
      if (cancelled) return;
      setStatus('error');
      setError('Could not reach the server.');
    }));

    start();
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);

    return () => {
      cancelled = true;
      clearInterval(timer);
      unsubs.forEach((u) => u());
    };
  }, [playerTeam, playerName, onMatched]);

  const handleCancel = () => {
    audio.menuBack();
    try { net.cancel(); } catch (_) { /* noop */ }
    onCancel();
  };

  const TeamIcon = playerTeam.icon;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center" data-testid="matchmaking">
      <div className="menu-bg" />
      <div className="grid-noise" />

      <div className="relative z-10 w-full max-w-2xl px-6 sm:px-10 fade-in">
        <div className="flex items-center gap-3 mb-4">
          <Wifi size={16} strokeWidth={2.5} color="#00FF66" />
          <div className="font-heading text-sm tracking-[0.4em] text-white/70">RANKED MATCH</div>
        </div>

        <h2
          className="font-heading uppercase text-white leading-none tracking-tighter"
          style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)' }}
        >
          FINDING <span style={{ color: '#00FF66' }}>OPPONENT</span>
        </h2>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-6 border border-white/10 bg-black/60 backdrop-blur-md p-6">
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="font-heading text-white/50 tracking-[0.3em] text-xs">YOU</div>
            <div
              className="w-24 h-24 flex items-center justify-center border-2"
              style={{ borderColor: playerTeam.primary, background: `${playerTeam.primary}22` }}
            >
              <TeamIcon size={44} strokeWidth={2.5} color={playerTeam.primary} />
            </div>
            <div className="font-heading text-2xl tracking-widest" style={{ color: playerTeam.primary }}>
              {playerTeam.name}
            </div>
          </div>

          <div className="font-heading text-4xl text-white/40">VS</div>

          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="font-heading text-white/50 tracking-[0.3em] text-xs">OPPONENT</div>
            <div className="w-24 h-24 flex items-center justify-center border-2 border-dashed border-white/20">
              <Loader2 size={44} strokeWidth={2.5} className="animate-spin text-white/40" />
            </div>
            <div className="font-heading text-2xl tracking-widest text-white/40">???</div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-3 font-body text-white/70" data-testid="matchmaking-status">
            {status === 'connecting' && (
              <><Loader2 size={16} className="animate-spin" /><span>Connecting to server…</span></>
            )}
            {status === 'searching' && (
              <><Loader2 size={16} className="animate-spin text-[#00FF66]" /><span>Finding opponent · {elapsed}s</span></>
            )}
            {status === 'error' && (
              <span className="text-[#FF3B30]">{error}</span>
            )}
          </div>
          <button
            type="button"
            data-testid="matchmaking-cancel-btn"
            className="btn-brutal secondary flex items-center gap-2"
            onClick={handleCancel}
          >
            <X size={18} strokeWidth={2.5} /> CANCEL
          </button>
        </div>

        <div className="mt-8 text-white/50 text-sm font-body leading-relaxed max-w-lg">
          Wait until another player hits &quot;RANKED PLAY&quot;. When two players search at the same time, you are matched automatically.
        </div>
      </div>
    </div>
  );
}
