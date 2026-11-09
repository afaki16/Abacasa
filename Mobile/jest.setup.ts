// Jest ortamı: native modüllerin bellek içi sahteleri. jest-expo preset'i RN/Expo
// modüllerinin çoğunu zaten taklit eder; burada davranışı test edilen modüller var.

// SecureStore → bellek içi sözlük. Testler `jest.requireMock('expo-secure-store').__store`
// ile içeriği okuyabilir / `__failNextSet()` ile yazma hatası üretebilir.
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  let failNextSet = false;
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      if (failNextSet) {
        failNextSet = false;
        throw new Error('keystore unavailable');
      }
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    __store: store,
    __failNextSet: () => {
      failNextSet = true;
    },
  };
});

beforeEach(() => {
  jest.requireMock('expo-secure-store').__store.clear();
});

// UI kiti (@/components/ui) native modüllere dayanır; Jest'te bunların resmî sahteleri kullanılır.
// Bileşen testleri kendi dosyalarında yeniden tanımlamak zorunda kalmasın diye burada.
jest.mock('react-native-keyboard-controller', () => jest.requireActual('react-native-keyboard-controller/jest'));
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual<{ default: unknown }>('react-native-safe-area-context/jest/mock').default,
);
// Kaydırmalı satır testlerde düz içerik olarak çizilir (reanimated jest ortamında çalışmaz).
jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => ({
  __esModule: true,
  default: ({ children }: { children: unknown }) => children,
}));
