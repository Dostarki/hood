import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { toast } from 'sonner';
import { ArrowLeft, Package, Wallet, Tag, FastForward, Zap } from 'lucide-react';
import { BOOTS } from '@/game/boots';
import { audio } from '@/game/audio';

export default function InventoryScreen({ onBack }) {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [owned, setOwned] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) { setOwned([]); return; }
    setLoading(true);
    fetch(`/api/nft/owned/${address}`)
      .then((r) => r.json())
      .then((d) => setOwned(d.ownedBoots || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [address]);

  const ownedBoots = BOOTS.filter((b) => b.isNft && owned.includes(b.id));

  const handleSell = () => {
    audio.menu();
    toast.message('SELL — Yakında Aktif', {
      description: 'NFT krampon satışı çok yakında açılacak.',
    });
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col overflow-y-auto" data-testid="inventory-screen">
      <div className="menu-bg" />
      <div className="grid-noise" />

      <div className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-6 sm:px-10 py-8 sm:py-12 fade-in">
        <button
          type="button"
          data-testid="back-btn"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors font-heading tracking-widest text-sm mb-8"
          onClick={() => { audio.menuBack(); onBack(); }}
        >
          <ArrowLeft size={16} strokeWidth={2.5} /> BACK
        </button>

        <div className="flex items-center gap-3 mb-4">
          <Package size={16} strokeWidth={2.5} color="#B14BF4" />
          <div className="font-heading text-sm tracking-[0.4em] text-white/70">ENVANTER</div>
        </div>
        <h2
          className="font-heading uppercase text-white leading-none tracking-tighter"
          style={{ fontSize: 'clamp(2.5rem, 8vw, 5.5rem)' }}
        >
          YOUR <span style={{ color: '#B14BF4' }}>NFTs</span>
        </h2>
        <p className="font-heading text-white/50 tracking-widest mt-2 text-sm">
          Sahip olduğun NFT kramponlar
        </p>

        {!isConnected ? (
          <div
            className="mt-10 max-w-xl border border-white/10 bg-black/60 backdrop-blur-md p-8 flex flex-col items-start gap-5"
            data-testid="inventory-connect-prompt"
          >
            <div className="flex items-center gap-3 text-white">
              <Wallet size={24} strokeWidth={2.5} color="#B14BF4" />
              <div className="font-heading text-2xl tracking-widest">CONNECT WALLET</div>
            </div>
            <p className="text-white/70 font-body leading-relaxed">
              Envanterini görmek için cüzdanını bağla.
            </p>
            <button
              type="button"
              data-testid="inventory-connect-btn"
              className="btn-brutal"
              style={{ borderColor: '#B14BF4', color: '#B14BF4', boxShadow: '4px 4px 0px #B14BF4' }}
              onClick={() => openConnectModal && openConnectModal()}
            >
              CONNECT WALLET
            </button>
          </div>
        ) : loading ? (
          <p className="mt-10 font-heading text-white/60 tracking-widest">LOADING…</p>
        ) : ownedBoots.length === 0 ? (
          <div className="mt-10 max-w-xl border border-white/10 bg-black/60 backdrop-blur-md p-8" data-testid="inventory-empty">
            <div className="font-heading text-2xl tracking-widest text-white/80">HENÜZ NFT YOK</div>
            <p className="text-white/60 font-body mt-3 leading-relaxed">
              NFT-SHOP'tan bir krampon satın aldığında burada görünecek.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="inventory-grid">
            {ownedBoots.map((b) => (
              <div
                key={b.id}
                data-testid={`inventory-item-${b.id}`}
                className="flex flex-col bg-black/60 backdrop-blur-md overflow-hidden"
                style={{ border: `1px solid ${b.color}55`, boxShadow: `4px 4px 0px ${b.color}` }}
              >
                <img src={b.image} alt={b.name} style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover' }} />
                <div className="px-4 py-3" style={{ background: `${b.color}` }}>
                  <div className="font-heading text-xl tracking-widest" style={{ color: '#0A0D0B' }}>{b.name}</div>
                </div>
                <div className="flex justify-between px-4 py-2 border-t border-white/10 bg-black/40">
                  <div className="flex items-center gap-1">
                    <FastForward size={14} color="#00FF66" />
                    <span className="font-heading text-xs text-white/80 tracking-wider">SPD: +{b.spdBonus}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap size={14} color="#F4E04D" />
                    <span className="font-heading text-xs text-white/80 tracking-wider">SHOT: +{b.powBonus}</span>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center justify-between border-t border-white/10">
                  <div className="font-heading text-sm tracking-widest text-white/50">${b.priceUsd}</div>
                  <button
                    type="button"
                    data-testid={`sell-btn-${b.id}`}
                    onClick={handleSell}
                    className="relative flex items-center gap-2 px-4 py-2 border font-heading text-xs tracking-widest text-white/60 hover:text-white transition-colors"
                    style={{ borderColor: 'rgba(255,255,255,0.25)' }}
                  >
                    <Tag size={14} /> SELL
                    <span
                      className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[8px] font-heading tracking-widest"
                      style={{ background: '#F4E04D', color: '#0A0D0B' }}
                    >
                      SOON
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
