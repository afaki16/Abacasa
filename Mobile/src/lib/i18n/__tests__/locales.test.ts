import { en, LOCALE_FILES, tr } from '@/locales';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : flatten(value, `${prefix}${key}.`),
  );
}

describe('çeviri dosyaları', () => {
  it('aynı anahtar iki dosyada tanımlanmaz (gruplar birbirini ezmesin)', () => {
    for (const locale of ['tr', 'en'] as const) {
      const seen = new Map<string, string>();
      const duplicates: string[] = [];
      for (const [file, tree] of Object.entries(LOCALE_FILES[locale])) {
        for (const key of flatten(tree as Tree)) {
          if (seen.has(key)) duplicates.push(`${locale}: ${key} (${seen.get(key)} + ${file})`);
          seen.set(key, file);
        }
      }
      expect(duplicates).toEqual([]);
    }
  });

  it('tr ve en aynı anahtarları içerir', () => {
    const trKeys = flatten(tr as Tree).sort();
    const enKeys = flatten(en as Tree).sort();
    expect(trKeys.filter((k) => !enKeys.includes(k))).toEqual([]);
    expect(enKeys.filter((k) => !trKeys.includes(k))).toEqual([]);
  });

  it('çoğul anahtarlar _one ve _other ile birlikte tanımlıdır', () => {
    const keys = flatten(en as Tree);
    const plurals = keys.filter((k) => k.endsWith('_one') || k.endsWith('_other'));
    for (const key of plurals) {
      const base = key.replace(/_(one|other)$/, '');
      expect(keys).toEqual(expect.arrayContaining([`${base}_one`, `${base}_other`]));
    }
  });
});
