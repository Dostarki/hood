export const BOOTS = [
  {
    id: 'boot_1',
    name: 'STANDARD BLACK',
    color: '#222222',
    secondary: '#111111',
    spdBonus: 0,
    powBonus: 0,
    desc: 'Basic Starter Boots'
  },
  {
    id: 'boot_2',
    name: 'ORANGE FLAME',
    color: '#FF8C00',
    secondary: '#FFA500',
    spdBonus: 5,
    powBonus: 1,
    desc: '+5 Speed, +1 Shot'
  },
  {
    id: 'boot_3',
    name: 'CRIMSON STORM',
    color: '#DC143C',
    secondary: '#FF0000',
    spdBonus: 7,
    powBonus: 2,
    desc: '+7 Speed, +2 Shot'
  },
  {
    id: 'boot_4',
    name: 'BLUE LIGHTNING',
    color: '#0000FF',
    secondary: '#00BFFF',
    spdBonus: 10,
    powBonus: 5,
    desc: '+10 Speed, +5 Shot'
  },
  {
    id: 'boot_5',
    name: 'TITANIUM REFLECT',
    color: '#808080',
    secondary: '#D3D3D3',
    effect: 'reflection',
    spdBonus: 15,
    powBonus: 10,
    desc: '+15 Speed, +10 Shot'
  },
  {
    id: 'boot_6',
    name: 'DEEP GALAXY',
    color: '#2B00FF',
    secondary: '#FF00FF',
    effect: 'galaxy',
    spdBonus: 20,
    powBonus: 15,
    desc: '+20 Speed, +15 Shot'
  }
];

export function getBootById(id) {
  return BOOTS.find(b => b.id === id) || BOOTS[0];
}
