declare module 'react-native-safe-area-context' {
  import * as React from 'react';
  import { ViewProps } from 'react-native';
  export const SafeAreaView: React.ComponentType<ViewProps & { edges?: Array<'top' | 'right' | 'bottom' | 'left'> }>;
  export function useSafeAreaInsets(): { top: number; right: number; bottom: number; left: number };
  export const SafeAreaProvider: React.ComponentType<{ children?: React.ReactNode }>;
}
