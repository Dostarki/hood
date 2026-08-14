export const BOOTS = [
  {
    id: 'boot_1',
    name: 'STANDART SİYAH',
    color: '#222222',
    secondary: '#111111',
    spdBonus: 0,
    powBonus: 0,
    desc: 'Özelliksiz Başlangıç Kramponu'
  },
  {
    id: 'boot_2',
    name: 'TURUNCU ATEŞ',
    color: '#FF8C00',
    secondary: '#FFA500',
    spdBonus: 5,
    powBonus: 1,
    desc: '+5 Hız, +1 Şut'
  },
  {
    id: 'boot_3',
    name: 'KIZIL KASIRGA',
    color: '#DC143C',
    secondary: '#FF0000',
    spdBonus: 7,
    powBonus: 2,
    desc: '+7 Hız, +2 Şut'
  },
  {
    id: 'boot_4',
    name: 'MAVİ ŞİMŞEK',
    color: '#0000FF',
    secondary: '#00BFFF',
    spdBonus: 10,
    powBonus: 5,
    desc: '+10 Hız, +5 Şut'
  },
  {
    id: 'boot_5',
    name: 'TİTANYUM YANSIMA',
    color: '#808080',
    secondary: '#D3D3D3',
    effect: 'reflection',
    spdBonus: 15,
    powBonus: 10,
    desc: '+15 Hız, +10 Şut'
  },
  {
    id: 'boot_6',
    name: 'DERİN GALAKSİ',
    color: '#2B00FF',
    secondary: '#FF00FF',
    effect: 'galaxy',
    spdBonus: 20,
    powBonus: 15,
    desc: '+20 Hız, +15 Şut'
  }
];

export function getBootById(id) {
  return BOOTS.find(b => b.id === id) || BOOTS[0];
}