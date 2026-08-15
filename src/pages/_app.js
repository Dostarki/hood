import '@/styles/globals.css';
import '@/styles/App.css';
import '@rainbow-me/rainbowkit/styles.css';
import { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { Toaster } from "@/components/ui/sonner";
import { wagmiConfig } from '@/lib/wagmi';
import WalletButton from '@/components/WalletButton';

export default function App({ Component, pageProps }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#00FF66',
            accentColorForeground: '#0a0a0a',
            borderRadius: 'none',
            fontStack: 'system',
          })}
        >
          <WalletButton />
          <Component {...pageProps} />
          <Toaster />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
