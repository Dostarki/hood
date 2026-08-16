import { Trophy, Target, Shield, TrendingUp, Flame } from 'lucide-react';

// Compact stats card shown on the main menu.
export default function StatsCard({ stats }) {
  if (!stats) return null;
  const winRate = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;

  const items = [
    { icon: Trophy, label: 'WINS', value: stats.wins, color: '#00FF66' },
    { icon: Target, label: 'BEST DIFF', value: stats.bestWinDiff > 0 ? `+${stats.bestWinDiff}` : '—', color: '#F4E04D' },
    { icon: Shield, label: 'CLEAN SHEETS', value: stats.cleanSheets, color: '#4CC9F0' },
    { icon: Flame, label: 'STREAK', value: stats.bestStreak, color: '#FF3B30' },
    { icon: TrendingUp, label: 'WIN RATE', value: `${winRate}%`, color: '#FFFFFF' },
  ];

  if (stats.played === 0) {
    return (
      <div
        data-testid="stats-card"
        className="border border-white/10 bg-black/40 backdrop-blur-md px-6 py-4 flex items-center gap-3"
      >
        <Trophy size={18} strokeWidth={2.5} color="#F4E04D" />
        <div className="font-heading tracking-widest text-white/80 text-sm">
          PLAY YOUR FIRST MATCH <span className="text-[#00FF66]">→</span>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="stats-card"
      className="border border-white/10 bg-black/50 backdrop-blur-md p-5 sm:p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="font-heading text-white/50 tracking-[0.3em] text-xs">STATS</div>
        <div className="font-heading text-white/80 text-sm tracking-widest">
          {stats.played} PLAYED · {stats.wins}W {stats.draws}D {stats.losses}L
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        {items.map((it) => (
          <div key={it.label} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <it.icon size={14} strokeWidth={2.5} color={it.color} />
              <div className="font-heading text-[10px] tracking-[0.2em] text-white/50">{it.label}</div>
            </div>
            <div className="font-heading text-3xl leading-none" style={{ color: it.color }}>
              {it.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
