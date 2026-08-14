// LocalStorage-backed stats and preferences

const STATS_KEY = 'neonpitch_stats_v1';
const PREF_KEY = 'neonpitch_pref_v1';

const DEFAULT_STATS = {
  played: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  bestWinDiff: 0,
  mostGoalsInMatch: 0,
  cleanSheets: 0,       // matches with 0 goals conceded
  currentStreak: 0,     // positive = wins, negative = losses
  bestStreak: 0,
  history: [],          // last 10 matches
};

const DEFAULT_PREF = {
  teamId: 'ape',
  bootId: 'boot_1',
  soundOn: true,
};

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { ...fallback };
    const parsed = JSON.parse(raw);
    return { ...fallback, ...parsed };
  } catch {
    return { ...fallback };
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export const loadStats = () => safeGet(STATS_KEY, DEFAULT_STATS);
export const saveStats = (s) => safeSet(STATS_KEY, s);
export const resetStats = () => safeSet(STATS_KEY, { ...DEFAULT_STATS });

export const loadPref = () => safeGet(PREF_KEY, DEFAULT_PREF);
export const savePref = (p) => safeSet(PREF_KEY, p);

/**
 * Record a completed match.
 * Returns { stats, records: { newRecord, ... } } for celebration.
 */
export function recordMatch({ teamId, playerScore, cpuScore }) {
  const prev = loadStats();
  const diff = playerScore - cpuScore;
  const result = diff > 0 ? 'win' : diff < 0 ? 'loss' : 'draw';

  const records = {
    newBestWinDiff: false,
    newMostGoals: false,
    newBestStreak: false,
    firstWin: false,
  };

  const next = { ...prev };
  next.played = prev.played + 1;
  next.wins = prev.wins + (result === 'win' ? 1 : 0);
  next.losses = prev.losses + (result === 'loss' ? 1 : 0);
  next.draws = prev.draws + (result === 'draw' ? 1 : 0);
  next.goalsFor = prev.goalsFor + playerScore;
  next.goalsAgainst = prev.goalsAgainst + cpuScore;
  if (cpuScore === 0 && result !== 'loss') next.cleanSheets = prev.cleanSheets + 1;

  if (result === 'win' && diff > prev.bestWinDiff) {
    next.bestWinDiff = diff;
    records.newBestWinDiff = true;
  }
  if (playerScore > prev.mostGoalsInMatch) {
    next.mostGoalsInMatch = playerScore;
    records.newMostGoals = true;
  }
  if (result === 'win' && prev.wins === 0) records.firstWin = true;

  // Streak
  if (result === 'win') {
    next.currentStreak = prev.currentStreak >= 0 ? prev.currentStreak + 1 : 1;
  } else if (result === 'loss') {
    next.currentStreak = prev.currentStreak <= 0 ? prev.currentStreak - 1 : -1;
  } else {
    next.currentStreak = 0;
  }
  if (next.currentStreak > prev.bestStreak) {
    next.bestStreak = next.currentStreak;
    if (next.currentStreak >= 2) records.newBestStreak = true;
  }

  // History (last 10)
  next.history = [
    { date: Date.now(), teamId, playerScore, cpuScore, result },
    ...prev.history,
  ].slice(0, 10);

  saveStats(next);
  return { stats: next, records };
}
