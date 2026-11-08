/* eslint-disable import/no-named-as-default-member -- i18next varsayılan örneği (i18n.use/init/t) belgelenmiş kullanımdır */
// Çeviri (i18next). Metinler src/locales'ta (ana dosya + ekran grubu dosyaları, bkz. locales/index.ts);
// iki dilin anahtar kümesi aynı olmalı (test: lib/i18n/__tests__/locales.test.ts). Ekranlar useTranslation() ile, ekran dışı kod t() ile çevirir.
//
// Çoğul: Hermes'te Intl.PluralRules her platformda garanti değil; i18next'in çoğul çözümü yerine
// plural() kullanılır. Anahtarlar "<anahtar>_one" ve "<anahtar>_other" (Türkçede yalnızca _other okunur).

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en, tr } from '@/locales';
import { usePreferencesStore, type AppLocale } from '@/stores/preferencesStore';

export const resources = {
  tr: { translation: tr },
  en: { translation: en },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: usePreferencesStore.getState().locale,
  fallbackLng: 'tr',
  interpolation: { escapeValue: false },
  returnNull: false,
});

// Dil tercihi değişince i18n de değişir; useTranslation() kullanan ekranlar yeniden çizilir.
usePreferencesStore.subscribe((state, prev) => {
  if (state.locale !== prev.locale) void i18n.changeLanguage(state.locale);
});

export const t = i18n.t.bind(i18n);

export function currentLocale(): AppLocale {
  return i18n.language === 'en' ? 'en' : 'tr';
}

/** Sayıya göre tekil/çoğul: plural('debts.openCount', 1) → "1 open debt" / "1 açık borç". */
export function plural(key: string, count: number, options?: Record<string, unknown>): string {
  const form = currentLocale() === 'en' && count === 1 ? 'one' : 'other';
  return i18n.t(`${key}_${form}`, { count, ...options });
}

export default i18n;
