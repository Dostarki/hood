import { useEffect, useState } from 'react';
import { ArrowLeft, Wifi, Wallet } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { audio } from '@/game/audio';

const STAKES = [1, 10, 50, 100];
const STAKE_COLORS = { 1: '#00FF66', 10: '#4CC9F0', 50: '#F4E04D', 100: '#FF0055' };

export default function RankedStake({ onBack, onSelect }) {
  const { isConnected } = useAccount();
  const [ethPrice, setEthPrice] = useState(null);
  const [priceErr, setPriceErr] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchPrice = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await res.json();
        if (active && data?.ethereum?.usd) {
          setEthPrice(data.ethereum.usd);
          setPriceErr(false);
        }
      } catch (_) {
        if (active) setPriceErr(true);
      }
    };
    fetchPrice();
    const id = setInterval(fetchPrice, 60000);
    return () => { active = false; clearInterval(id); };
  }, []);

  const ethFor = (usd) => {
    if (!ethPrice) return null;
    const eth = usd / ethPrice;
    return eth < 0.001 ? eth.toFixed(6) : eth.toFixed(5);
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col overflow-y-auto" data-testid="ranked-stake-screen">
      <div className="menu-bg" />
      <div className="grid-noise" />

      <div className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-6 sm:px-10 py-8 sm:py-12 fade-in">
        <button
          type="button"
          data-testid="back-btn"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors font-heading tracking-widest text-sm mb-8"
          onClick={() => { audio.menuBack(); onBack(); }}
        >
          <ArrowLeft size={16} strokeWidth={2.5} /> BACK
        </button>

        <div className="flex items-center gap-3 mb-4">
          <Wifi size={16} strokeWidth={2.5} color="#4CC9F0" />
          <div className="font-heading text-sm tracking-[0.4em] text-white/70">RANKED PLAY</div>
        </div>
        <h2
          className="font-heading uppercase text-white leading-none tracking-tighter"
          style={{ fontSize: 'clamp(2.5rem, 8vw, 5.5rem)' }}
        >
          SELECT YOUR <span style={{ color: '#4CC9F0' }}>STAKE</span>
        </h2>

        {!isConnected ? (
          <div
            className="mt-10 max-w-xl border border-white/10 bg-black/60 backdrop-blur-md p-8 flex flex-col items-start gap-5"
            data-testid="ranked-connect-prompt"
          >
            <div className="flex items-center gap-3 text-white">
              <Wallet size={24} strokeWidth={2.5} color="#00FF66" />
              <div className="font-heading text-2xl tracking-widest">CONNECT WALLET</div>
            </div>
            <p className="text-white/70 font-body leading-relaxed">
              You must connect your wallet before entering Ranked Play. No transfer is made — it is only required to enter.
            </p>
            <ConnectButton label="Connect Wallet" showBalance={false} chainStatus="none" accountStatus="address" />
          </div>
        ) : (
          <>
            <p className="mt-4 font-heading text-white/60 tracking-widest text-sm" data-testid="eth-price-line">
              {priceErr
                ? 'LIVE ETH PRICE UNAVAILABLE'
                : ethPrice
                  ? `1 ETH ≈ $${ethPrice.toLocaleString()}`
                  : 'LOADING ETH PRICE…'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              {STAKES.map((s) => {
                const c = STAKE_COLORS[s];
                const eth = ethFor(s);
                return (
                  <button
                    type="button"
                    key={s}
                    data-testid={`stake-btn-${s}`}
                    onClick={() => { audio.menu(); onSelect(s); }}
                    className="flex flex-col items-center justify-center py-10 border-2 bg-black/50 backdrop-blur-md hover:bg-black/70 transition-colors"
                    style={{ borderColor: c, boxShadow: `4px 4px 0px ${c}` }}
                  >
                    <div className="font-heading text-5xl leading-none" style={{ color: c }}>${s}</div>
                    <div className="font-body text-white/60 text-sm mt-3" data-testid={`stake-eth-${s}`}>
                      {eth ? `≈ ${eth} ETH` : (priceErr ? '≈ — ETH' : 'Loading…')}
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="mt-8 text-white/50 text-sm font-body leading-relaxed max-w-lg">
              You will only be matched with players who chose the same stake. If no one is available yet, you wait in queue until an equal-stake opponent appears.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
