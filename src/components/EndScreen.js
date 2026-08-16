import { RotateCcw, Home, Trophy, Sparkles } from 'lucide-react';

export default function EndScreen({ scoreL, scoreR, onRematch, onMenu, stats, records, opponentLeft, onlineMode }) {
  let title = 'DRAW';
  let color = '#FFFFFF';
  if (scoreL > scoreR) { title = 'YOU WIN'; color = '#00FF66'; }
  else if (scoreR > scoreL) { title = 'YOU LOSE'; color = '#FF3B30'; }
  if (opponentLeft) { title = 'OPPONENT LEFT'; color = '#F4E04D'; }

  const anyRecord = records && (records.newBestWinDiff || records.newMostGoals || records.newBestStreak || records.firstWin);

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto"
      style={{ background: 'rgba(10, 13, 11, 0.92)', backdropFilter: 'blur(14px)' }}
      data-testid="end-screen"
    >
      <div className="grid-noise" />
      <div className="relative w-full max-w-3xl px-8 py-8 fade-in">
        <div className="font-heading text-white/60 tracking-[0.4em] text-sm mb-2">MATCH OVER</div>
        <h2
          className="font-heading uppercase leading-none tracking-tighter"
          style={{ color, fontSize: 'clamp(3rem, 10vw, 7rem)' }}
          data-testid="end-title"
        >
          {title}
        </h2>

        <div className="mt-8 flex items-center gap-6 border border-white/10 bg-black/50 backdrop-blur-md p-6">
          <div className="flex-1 text-center">
            <div className="font-heading text-white/60 text-sm tracking-widest">YOU</div>
            <div className="font-heading text-white text-7xl leading-none" data-testid="final-score-left">{scoreL}</div>
          </div>
          <div className="text-white/40 font-heading text-4xl">-</div>
          <div className="flex-1 text-center">
            <div className="font-heading text-white/60 text-sm tracking-widest">CPU</div>
            <div className="font-heading text-white text-7xl leading-none" data-testid="final-score-right">{scoreR}</div>
          </div>
        </div>

        {anyRecord && (
          <div
            className="mt-6 border p-4 fade-in"
            style={{ borderColor: '#F4E04D', background: 'rgba(244, 224, 77, 0.08)' }}
            data-testid="new-record"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} strokeWidth={2.5} color="#F4E04D" />
              <div className="font-heading tracking-[0.3em] text-sm" style={{ color: '#F4E04D' }}>NEW RECORD!</div>
            </div>
            <ul className="text-white/80 font-body text-sm space-y-1">
              {records.firstWin && <li>· YOUR FIRST WIN — Congrats!</li>}
              {records.newBestWinDiff && <li>· Biggest win margin: +{stats?.bestWinDiff}</li>}
              {records.newMostGoals && <li>· Most goals in a match: {stats?.mostGoalsInMatch}</li>}
              {records.newBestStreak && <li>· Longest win streak: {stats?.bestStreak} matches</li>}
            </ul>
          </div>
        )}

        {stats && stats.played > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border border-white/10 bg-black/40 backdrop-blur-md p-4" data-testid="stats-summary">
            <StatItem icon={Trophy} label="WINS" value={stats.wins} color="#00FF66" />
            <StatItem label="DRAWS" value={stats.draws} color="#FFFFFF" />
            <StatItem label="PLAYED" value={stats.played} color="#FFFFFF" />
            <StatItem label="BEST STREAK" value={stats.bestStreak} color="#F4E04D" />
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          {!onlineMode && (
            <button
              type="button"
              data-testid="rematch-btn"
              className="btn-brutal flex items-center gap-3"
              onClick={onRematch}
            >
              <RotateCcw size={20} strokeWidth={3} />
              PLAY AGAIN
            </button>
          )}
          <button
            type="button"
            data-testid="menu-btn"
            className={`btn-brutal ${onlineMode ? '' : 'secondary'} flex items-center gap-3`}
            onClick={onMenu}
          >
            <Home size={20} strokeWidth={2.5} />
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon: Icon, label, value, color }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon size={12} strokeWidth={2.5} color={color} />}
        <div className="font-heading text-[10px] tracking-[0.2em] text-white/50">{label}</div>
      </div>
      <div className="font-heading text-2xl leading-none mt-1" style={{ color }}>{value}</div>
    </div>
  );
}
