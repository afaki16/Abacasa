// Kök layout. Açılış sırası:
//   1. Splash açık kalır (preventAutoHideAsync, modül seviyesinde)
//   2. Oturum ve tercihler (dil, tema) SecureStore'dan okunur, Inter yazı tipi yüklenir
//   3. Splash kapanır; saklı oturum arka planda /me ile doğrulanır (açılışı bloklamaz)
//
// Route guard (Stack.Protected) — yönlendirmeyi ekranlar değil router yapar:
//   - girişsiz          → yalnızca (auth)
//   - girişli           → yalnızca (app)
//   - girişli + MustChangePassword → yalnızca force-change-password
//   - girişli + bekleyen yasal onay (pendingConsents) → yalnızca consents
// Login, logout, refresh reddi veya 403/1014 state'i değiştirince router kendisi geçer.

import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastHost } from '@/components/ui/Toast';
import { FontFamily, useColorSchemeName, useColors } from '@/constants/theme';
import { useSessionValidation } from '@/features/auth/hooks';
// Yan etki: i18next'i kurar ve dil tercihine bağlar.
import '@/lib/i18n';
// Barrel: refresh interceptor'ı yan etkiyle kaydeder.
import { queryClient, wireQueryClientToNative } from '@/lib/api';
import { initMonitoring, setMonitoringUser, wrapRoot } from '@/lib/monitoring/sentry';
import { selectMustChangePassword, selectNeedsConsent, useAuthStore } from '@/stores/authStore';
import { usePreferencesStore } from '@/stores/preferencesStore';

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
  const loadPreferences = usePreferencesStore((s) => s.load);
  const preferencesLoaded = usePreferencesStore((s) => s.isLoaded);
  const scheme = useColorSchemeName();
  const colors = useColors();

  useEffect(() => {
    rehydrate();
    loadPreferences();
  }, [rehydrate, loadPreferences]);

  // Yüklenemezse sistem yazı tipiyle devam edilir; açılış takılmaz.
  const [fontsLoaded, fontError] = useFonts({
    [FontFamily.regular]: Inter_400Regular,
    [FontFamily.medium]: Inter_500Medium,
    [FontFamily.semibold]: Inter_600SemiBold,
    [FontFamily.bold]: Inter_700Bold,
  });

  const ready = !isRehydrating && preferencesLoaded && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  useSessionValidation();
  useResetQueriesOnAccountChange();

  // Splash hâlâ ekranda; navigator'ı guard'lar doğru değeri alana kadar kurma.
  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <KeyboardProvider>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
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
            {/* Navigator'dan sonra: toast her ekranın üstünde kalır. */}
            <ToastHost />
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
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
