export type ThemeName = 'earth' | 'mars' | 'saturn' | 'jupiter' | 'venus' | 'mercury' | 'neptune' | 'uranus' | 'pluto' | 'moon' | 'sun';

export type ThemePalette = {
  // Mantemos as chaves usadas nas telas atuais para reduzir mudanças
  bg: string;
  white: string;
  lilac: string;
  blue: string;
  cyan: string;
  purple: string;
};

export const THEMES: Record<ThemeName, ThemePalette> = {
  earth: {
    bg: '#0B0D17',
    white: '#F1FAEE',
    lilac: '#A8A4FF',
    blue: '#3D5A80',
    cyan: '#64DFDF',
    purple: '#9D4EDD',
  },
  mars: {
    bg: '#1A0F0F',
    white: '#F9EAE7',
    lilac: '#FFB3C1',
    blue: '#8D4B55',
    cyan: '#FF6B6B',
    purple: '#C9184A',
  },
  saturn: {
    bg: '#0D0A12',
    white: '#FAF3E7',
    lilac: '#F4D06F',
    blue: '#5E548E',
    cyan: '#CDB4DB',
    purple: '#9B5DE5',
  },
  jupiter: {
    bg: '#0E0B08',
    white: '#F2E9E4',
    lilac: '#F2C6A0',
    blue: '#6B705C',
    cyan: '#CB997E',
    purple: '#B08968',
  },
  venus: {
    bg: '#0F0A06',
    white: '#FFF3E2',
    lilac: '#FFD6A5',
    blue: '#FFADAD',
    cyan: '#FDFFB6',
    purple: '#FF8FAB',
  },
  mercury: {
    bg: '#0A0A0A',
    white: '#F1F1F1',
    lilac: '#C0C0C0',
    blue: '#8D99AE',
    cyan: '#BDBDBD',
    purple: '#ADB5BD',
  },
  neptune: {
    bg: '#06121F',
    white: '#E9FBFF',
    lilac: '#A8DADC',
    blue: '#1D3557',
    cyan: '#457B9D',
    purple: '#5E60CE',
  },
  uranus: {
    bg: '#071A1A',
    white: '#E8FBFF',
    lilac: '#BDE0FE',
    blue: '#48CAE4',
    cyan: '#ADE8F4',
    purple: '#56CFE1',
  },
  pluto: {
    bg: '#0B0B14',
    white: '#EFF0FF',
    lilac: '#A29BFE',
    blue: '#5C5B8A',
    cyan: '#9BA4B5',
    purple: '#7F7FFF',
  },
  moon: {
    bg: '#0A0C0E',
    white: '#E0E1DD',
    lilac: '#CCD5AE',
    blue: '#778DA9',
    cyan: '#A9BCD0',
    purple: '#B8C0FF',
  },
  sun: {
    bg: '#130A02',
    white: '#FFF4E6',
    lilac: '#FFD166',
    blue: '#FF7F11',
    cyan: '#FCA311',
    purple: '#E85D04',
  },
};

export function getTheme(name?: ThemeName | null): ThemePalette {
  const n = (name || 'earth') as ThemeName;
  return THEMES[n] ?? THEMES.earth;
}
