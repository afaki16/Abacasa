import { act, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { darkColors, lightColors } from '@/constants/theme';
import { usePreferencesStore } from '@/stores/preferencesStore';

import { Badge } from '../Badge';

const setTheme = (themeMode: 'light' | 'dark' | 'system') => act(() => usePreferencesStore.setState({ themeMode }));

/** Rozetin zemin ve yazı rengi (rozet erişilebilir adıyla, yani metniyle bulunur). */
function badgeColors(label: string) {
  return {
    bg: StyleSheet.flatten(screen.getByLabelText(label).props.style).backgroundColor,
    fg: StyleSheet.flatten(screen.getByText(label).props.style).color,
  };
}

describe('Badge', () => {
  afterEach(() => setTheme('system'));

  it('durumu metinle gösterir; varsayılan nötr', async () => {
    await setTheme('light');
    await render(<Badge label="Pasif" />);
    expect(screen.getByText('Pasif')).toBeOnTheScreen();
    expect(badgeColors('Pasif').bg).toBe(lightColors.badges.neutral.bg);
  });

  it('türün açık tema renklerini kullanır', async () => {
    await setTheme('light');
    await render(<Badge label="Gecikti" variant="overdue" />);
    expect(badgeColors('Gecikti')).toEqual(lightColors.badges.overdue);
  });

  it('koyu temada koyu rozet renklerine geçer', async () => {
    await setTheme('dark');
    await render(<Badge label="Ödendi" variant="paid" />);
    expect(badgeColors('Ödendi')).toEqual(darkColors.badges.paid);
  });
});
