export const BOOTS = [
  {
    id: 'boot_1',
    name: 'STANDARD BLACK',
    color: '#222222',
    secondary: '#111111',
    spdBonus: 0,
    powBonus: 0,
    priceUsd: 0,
    isNft: false,
    desc: 'Free for everyone · Basic Starter Boots'
  },
  {
    id: 'boot_2',
    name: 'FLAME NFT',
    color: '#FF8C00',
    secondary: '#FFA500',
    spdBonus: 5,
    powBonus: 1,
    priceUsd: 1,
    isNft: true,
    desc: '+5 Speed, +1 Shot'
  },
  {
    id: 'boot_3',
    name: 'STORM NFT',
    color: '#DC143C',
    secondary: '#FF0000',
    spdBonus: 7,
    powBonus: 2,
    priceUsd: 3,
    isNft: true,
    desc: '+7 Speed, +2 Shot'
  },
  {
    id: 'boot_4',
    name: 'LIGHTNING NFT',
    color: '#0000FF',
    secondary: '#00BFFF',
    spdBonus: 10,
    powBonus: 5,
    priceUsd: 10,
    isNft: true,
    desc: '+10 Speed, +5 Shot'
  },
  {
    id: 'boot_5',
    name: 'TITANIUM NFT',
    color: '#808080',
    secondary: '#D3D3D3',
    effect: 'reflection',
    spdBonus: 15,
    powBonus: 10,
    priceUsd: 15,
    isNft: true,
    desc: '+15 Speed, +10 Shot'
  },
  {
    id: 'boot_6',
    name: 'GALAXY NFT',
    color: '#2B00FF',
    secondary: '#FF00FF',
    effect: 'galaxy',
    spdBonus: 20,
    powBonus: 15,
    priceUsd: 30,
    isNft: true,
    desc: '+20 Speed, +15 Shot'
  },
  {
    id: 'boot_7',
    name: 'GOLDEN NFT',
    color: '#FFD700',
    secondary: '#FFA500',
    effect: 'reflection',
    spdBonus: 30,
    powBonus: 25,
    priceUsd: 50,
    isNft: true,
    desc: '+30 Speed, +25 Shot'
  }
];

export function getBootById(id) {
  return BOOTS.find(b => b.id === id) || BOOTS[0];
}

// The free boot everyone owns by default.
export const FREE_BOOT_ID = 'boot_1';

// Wallet that receives NFT boot payments (Robinhood chain, native ETH).
export const NFT_TREASURY_ADDRESS = '0x603a26e0745aE579ad0F931307a386ddC3DD096F';
