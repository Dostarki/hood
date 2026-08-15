import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { robinhoodChain } from '@/lib/chain';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

export const wagmiConfig = getDefaultConfig({
  appName: 'Neon Pitch Striker',
  projectId,
  chains: [robinhoodChain],
  transports: {
    [robinhoodChain.id]: http('https://rpc.mainnet.chain.robinhood.com'),
  },
  ssr: true,
});
