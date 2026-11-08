// Kök layout. Açılış sırası:
//   1. Splash açık kalır (preventAutoHideAsync, modül seviyesinde)
//   2. Oturum SecureStore'dan okunur (rehydrate)
//   3. Splash kapanır; saklı oturum arka planda /me ile doğrulanır (açılışı bloklamaz)
//
// Route guard (Stack.Protected) — yönlendirmeyi ekranlar değil router yapar:
//   - girişsiz          → yalnızca (auth)
//   - girişli           → yalnızca (app)
//   - girişli + MustChangePassword → yalnızca force-change-password
//   - girişli + bekleyen yasal onay (pendingConsents) → yalnızca consents
// Login, logout, refresh reddi veya 403/1014 state'i değiştirince router kendisi geçer.

import { QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSessionValidation } from '@/features/auth/hooks';
// Barrel: refresh interceptor'ı yan etkiyle kaydeder.
import { queryClient, wireQueryClientToNative } from '@/lib/api';
import { initMonitoring, setMonitoringUser, wrapRoot } from '@/lib/monitoring/sentry';
import { selectMustChangePassword, selectNeedsConsent, useAuthStore } from '@/stores/authStore';

// Hata raporlama en önce başlar ki açılış hataları da yakalansın (DSN yoksa no-op).
initMonitoring();
SplashScreen.preventAutoHideAsync();
wireQueryClientToNative();

export default wrapRoot(RootLayout);

function RootLayout() {
  const isRehydrating = useAuthStore((s) => s.isRehydrating);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const mustChangePassword = useAuthStore(selectMustChangePassword);
  const needsConsent = useAuthStore(selectNeedsConsent);
  const rehydrate = useAuthStore((s) => s.rehydrate);

  useEffect(() => {
    rehydrate();
  }, [rehydrate]);

  useEffect(() => {
    if (!isRehydrating) SplashScreen.hide();
  }, [isRehydrating]);

  useSessionValidation();
  useResetQueriesOnAccountChange();

  // Splash hâlâ ekranda; navigator'ı guard'lar doğru değeri alana kadar kurma.
  if (isRehydrating) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <KeyboardProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Protected guard={!isAuthenticated} redirectTo="/">
                <Stack.Screen name="(auth)" />
              </Stack.Protected>
              <Stack.Protected
                guard={isAuthenticated && !mustChangePassword && !needsConsent}
                redirectTo={!isAuthenticated ? '/login' : mustChangePassword ? '/force-change-password' : '/consents'}
              >
                <Stack.Screen name="(app)" />
              </Stack.Protected>
              <Stack.Protected guard={isAuthenticated && mustChangePassword} redirectTo="/">
                <Stack.Screen name="force-change-password" />
              </Stack.Protected>
              <Stack.Protected guard={isAuthenticated && !mustChangePassword && needsConsent} redirectTo="/">
                <Stack.Screen name="consents" />
              </Stack.Protected>
            </Stack>
            <StatusBar style="dark" />
          </KeyboardProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Hesap değişince (giriş, çıkış, başka kullanıcı) önbellek sıfırlanır: önceki hesabın
 * verisi yeni hesapta görünmez. clear() değil resetQueries(): ekrandaki sorgular yeniden çekilir.
 * Hata raporlarındaki kullanıcı da (yalnızca id) güncellenir.
 */
function useResetQueriesOnAccountChange() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const previous = useRef(userId);
  useEffect(() => {
    setMonitoringUser(userId);
    if (previous.current !== userId) {
      previous.current = userId;
      queryClient.resetQueries();
    }
  }, [userId]);
}
