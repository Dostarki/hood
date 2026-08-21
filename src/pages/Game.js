import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import GameCanvas from '@/components/GameCanvas';
import HUD from '@/components/HUD';
import MobileControls from '@/components/MobileControls';
import MainMenu from '@/components/MainMenu';
import EndScreen from '@/components/EndScreen';
import PauseOverlay from '@/components/PauseOverlay';
import ProfileScreen from '@/components/ProfileScreen';
import BootScreen from '@/components/BootScreen';
import InventoryScreen from '@/components/InventoryScreen';
import Matchmaking from '@/components/Matchmaking';
import RankedStake from '@/components/RankedStake';
import { useKeyboardInput } from '@/hooks/useInput';
import { useIsMobile } from '@/hooks/useMobile';
import { audio } from '@/game/audio';
import { getTeamById, randomOpponent } from '@/game/teams';
import { getBootById } from '@/game/boots';
import { loadStats, loadPref, savePref, recordMatch } from '@/game/storage';
import { net } from '@/game/net';

const STATE = {
  MENU: 'menu',
  PROFILE: 'profile',
  BOOTS: 'boots',
  INVENTORY: 'inventory',
  STAKE: 'stake',
  MATCHMAKING: 'matchmaking',
  PLAYING: 'playing',
  PAUSED: 'paused',
  ENDED: 'ended',
};

const MATCH_DURATION = 90;

