// TanStack Query global client + React Native bağlantıları:
//  - focusManager ← AppState: uygulama ön plana gelince bayat sorgular tazelenir
//  - onlineManager ← expo-network: çevrimdışıyken sorgular duraklar, bağlantı gelince devam eder

import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { ApiError } from './errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error) => {
        // İstemci hataları tekrar denenmez; yalnızca ağ/sunucu hataları (en fazla 2 kez).
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});

let wired = false;

/** Kök layout'ta bir kez çağrılır. */
export function wireQueryClientToNative(): void {
  if (wired) return;
  wired = true;

  if (Platform.OS !== 'web') {
    AppState.addEventListener('change', (status: AppStateStatus) => {
      focusManager.setFocused(status === 'active');
    });
  }

  onlineManager.setEventListener((setOnline) => {
    const subscription = Network.addNetworkStateListener((state) => {
      setOnline(state.isConnected !== false);
    });
    return () => subscription.remove();
  });
}
