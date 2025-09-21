import React, { createContext, useContext, useMemo, useState } from 'react';
import { ThemeName, ThemePalette, getTheme } from './theme';

export type ThemeContextValue = {
  name: ThemeName;
  colors: ThemePalette;
  setTheme: (name: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ initialName = 'earth', children }: { initialName?: ThemeName; children: React.ReactNode }) {
  const [name, setName] = useState<ThemeName>(initialName);
  const colors = useMemo(() => getTheme(name), [name]);

  const value = useMemo<ThemeContextValue>(() => ({ name, colors, setTheme: setName }), [name, colors]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  return ctx;
}
