import { Zap, Flame, Waves, Crown, Gem, Sparkles, Heart, Snowflake, User, Ghost, Cpu, Skull, Smile, Eye } from 'lucide-react';

// Team presets. Each defines player appearance parameters.
export const TEAMS = [
  {
    id: 'ape',
    name: 'KRAL MAYMUN',
    primary: '#F4A261',
    hair: '#5A4033', // Fur color
    skin: '#D4B595', // Muzzle color
    type: 'ape',
    variant: 'king',
    icon: Crown,
  },
  {
    id: 'jason_ape',
    name: 'JASON APE',
    primary: '#808080',
    hair: '#4A3D35', // Darker fur
    skin: '#C4A484', // Muzzle
    type: 'ape',
    variant: 'jason',
    icon: Skull,
  },
  {
    id: 'penguin',
    name: 'PENGUEN',
    primary: '#7AB2FF',
    type: 'penguin',
    icon: Snowflake,
  },
  {
    id: 'catgirl',
    name: 'KEDİ KIZ',
    primary: '#98D6A4',
    type: 'anime',
    icon: Heart,
  },
  {
    id: 'punk_3d',
    name: 'PUNK 3D',
    primary: '#FF0000',
    type: 'pixel',
    variant: '3d',
    icon: Eye,
  },
  {
    id: 'punk_smoke',
    name: 'PUNK SİGARA',
    primary: '#D95A00',
    type: 'pixel',
    variant: 'smoke',
    icon: Flame,
  },
  {
    id: 'ninja',
    name: 'NİNJA',
    primary: '#111111',
    type: 'standard',
    skin: '#F5D6B5',
    hair: '#000000',
    accessory: 'ninja',
    icon: Zap,
  },
  {
    id: 'robot',
    name: 'ROBOT',
    primary: '#00FFFF',
    type: 'robot',
    icon: Cpu,
  },
  {
    id: 'zombie',
    name: 'ZOMBİ',
    primary: '#8FBC8F',
    type: 'standard',
    skin: '#8FBC8F',
    hair: '#2F4F4F',
    accessory: 'zombie',
    icon: Ghost,
  },
  {
    id: 'alien',
    name: 'UZAYLI',
    primary: '#00FF00',
    type: 'alien',
    icon: Sparkles,
  },
  {
    id: 'demon',
    name: 'İBLİS',
    primary: '#FF4500',
    type: 'standard',
    skin: '#FF4500',
    hair: '#000000',
    accessory: 'demon',
    icon: Flame,
  },
  {
    id: 'angel',
    name: 'MELEK',
    primary: '#FFD700',
    type: 'standard',
    skin: '#FFF0F5',
    hair: '#FFD700',
    accessory: 'halo',
    icon: Crown,
  },
  {
    id: 'clown',
    name: 'PALYAÇO',
    primary: '#FF1493',
    type: 'standard',
    skin: '#FFFFFF',
    hair: '#FF1493',
    hairStyle: 'curly',
    accessory: 'clown',
    icon: Smile,
  },
  {
    id: 'pirate',
    name: 'KORSAN',
    primary: '#8B4513',
    type: 'standard',
    skin: '#D2B48C',
    hair: '#8B4513',
    accessory: 'eyepatch',
    icon: Waves,
  },
  {
    id: 'vampire',
    name: 'VAMPİR',
    primary: '#8B0000',
    type: 'standard',
    skin: '#F8F8FF',
    hair: '#000000',
    hairStyle: 'spiky',
    accessory: 'vampire',
    icon: Ghost,
  },
  {
    id: 'cyborg',
    name: 'SAYBORG',
    primary: '#E0A98C',
    type: 'standard',
    skin: '#E0A98C',
    hair: '#4F4F4F',
    accessory: 'cyborg',
    icon: Cpu,
  }
];

export const getTeamById = (id) => TEAMS.find((t) => t.id === id) || TEAMS[0];

export const randomOpponent = (excludeId) => {
  const pool = TEAMS.filter((t) => t.id !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)];
};
