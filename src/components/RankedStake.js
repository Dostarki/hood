import { useEffect, useState } from 'react';
import { ArrowLeft, Wifi, Wallet, Loader2 } from 'lucide-react';
import { ConnectButton, useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useConfig } from 'wagmi';
import { sendTransaction, waitForTransactionReceipt, switchChain, getAccount } from '@wagmi/core';
import { parseEther } from 'viem';
import { toast } from 'sonner';
import { robinhoodChain } from '@/lib/chain';
import { NFT_TREASURY_ADDRESS } from '@/game/boots';
import { audio } from '@/game/audio';

const STAKES = [1, 10, 50, 100];
const STAKE_COLORS = { 1: '#00FF66', 10: '#4CC9F0', 50: '#F4E04D', 100: '#FF0055' };

export default function RankedStake({ onBack, onSelect }) {
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const config = useConfig();
  const [ethPrice, setEthPrice] = useState(null);
  const [priceErr, setPriceErr] = useState(false);
  const [payingStake, setPayingStake] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchPrice = async () => {
      try {
        const res = await fetch('/api/eth-price');
        const data = await res.json();
        if (active && data?.usdPerEth) {
          setEthPrice(data.usdPerEth);
          setPriceErr(false);
        } else if (active) {
          setPriceErr(true);
        }
      } catch (_) {
        if (active) setPriceErr(true);
      }
    };
    fetchPrice();
    const id = setInterval(fetchPrice, 30000);
    return () => { active = false; clearInterval(id); };
  }, []);

  const ethFor = (usd) => {
    if (!ethPrice) return null;
    const eth = usd / ethPrice;
    return eth < 0.001 ? eth.toFixed(6) : eth.toFixed(5);
  };

  const handleStake = async (stake) => {
    if (payingStake) return;
    if (!isConnected || !address) {
      toast.error('Wallet Connection Required', { description: 'Connect your wallet to enter Ranked Play.' });
      if (openConnectModal) openConnectModal();
      return;
    }
    audio.menu();
    try {
      setPayingStake(stake);
      // Ensure we are on the Robinhood chain
      const acct = getAccount(config);
      if (acct.chainId !== robinhoodChain.id) {
        toast.message('Switching network…', { description: 'Approve the Robinhood network in your wallet.' });
        await switchChain(config, { chainId: robinhoodChain.id });
      }
      // Live price → ETH amount for the USD stake
      const pr = await fetch('/api/eth-price').then((r) => r.json());
      const rate = pr?.usdPerEth;
      if (!rate) throw new Error('Price feed unavailable');
      const ethAmount = (stake / rate).toFixed(18);

      toast.message('Confirm stake payment', { description: `Sending ~${ethAmount} ETH ($${stake} stake)` });
      const hash = await sendTransaction(config, {
        to: NFT_TREASURY_ADDRESS,
        value: parseEther(ethAmount),
        chainId: robinhoodChain.id,
      });
      toast.message('Transaction sent', { description: 'Waiting for confirmation…' });
      await waitForTransactionReceipt(config, { hash });

      // Log the ranked stake payment (best-effort)
      fetch('/api/ranked/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, stakeUsd: stake, txHash: hash }),
      }).catch(() => {});

      toast.success('Stake paid!', { description: 'Searching for an opponent…' });
      onSelect(stake);
    } catch (err) {
      const msg = err?.shortMessage || err?.message || 'Transaction failed';
      toast.error('Payment failed', { description: msg });
      setPayingStake(null);
    }
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
              You must connect your wallet before entering Ranked Play. The selected stake is transferred in Robinhood ETH, then matchmaking begins.
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
                const isPaying = payingStake === s;
                const disabled = payingStake !== null;
                return (
                  <button
                    type="button"
                    key={s}
                    data-testid={`stake-btn-${s}`}
                    disabled={disabled}
                    onClick={() => handleStake(s)}
                    className="flex flex-col items-center justify-center py-10 border-2 bg-black/50 backdrop-blur-md hover:bg-black/70 transition-colors disabled:opacity-50"
                    style={{ borderColor: c, boxShadow: `4px 4px 0px ${c}` }}
                  >
                    {isPaying ? (
                      <>
                        <Loader2 size={40} className="animate-spin" style={{ color: c }} />
                        <div className="font-heading text-white/70 text-xs mt-3 tracking-widest">PROCESSING…</div>
                      </>
                    ) : (
                      <>
                        <div className="font-heading text-5xl leading-none" style={{ color: c }}>${s}</div>
                        <div className="font-body text-white/60 text-sm mt-3" data-testid={`stake-eth-${s}`}>
                          {eth ? `≈ ${eth} ETH` : (priceErr ? '≈ — ETH' : 'Loading…')}
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="mt-8 text-white/50 text-sm font-body leading-relaxed max-w-lg">
              Seçtiğin bedel {NFT_TREASURY_ADDRESS.slice(0, 6)}…{NFT_TREASURY_ADDRESS.slice(-4)} cüzdanına Robinhood ETH olarak transfer edilir. Ödeme onaylandıktan sonra rakip aranmaya başlanır. Yalnızca aynı bedeli seçen oyuncularla eşleşirsin.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
