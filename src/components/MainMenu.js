import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Wifi, User, ShoppingBag, Trophy, Package } from 'lucide-react';
import { audio } from '@/game/audio';
import StatsCard from '@/components/StatsCard';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { toast } from "sonner";

export default function MainMenu({ onStartAiMatch, onOpenProfile, onOpenBoots, onOpenInventory, onFindMatch, soundOn, onToggleSound, stats, playerTeamName }) {
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    if (isConnected && address) {
      checkUserRegistration(address);
    } else {
      setShowNicknameModal(false);
    }
  }, [isConnected, address]);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  };

  const checkUserRegistration = async (walletAddress) => {
    try {
      const res = await fetch(`/api/user/${walletAddress}`);
      if (res.status === 404) {
        setShowNicknameModal(true);
      } else if (res.ok) {
        const data = await res.json();
        if (!data.nickname) {
          setShowNicknameModal(true);
        }
      }
    } catch (err) {
      console.error('Failed to check user:', err);
    }
  };

  const handleRegisterNickname = async () => {
    if (!nicknameInput.trim()) {
      toast.error('Please enter a nickname');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, nickname: nicknameInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Nickname saved successfully!');
        setShowNicknameModal(false);
        fetchLeaderboard();
      } else {
        toast.error(data.message || 'An error occurred');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error');
    }
    setIsSubmitting(false);
  };

  const requireWallet = (callback) => {
    if (!isConnected) {
      toast.error("Wallet Connection Required", {
        description: "Please connect your wallet to start the game."
      });
      if (openConnectModal) {
        openConnectModal();
      }
      return;
    }
    callback();
  };

  const handleStart = () => {
    audio.menu();
    requireWallet(onStartAiMatch);
  };

  const handleProfile = () => {
    audio.menu();
    onOpenProfile();
  };

  const handleBoots = () => {
    audio.menu();
    onOpenBoots();
  };

  const handleFindMatch = () => {
    audio.menu();
    if (onFindMatch) {
      requireWallet(onFindMatch);
    }
  };

  const LeaderboardPanel = ({ className }) => (
    <div className={`bg-black/80 border border-[#F4E04D]/40 p-4 backdrop-blur-md fade-in ${className}`}>
      <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
        <Trophy size={20} className="text-[#F4E04D]" />
        <h2 className="font-heading text-[#F4E04D] tracking-widest text-sm">TOP 10 GOAL KINGS</h2>
      </div>
      {leaderboard.length === 0 ? (
        <div className="text-white/50 text-xs font-body text-center py-4">No records yet</div>
      ) : (
        <ul className="space-y-2">
          {leaderboard.map((user, idx) => (
            <li key={idx} className="flex justify-between items-center text-sm font-body">
              <div className="flex items-center gap-2">
                <span className="text-white/40 w-4 text-right">{idx + 1}.</span>
                <span className="text-white font-bold">{user.nickname}</span>
              </div>
              <span className="text-[#00FF66] font-heading">{user.totalGoals} GOALS</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="absolute inset-0 z-40 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center py-12">
        <div className="menu-bg fixed inset-0" />
        <div className="grid-noise fixed inset-0" />

        <div className="relative z-10 w-full max-w-5xl px-6 sm:px-10 fade-in">
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
            NFT-SHOP
          </button>
          <button
            type="button"
            data-testid="inventory-btn"
            className="btn-brutal flex items-center gap-3"
            style={{ borderColor: '#B14BF4', color: '#B14BF4', boxShadow: '4px 4px 0px #B14BF4' }}
            onClick={() => { audio.menu(); onOpenInventory(); }}
          >
            <Package size={22} strokeWidth={2.5} />
            INVENTORY
          </button>
          <button
            type="button"
            data-testid="find-match-btn"
            className="btn-brutal flex items-center gap-3"
            style={{ borderColor: '#4CC9F0', color: '#4CC9F0', boxShadow: '4px 4px 0px #4CC9F0' }}
            onClick={handleFindMatch}
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

        {/* Mobile Leaderboard */}
        <LeaderboardPanel className="mt-12 lg:hidden w-full max-w-md mx-auto" />
      </div>

      {/* Desktop Leaderboard */}
      <LeaderboardPanel className="absolute top-24 right-8 w-80 hidden lg:block z-10" />

      {/* Nickname Modal */}
      {showNicknameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-[#00FF66] p-6 sm:p-8 max-w-md w-full">
            <h2 className="font-heading text-[#00FF66] text-2xl mb-2 uppercase">Register</h2>
            <p className="text-white/70 font-body text-sm mb-6">
              Set a nickname to start the game and enter the rankings. This process will only be done once.
            </p>
            <input
              type="text"
              className="w-full bg-black border border-white/20 text-white font-body p-3 mb-6 focus:outline-none focus:border-[#00FF66]"
              placeholder="Enter nickname..."
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              maxLength={20}
            />
            <button
              className="btn-brutal w-full flex justify-center"
              onClick={handleRegisterNickname}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'SAVING...' : 'SAVE AND START'}
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
