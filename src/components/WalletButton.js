import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function WalletButton() {
  return (
    <div
      className="fixed top-4 right-4 z-[60]"
      data-testid="wallet-connect-container"
    >
      <ConnectButton
        label="Connect Wallet"
        showBalance={true}
        chainStatus="icon"
        accountStatus="address"
      />
    </div>
  );
}
