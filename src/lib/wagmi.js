import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { robinhoodChain } from '@/lib/chain';

// Keep build-time SSR from crashing when an external WalletConnect Cloud ID
// is not provided yet. Replace this with a real Cloud project id for production.
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  'kickhood-walletconnect-build-id';

export const wagmiConfig = getDefaultConfig({
  appName: 'KickHood',
  projectId,
  chains: [robinhoodChain],
  transports: {
    [robinhoodChain.id]: http('https://rpc.mainnet.chain.robinhood.com'),
  },
  ssr: true,
});
