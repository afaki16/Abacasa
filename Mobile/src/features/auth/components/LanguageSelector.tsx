import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { Icon, SelectSheet, Text } from '@/components/ui';
import { FontFamily, makeStyles, MIN_TOUCH, Spacing, useColors } from '@/constants/theme';
import { SUPPORTED_LOCALES, usePreferencesStore, type AppLocale } from '@/stores/preferencesStore';

/** Giriş ekranının sağ üstündeki dil seçici: "🌐 Türkçe ⌄" → alttan seçim. Tercih kalıcı yazılır. */
export function LanguageSelector() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useStyles();
  const locale = usePreferencesStore((s) => s.locale);
  const setLocale = usePreferencesStore((s) => s.setLocale);
  const [open, setOpen] = useState(false);
  const current = t(`authScreens.language.${locale}`);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('authScreens.language.label', { language: current })}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
      >
        <Icon name="language" size={20} color={colors.text} />
        <Text style={styles.label}>{current}</Text>
        <Icon name="expand-more" size={20} color={colors.text} />
      </Pressable>
      <SelectSheet<AppLocale>
        visible={open}
        onClose={() => setOpen(false)}
        title={t('authScreens.language.sheetTitle')}
        options={SUPPORTED_LOCALES.map((value) => ({ value, label: t(`authScreens.language.${value}`) }))}
        value={locale}
        onSelect={(value) => {
          setOpen(false);
          void setLocale(value);
        }}
      />
    </>
  );
}

const useStyles = makeStyles(() => ({
  trigger: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20 },
  pressed: { opacity: 0.6 },
}));
