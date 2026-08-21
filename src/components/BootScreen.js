import { useEffect, useRef, useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useConfig } from 'wagmi';
import { sendTransaction, waitForTransactionReceipt, switchChain, getAccount } from '@wagmi/core';
import { parseEther } from 'viem';
import { toast } from 'sonner';
import { BOOTS, getBootById, FREE_BOOT_ID, NFT_TREASURY_ADDRESS } from '@/game/boots';
import { robinhoodChain } from '@/lib/chain';
import { audio } from '@/game/audio';
import { ArrowLeft, ChevronLeft, ChevronRight, FastForward, Zap, Lock, Check, Loader2 } from 'lucide-react';

function BootCard({ boot, selected, owned }) {
  return (
    <div
      data-testid="player-boot-card"
      className="flex flex-col items-stretch bg-black/60 backdrop-blur-md"
      style={{
        border: selected ? `2px solid ${boot.color}` : '1px solid rgba(255,255,255,0.15)',
        boxShadow: selected ? `4px 4px 0px ${boot.color}` : 'none',
      }}
    >
      <div className="relative">
        <img
          src={boot.image}
          alt={boot.name}
          data-testid="boot-image"
          style={{ width: 220, height: 220, objectFit: 'cover', display: 'block' }}
        />
        {boot.isNft && (
          <div
            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 text-[10px] font-heading tracking-widest"
            style={{ background: owned ? '#00FF66' : 'rgba(0,0,0,0.75)', color: owned ? '#0A0D0B' : boot.color, border: `1px solid ${boot.color}` }}
          >
            {owned ? (<><Check size={12} /> OWNED</>) : (<><Lock size={12} /> ${boot.priceUsd}</>)}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: selected ? boot.color : 'rgba(255,255,255,0.03)' }}>
        <div className="font-heading text-xl tracking-widest text-center w-full" style={{ color: selected ? '#0A0D0B' : '#FFFFFF' }}>
          {boot.name}
        </div>
      </div>
      <div className="flex justify-between px-4 py-2 border-t border-white/10 bg-black/40">
        <div className="flex items-center gap-1">
          <FastForward size={14} color="#00FF66" />
          <span className="font-heading text-xs text-white/80 tracking-wider">SPD: +{boot.spdBonus}</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap size={14} color="#F4E04D" />
          <span className="font-heading text-xs text-white/80 tracking-wider">SHOT: +{boot.powBonus}</span>
        </div>
      </div>
    </div>
  );
}