export default function Game() {
  const [state, setState] = useState(STATE.MENU);
  const initialPref = loadPref();
  const [soundOn, setSoundOn] = useState(initialPref.soundOn !== false);
  const [playerTeam, setPlayerTeam] = useState(() => getTeamById(initialPref.teamId));
  const [aiTeam, setAiTeam] = useState(() => randomOpponent(initialPref.teamId));
  const [finalScore, setFinalScore] = useState({ scoreL: 0, scoreR: 0 });
  const hasEndedRef = useRef(false);
  const [gameKey, setGameKey] = useState(0);
  const [stats, setStats] = useState(() => loadStats());
  const [matchRecords, setMatchRecords] = useState(null);
  const [gameMode, setGameMode] = useState('ai'); // 'ai' | 'host' | 'guest'
  const [onlineInfo, setOnlineInfo] = useState(null); // { opponentName, opponentLeft }
  const [connMsg, setConnMsg] = useState(null); // reconnecting banner text
  const [rankedStake, setRankedStake] = useState(10); // selected ranked stake in USD
  const engineRef = useRef(null);
  const isMobile = useIsMobile();
  const { isConnected, address } = useAccount();

  const [bootId, setBootId] = useState(initialPref.bootId || 'boot_1');

  const recordGoals = useCallback((playerGoals) => {
    if (isConnected && address && playerGoals > 0) {
      fetch('/api/user/record-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, goalsScored: playerGoals })
      }).catch(err => console.error('Failed to record match goals', err));
    }
  }, [isConnected, address]);

  const handleEnd = useCallback((s) => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    setFinalScore(s);
    if (gameMode === 'ai') {
      const { stats: newStats, records } = recordMatch({
        teamId: playerTeam.id,
        playerScore: s.scoreL,
        cpuScore: s.scoreR,
      });
      setStats(newStats);
      setMatchRecords(records);
      recordGoals(s.scoreL);
    } else if (gameMode === 'host') {
      const { stats: newStats, records } = recordMatch({
        teamId: playerTeam.id,
        playerScore: s.scoreL,
        cpuScore: s.scoreR,
      });
      setStats(newStats);
      setMatchRecords(records);
      recordGoals(s.scoreL);
      net.sendMatchEnd({ scoreL: s.scoreL, scoreR: s.scoreR });
    } else if (gameMode === 'guest') {
      const { stats: newStats, records } = recordMatch({
        teamId: playerTeam.id,
        playerScore: s.scoreR,
        cpuScore: s.scoreL,
      });
      setStats(newStats);
      setMatchRecords(records);
      recordGoals(s.scoreR);
    }
    setState(STATE.ENDED);
  }, [playerTeam, gameMode, recordGoals]);

  useEffect(() => {
    audio.init();
    audio.setEnabled(soundOn);
    savePref({ teamId: playerTeam.id, soundOn, bootId });
  }, [soundOn, playerTeam, bootId]);

  useKeyboardInput(engineRef, state === STATE.PLAYING);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && (state === STATE.PLAYING || state === STATE.PAUSED)) {
        e.preventDefault();
        // In online mode, ESC leaves match (no pause)
        if (gameMode !== 'ai') return;
        setState(state === STATE.PLAYING ? STATE.PAUSED : STATE.PLAYING);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state, gameMode]);

  // Warn before accidental refresh/close during an online match
  useEffect(() => {
    if (gameMode === 'ai' || state !== STATE.PLAYING) return;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [gameMode, state]);

  // --- Online sync effects ---
  useEffect(() => {
    if (gameMode === 'ai' || state !== STATE.PLAYING) return;
    let running = true;

    const stateInterval = setInterval(() => {
      if (!running || !engineRef.current) return;
      if (gameMode === 'host') {
        net.sendState(engineRef.current.snapshotState());
      }
    }, 33); // ~30Hz

    const inputInterval = setInterval(() => {
      if (!running || !engineRef.current) return;
      if (gameMode === 'guest') {
        net.sendInput(engineRef.current.input);
      }
    }, 33); // ~30Hz

    const unsubs = [];
    unsubs.push(net.on('opponent_input', (msg) => {
      if (engineRef.current && gameMode === 'host' && msg.input) {
        engineRef.current.setRemoteInput(msg.input);
      }
    }));
    unsubs.push(net.on('state', (msg) => {
      if (engineRef.current && gameMode === 'guest' && msg.state) {
        engineRef.current.applyRemoteState(msg.state);
        // Guest checks match end via time reaching 0
        if (msg.state.t <= 0 && !engineRef.current.ended) {
          engineRef.current.ended = true;
          handleEnd({ scoreL: msg.state.sL, scoreR: msg.state.sR });
        }
      }
    }));
    unsubs.push(net.on('match_end', (msg) => {
      if (gameMode === 'guest' && engineRef.current && !engineRef.current.ended) {
        engineRef.current.ended = true;
        handleEnd({ scoreL: msg.scoreL, scoreR: msg.scoreR });
      }
    }));
    unsubs.push(net.on('opponent_left', () => {
      setOnlineInfo((info) => ({ ...(info || {}), opponentLeft: true }));
      if (engineRef.current && !engineRef.current.ended) {
        engineRef.current.ended = true;
        handleEnd({ scoreL: engineRef.current.scoreL, scoreR: engineRef.current.scoreR });
      }
    }));
    // Connection resilience: pause + banner during reconnect, resume seamlessly
    unsubs.push(net.on('reconnecting', () => setConnMsg('RECONNECTING…')));
    unsubs.push(net.on('resumed', () => setConnMsg(null)));
    unsubs.push(net.on('opponent_reconnecting', () => setConnMsg('OPPONENT RECONNECTING…')));
    unsubs.push(net.on('opponent_reconnected', () => setConnMsg(null)));
    unsubs.push(net.on('resume_failed', () => {
      setConnMsg(null);
      setOnlineInfo((info) => ({ ...(info || {}), opponentLeft: true }));
      if (engineRef.current) engineRef.current.ended = true;
      setFinalScore({ scoreL: engineRef.current?.scoreL || 0, scoreR: engineRef.current?.scoreR || 0 });
      setState(STATE.ENDED);
    }));

    return () => {
      running = false;
      clearInterval(stateInterval);
      clearInterval(inputInterval);
      unsubs.forEach((u) => u());
    };
  }, [gameMode, state, handleEnd]);

  const openProfile = useCallback(() => {
    audio.init();
    audio.resume();
    setState(STATE.PROFILE);
  }, []);

  const openStakeSelect = useCallback(() => {
    audio.init();
    audio.resume();
    setState(STATE.STAKE);
  }, []);

  const openMatchmaking = useCallback(() => {
    audio.init();
    audio.resume();
    setOnlineInfo(null);
    setState(STATE.MATCHMAKING);
  }, []);

  const openBoots = useCallback(() => {
    audio.init();
    audio.resume();
    setState(STATE.BOOTS);
  }, []);

  const openInventory = useCallback(() => {
    audio.init();
    audio.resume();
    setState(STATE.INVENTORY);
  }, []);

  const startAiMatch = useCallback(() => {
    audio.init();
    audio.resume();
    const aTeam = randomOpponent(playerTeam.id);
    setAiTeam(aTeam);
    setFinalScore({ scoreL: 0, scoreR: 0 });
    setMatchRecords(null);
    setGameMode('ai');
    setOnlineInfo(null);
    setConnMsg(null);
    hasEndedRef.current = false;
    setGameKey((k) => k + 1);
    setState(STATE.PLAYING);
  }, [playerTeam.id]);

  const saveProfile = useCallback((pTeam) => {
    setPlayerTeam(pTeam);
    savePref({ teamId: pTeam.id, soundOn, bootId });
    setState(STATE.MENU);
  }, [soundOn, bootId]);

  const saveBoots = useCallback((b) => {
    setBootId(b.id);
    savePref({ teamId: playerTeam.id, soundOn, bootId: b.id });
    setState(STATE.MENU);
  }, [soundOn, playerTeam]);

  const startOnlineMatch = useCallback(({ role, opponent, opponentTeam }) => {
    // In online: host is LEFT (playerTeam), guest is RIGHT (opponentTeam)
    let leftTeam, rightTeam;
    if (role === 'host') {
      leftTeam = { ...playerTeam, bootId };
      rightTeam = opponentTeam;
    } else {
      leftTeam = opponentTeam;
      rightTeam = { ...playerTeam, bootId };
    }
    setPlayerTeam(role === 'host' ? playerTeam : opponentTeam); // just for label defaults
    setAiTeam(role === 'host' ? opponentTeam : playerTeam);
    setFinalScore({ scoreL: 0, scoreR: 0 });
    setMatchRecords(null);
    setGameMode(role);
    setOnlineInfo({ opponentName: opponent?.name || 'Opponent', role, leftTeam, rightTeam });
    setConnMsg(null);
    hasEndedRef.current = false;
    setGameKey((k) => k + 1);
    setState(STATE.PLAYING);
  }, [playerTeam, bootId]);

  const handleScore = useCallback(() => {
    // Canvas GOOOL! effect handles visual
  }, []);

  const handleRematch = useCallback(() => {
    if (gameMode !== 'ai') {
      // Return to menu after online match
      try { net.leave(); } catch (_) { /* noop */ }
      setGameMode('ai');
      setOnlineInfo(null);
      setConnMsg(null);
      setState(STATE.MENU);
      return;
    }
    setFinalScore({ scoreL: 0, scoreR: 0 });
    setMatchRecords(null);
    hasEndedRef.current = false;
    setGameKey((k) => k + 1);
    setState(STATE.PLAYING);
  }, [gameMode]);

  const handleMenu = useCallback(() => {
    if (gameMode !== 'ai') {
      try { net.leave(); } catch (_) { /* noop */ }
    }
    setGameMode('ai');
    setOnlineInfo(null);
    setConnMsg(null);
    setState(STATE.MENU);
  }, [gameMode]);

  const cancelMatchmaking = useCallback(() => {
    try { net.cancel(); net.close(); } catch (_) { /* noop */ }
    setState(STATE.MENU);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundOn((v) => {
      const nv = !v;
      audio.setEnabled(nv);
      return nv;
    });
  }, []);

  const inGame = state === STATE.PLAYING || state === STATE.PAUSED;

  // Determine which teams render on left/right for online mode
  // Ensure we inject bootId for offline matches
  const renderLeftTeam = onlineInfo ? onlineInfo.leftTeam : { ...playerTeam, bootId };
  const renderRightTeam = onlineInfo ? onlineInfo.rightTeam : { ...aiTeam, bootId: 'boot_1' };

  // Player labels for HUD
  const hudLeftTeam = renderLeftTeam;
  const hudRightTeam = renderRightTeam;

  return (
    <div className="App" data-testid="app-root">
      {inGame && (
        <>
          <div className="canvas-wrap">
            <GameCanvas
              key={gameKey}
              engineRef={engineRef}
              onScore={handleScore}
              onEnd={handleEnd}
              matchDuration={MATCH_DURATION}
              running={state === STATE.PLAYING && !connMsg}
              playerTeam={renderLeftTeam}
              aiTeam={renderRightTeam}
              mode={gameMode}
            />
          </div>
          <HUD
            engineRef={engineRef}
            playerTeam={hudLeftTeam}
            aiTeam={hudRightTeam}
            onPause={() => {
              if (gameMode !== 'ai') return;
              setState(state === STATE.PLAYING ? STATE.PAUSED : STATE.PLAYING);
            }}
          />
          {isMobile && state === STATE.PLAYING && <MobileControls engineRef={engineRef} />}
          {connMsg && (
            <div
              className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 border border-[#F4E04D]/40 bg-black/80 px-4 py-2"
              data-testid="reconnect-banner"
            >
              <span className="w-2 h-2 rounded-full bg-[#F4E04D] animate-pulse" />
              <span className="font-heading tracking-[0.3em] text-[#F4E04D] text-sm">{connMsg}</span>
            </div>
          )}
          {state === STATE.PAUSED && (
            <PauseOverlay
              onResume={() => setState(STATE.PLAYING)}
              onMenu={handleMenu}
            />
          )}
        </>
      )}
      {state === STATE.MENU && (
        <MainMenu
          onStartAiMatch={startAiMatch}
          onOpenProfile={openProfile}
          onOpenBoots={openBoots}
          onOpenInventory={openInventory}
          onFindMatch={openStakeSelect}
          soundOn={soundOn}
          onToggleSound={toggleSound}
          stats={stats}
          playerTeamName={playerTeam.name}
        />
      )}
      {state === STATE.PROFILE && (
        <ProfileScreen
          initialPlayerId={playerTeam.id}
          onBack={() => setState(STATE.MENU)}
          onSave={saveProfile}
        />
      )}
      {state === STATE.BOOTS && (
        <BootScreen
          initialBootId={bootId}
          onBack={() => setState(STATE.MENU)}
          onSave={saveBoots}
        />
      )}
      {state === STATE.INVENTORY && (
        <InventoryScreen onBack={() => setState(STATE.MENU)} />
      )}
      {state === STATE.STAKE && (
        <RankedStake
          onBack={() => setState(STATE.MENU)}
          onSelect={(s) => { setRankedStake(s); openMatchmaking(); }}
        />
      )}
      {state === STATE.MATCHMAKING && (
        <Matchmaking
          playerTeam={playerTeam}
          playerName={playerTeam.name}
          stake={rankedStake}
          onCancel={cancelMatchmaking}
          onMatched={startOnlineMatch}
        />
      )}
      {state === STATE.ENDED && (
        <EndScreen
          scoreL={gameMode === 'guest' ? finalScore.scoreR : finalScore.scoreL}
          scoreR={gameMode === 'guest' ? finalScore.scoreL : finalScore.scoreR}
          onRematch={handleRematch}
          onMenu={handleMenu}
          stats={stats}
          records={matchRecords}
          opponentLeft={onlineInfo?.opponentLeft}
          onlineMode={gameMode !== 'ai'}
        />
      )}
    </div>
  );
}
