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
//   - auth/accept-invite (davet linki) → girişsiz ya da zorunlu adımı olmayan girişli
// Login, logout, refresh reddi veya 403/1014 state'i değiştirince router kendisi geçer.

import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { router, SplashScreen, Stack, usePathname } from 'expo-router';
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
  const locale = usePreferencesStore((s) => s.locale);
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

  useRemountOnLocaleChange(locale);

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
            {/* key: dil değişince ekranlar yeni dilde baştan çizilir (bkz. useRemountOnLocaleChange). */}
            <Stack
              key={locale}
              screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
            >
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
              {/* Davet linki (abacasa://auth/accept-invite?token=…): girişsiz ve girişli açılır; zorunlu adımı olan önce onu bitirir. */}
              <Stack.Protected guard={!isAuthenticated || (!mustChangePassword && !needsConsent)} redirectTo="/">
                <Stack.Screen name="auth/accept-invite" />
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

/**
 * React Compiler bileşen çıktısını önbelleğe alır; plural(), monthName(), enumLabel() gibi yardımcılar dili
 * hook dışında (i18n örneğinden) okuduğu için dil değişince önbellekteki eski metin kalırdı. Bu yüzden navigator
 * dil değişince yeniden kurulur (Stack key={locale}) ve kullanıcı bulunduğu sayfaya geri götürülür.
 */
function useRemountOnLocaleChange(locale: string) {
  const pathname = usePathname();
  const lastPath = useRef(pathname);
  const previousLocale = useRef(locale);

  useEffect(() => {
    if (previousLocale.current === locale) {
      lastPath.current = pathname;
      return;
    }
    previousLocale.current = locale;
    const target = lastPath.current;
    // Yeniden kurulan navigator ilk ekranla açılır; bir sonraki karede kullanıcının sayfasına dönülür.
    const timer = setTimeout(() => {
      if (target && target !== '/') router.replace(target as never);
    }, 0);
    return () => clearTimeout(timer);
  }, [locale, pathname]);
}