export default function BootScreen({ initialBootId, onBack, onSave }) {
  const [bootId, setBootId] = useState(initialBootId || BOOTS[0].id);
  const [owned, setOwned] = useState([]);
  const [usdPerEth, setUsdPerEth] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const boot = getBootById(bootId);

  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const config = useConfig();

  const isOwned = useCallback(
    (b) => !b.isNft || b.priceUsd === 0 || b.id === FREE_BOOT_ID || owned.includes(b.id),
    [owned]
  );

  // Load owned NFT boots for the connected wallet.
  useEffect(() => {
    if (!address) { setOwned([]); return; }
    fetch(`/api/nft/owned/${address}`)
      .then((r) => r.json())
      .then((d) => setOwned(d.ownedBoots || []))
      .catch(() => {});
  }, [address]);

  // Load live ETH price for approximate display (refreshes periodically).
  useEffect(() => {
    let active = true;
    const load = () =>
      fetch('/api/eth-price')
        .then((r) => r.json())
        .then((d) => { if (active) setUsdPerEth(d.usdPerEth || null); })
        .catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => { active = false; clearInterval(id); };
  }, []);

  const approxEth = (priceUsd) => {
    if (!usdPerEth) return null;
    const eth = priceUsd / usdPerEth;
    return eth.toLocaleString('en-US', { maximumFractionDigits: 6 });
  };

  const cycleBoot = (dir) => {
    audio.menu();
    const idx = BOOTS.findIndex((b) => b.id === bootId);
    const next = (idx + dir + BOOTS.length) % BOOTS.length;
    setBootId(BOOTS[next].id);
  };

  const handleSave = () => {
    if (!isOwned(boot)) {
      handleBuy(boot);
      return;
    }
    audio.menu();
    onSave(boot);
  };

  const handleBuy = async (b) => {
    if (isOwned(b)) { audio.menu(); onSave(b); return; }
    if (!isConnected || !address) {
      toast.error('Wallet Connection Required', { description: 'Connect your wallet to buy this NFT boot.' });
      if (openConnectModal) openConnectModal();
      return;
    }
    try {
      setBusyId(b.id);
      // Ensure we are on Robinhood chain
      const acct = getAccount(config);
      if (acct.chainId !== robinhoodChain.id) {
        toast.message('Switching network…', { description: 'Approve the Robinhood network in your wallet.' });
        await switchChain(config, { chainId: robinhoodChain.id });
      }
      // Get live ETH price and compute the ETH amount for the USD price
      const pr = await fetch('/api/eth-price').then((r) => r.json());
      const rate = pr?.usdPerEth;
      if (!rate) throw new Error('Price feed unavailable');
      const ethAmount = (b.priceUsd / rate).toFixed(18);

      toast.message('Confirm payment', { description: `Sending ~${ethAmount} ETH for ${b.name}` });
      const hash = await sendTransaction(config, {
        to: NFT_TREASURY_ADDRESS,
        value: parseEther(ethAmount),
        chainId: robinhoodChain.id,
      });
      toast.message('Transaction sent', { description: 'Waiting for confirmation…' });
      await waitForTransactionReceipt(config, { hash });

      // Persist ownership
      const rec = await fetch('/api/nft/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, bootId: b.id, txHash: hash, priceUsd: b.priceUsd }),
      }).then((r) => r.json());

      setOwned(rec.ownedBoots || Array.from(new Set([...owned, b.id])));
      audio.menu();
      toast.success(`${b.name} unlocked!`, { description: 'Boot added to your wallet. Equip it now.' });
    } catch (err) {
      const msg = err?.shortMessage || err?.message || 'Transaction failed';
      toast.error('Purchase failed', { description: msg });
    } finally {
      setBusyId(null);
    }
  };

  const selectedOwned = isOwned(boot);
  const buying = busyId === boot.id;

  return (
    <div className="absolute inset-0 z-40 flex flex-col overflow-y-auto" data-testid="boot-screen">
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
          <div className="h-3 w-3" style={{ background: boot.color }} />
          <div className="font-heading text-sm tracking-[0.4em] text-white/70">NFT-SHOP</div>
        </div>
        <h2
          className="font-heading uppercase text-white leading-none tracking-tighter"
          style={{ fontSize: 'clamp(2.5rem, 8vw, 5.5rem)' }}
        >
          CHOOSE YOUR <span style={{ color: boot.color }}>BOOTS</span>
        </h2>
        <p className="font-heading text-white/60 tracking-widest mt-2">{boot.desc}</p>
        <p className="font-heading text-white/40 tracking-widest text-xs mt-1">
          Standard Black is free · NFT boots are paid in Robinhood ETH
        </p>

        {/* Selection preview */}
        <div className="mt-8 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-6">
            <button
              type="button"
              data-testid="boot-prev"
              className="w-14 h-14 flex items-center justify-center border border-white/20 bg-black/60 hover:bg-white/10 transition-colors"
              onClick={() => cycleBoot(-1)}
            >
              <ChevronLeft size={32} strokeWidth={2.5} />
            </button>
            <BootCard boot={boot} selected owned={selectedOwned} />
            <button
              type="button"
              data-testid="boot-next"
              className="w-14 h-14 flex items-center justify-center border border-white/20 bg-black/60 hover:bg-white/10 transition-colors"
              onClick={() => cycleBoot(1)}
            >
              <ChevronRight size={32} strokeWidth={2.5} />
            </button>
          </div>

          {/* Price / action line for the selected boot */}
          {boot.isNft && !selectedOwned && (
            <div className="mt-4 text-center" data-testid="selected-price">
              <div className="font-heading text-2xl tracking-widest" style={{ color: boot.color }}>
                ${boot.priceUsd} <span className="text-white/50 text-sm">Robinhood ETH</span>
              </div>
              {approxEth(boot.priceUsd) && (
                <div className="font-heading text-xs text-white/40 tracking-widest mt-1">≈ {approxEth(boot.priceUsd)} ETH</div>
              )}
            </div>
          )}
        </div>

        {/* Grid of all boots as quick-pick */}
        <div className="mt-12 max-w-5xl mx-auto">
          <div className="font-heading text-white/50 tracking-[0.3em] text-xs mb-3 text-center">QUICK SELECT</div>
          <div className="flex flex-wrap justify-center gap-4">
            {BOOTS.map((b) => {
              const isSelected = b.id === bootId;
              const ownedB = isOwned(b);
              return (
                <button
                  type="button"
                  key={b.id}
                  data-testid={`quick-boot-${b.id}`}
                  onClick={() => { audio.menu(); setBootId(b.id); }}
                  className="flex flex-col items-center gap-1 px-6 py-4 border transition-colors rounded-lg min-w-[130px] relative"
                  style={{
                    borderColor: isSelected ? b.color : 'rgba(255,255,255,0.15)',
                    background: isSelected ? `${b.color}22` : 'rgba(0,0,0,0.4)',
                  }}
                  title={b.name}
                >
                  <img src={b.image} alt={b.name} style={{ width: 72, height: 72, objectFit: 'cover' }} className="rounded" />
                  <div className="font-heading text-sm tracking-widest mt-1" style={{ color: isSelected ? b.color : '#ffffff90' }}>{b.name}</div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-[#00FF66]">S:{b.spdBonus}</span>
                    <span className="text-xs text-[#F4E04D]">P:{b.powBonus}</span>
                  </div>
                  <div className="mt-1 text-[10px] font-heading tracking-widest text-center">
                    {ownedB ? (
                      <span className="text-[#00FF66] flex items-center gap-1 justify-center">{b.isNft ? <Check size={10} /> : null}{b.isNft ? 'OWNED' : 'FREE'}</span>
                    ) : (
                      <div className="flex flex-col items-center leading-tight">
                        <span className="flex items-center gap-1" style={{ color: b.color }}><Lock size={10} /> ${b.priceUsd}</span>
                        <span className="text-white/45" data-testid={`eth-${b.id}`}>
                          {approxEth(b.priceUsd) ? `≈ ${approxEth(b.priceUsd)} ETH` : '…'}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          {selectedOwned ? (
            <button
              type="button"
              data-testid="boot-save-btn"
              className="btn-brutal flex items-center gap-3"
              onClick={handleSave}
            >
              EQUIP & SAVE
            </button>
          ) : (
            <button
              type="button"
              data-testid={`buy-boot-${boot.id}`}
              disabled={buying}
              className="btn-brutal flex items-center gap-3 disabled:opacity-60"
              style={{ borderColor: boot.color, color: boot.color, boxShadow: `4px 4px 0px ${boot.color}` }}
              onClick={() => handleBuy(boot)}
            >
              {buying ? (<><Loader2 size={20} className="animate-spin" /> PROCESSING…</>) : (<><Lock size={20} strokeWidth={2.5} /> BUY FOR ${boot.priceUsd}</>)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
