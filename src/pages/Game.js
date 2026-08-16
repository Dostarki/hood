import { useCallback, useEffect, useRef, useState } from 'react';
import GameCanvas from '@/components/GameCanvas';
import HUD from '@/components/HUD';
import MobileControls from '@/components/MobileControls';
import MainMenu from '@/components/MainMenu';
import EndScreen from '@/components/EndScreen';
import PauseOverlay from '@/components/PauseOverlay';
import ProfileScreen from '@/components/ProfileScreen';
import BootScreen from '@/components/BootScreen';
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
  const [gameKey, setGameKey] = useState(0);
  const [stats, setStats] = useState(() => loadStats());
  const [matchRecords, setMatchRecords] = useState(null);
  const [gameMode, setGameMode] = useState('ai'); // 'ai' | 'host' | 'guest'
  const [onlineInfo, setOnlineInfo] = useState(null); // { opponentName, opponentLeft }
  const [rankedStake, setRankedStake] = useState(10); // selected ranked stake in USD
  const engineRef = useRef(null);
  const isMobile = useIsMobile();

  const [bootId, setBootId] = useState(initialPref.bootId || 'boot_1');

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

  // --- Online sync effects ---
  useEffect(() => {
    if (gameMode === 'ai' || state !== STATE.PLAYING) return;
    let running = true;

    const stateInterval = setInterval(() => {
      if (!running || !engineRef.current) return;
      if (gameMode === 'host') {
        net.sendState(engineRef.current.snapshotState());
      }
    }, 50); // 20Hz

    const inputInterval = setInterval(() => {
      if (!running || !engineRef.current) return;
      if (gameMode === 'guest') {
        net.sendInput(engineRef.current.input);
      }
    }, 40); // 25Hz

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
          setFinalScore({ scoreL: msg.state.sL, scoreR: msg.state.sR });
          setState(STATE.ENDED);
        }
      }
    }));
    unsubs.push(net.on('match_end', (msg) => {
      if (gameMode === 'guest') {
        setFinalScore({ scoreL: msg.scoreL, scoreR: msg.scoreR });
        setState(STATE.ENDED);
      }
    }));
    unsubs.push(net.on('opponent_left', () => {
      setOnlineInfo((info) => ({ ...(info || {}), opponentLeft: true }));
      if (engineRef.current) {
        engineRef.current.ended = true;
      }
      setFinalScore({ scoreL: engineRef.current?.scoreL || 0, scoreR: engineRef.current?.scoreR || 0 });
      setState(STATE.ENDED);
    }));

    return () => {
      running = false;
      clearInterval(stateInterval);
      clearInterval(inputInterval);
      unsubs.forEach((u) => u());
    };
  }, [gameMode, state]);

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

  const startAiMatch = useCallback(() => {
    audio.init();
    audio.resume();
    const aTeam = randomOpponent(playerTeam.id);
    setAiTeam(aTeam);
    setFinalScore({ scoreL: 0, scoreR: 0 });
    setMatchRecords(null);
    setGameMode('ai');
    setOnlineInfo(null);
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
    setGameKey((k) => k + 1);
    setState(STATE.PLAYING);
  }, [playerTeam, bootId]);

  const handleScore = useCallback(() => {
    // Canvas GOOOL! effect handles visual
  }, []);

  const handleEnd = useCallback((s) => {
    setFinalScore(s);
    if (gameMode === 'ai') {
      const { stats: newStats, records } = recordMatch({
        teamId: playerTeam.id,
        playerScore: s.scoreL,
        cpuScore: s.scoreR,
      });
      setStats(newStats);
      setMatchRecords(records);
    } else if (gameMode === 'host') {
      // Also record for host — leftScore is host's own score
      const { stats: newStats, records } = recordMatch({
        teamId: playerTeam.id,
        playerScore: s.scoreL,
        cpuScore: s.scoreR,
      });
      setStats(newStats);
      setMatchRecords(records);
      net.sendMatchEnd({ scoreL: s.scoreL, scoreR: s.scoreR });
    } else if (gameMode === 'guest') {
      // Guest: their score is on the right (they are the right player)
      const { stats: newStats, records } = recordMatch({
        teamId: playerTeam.id,
        playerScore: s.scoreR,
        cpuScore: s.scoreL,
      });
      setStats(newStats);
      setMatchRecords(records);
    }
    setState(STATE.ENDED);
  }, [playerTeam, gameMode]);

  const handleRematch = useCallback(() => {
    if (gameMode !== 'ai') {
      // Return to menu after online match
      try { net.leave(); } catch (_) { /* noop */ }
      setGameMode('ai');
      setOnlineInfo(null);
      setState(STATE.MENU);
      return;
    }
    setFinalScore({ scoreL: 0, scoreR: 0 });
    setMatchRecords(null);
    setGameKey((k) => k + 1);
    setState(STATE.PLAYING);
  }, [gameMode]);

  const handleMenu = useCallback(() => {
    if (gameMode !== 'ai') {
      try { net.leave(); } catch (_) { /* noop */ }
    }
    setGameMode('ai');
    setOnlineInfo(null);
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
              running={state === STATE.PLAYING}
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
