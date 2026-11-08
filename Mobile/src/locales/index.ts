// Çeviri kaynakları. Ana dosya (tr.json / en.json) ortak metinleri tutar; ekran grupları kendi
// dosyalarında durur (tr/<grup>.json, en/<grup>.json) — birden fazla kişi aynı anda çalışınca
// aynı dosyayı ezmesinler diye. Dosyalar derin birleştirilir; aynı anahtar iki dosyada olamaz
// (test: lib/i18n/__tests__/locales.test.ts).

import enCore from './en.json';
import enDiger from './en/diger.json';
import enGiris from './en/giris.json';
import enHane from './en/hane.json';
import enOzet from './en/ozet.json';
import enPlanlama from './en/planlama.json';
import trCore from './tr.json';
import trDiger from './tr/diger.json';
import trGiris from './tr/giris.json';
import trHane from './tr/hane.json';
import trOzet from './tr/ozet.json';
import trPlanlama from './tr/planlama.json';

export type LocaleTree = { [key: string]: string | LocaleTree };

/** Grup adı → dosya. Yeni grup eklenirse iki dile de eklenir. */
export const LOCALE_FILES: Record<'tr' | 'en', Record<string, LocaleTree>> = {
  tr: { core: trCore, ozet: trOzet, planlama: trPlanlama, diger: trDiger, hane: trHane, giris: trGiris },
  en: { core: enCore, ozet: enOzet, planlama: enPlanlama, diger: enDiger, hane: enHane, giris: enGiris },
};

function mergeInto(target: LocaleTree, source: LocaleTree): LocaleTree {
  for (const [key, value] of Object.entries(source)) {
    const existing = target[key];
    if (typeof value === 'object' && typeof existing === 'object') {
      mergeInto(existing, value);
    } else if (typeof value === 'object') {
      target[key] = mergeInto({}, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

const merge = (files: Record<string, LocaleTree>): LocaleTree =>
  Object.values(files).reduce<LocaleTree>((acc, file) => mergeInto(acc, file), {});

export const tr = merge(LOCALE_FILES.tr);
export const en = merge(LOCALE_FILES.en);
