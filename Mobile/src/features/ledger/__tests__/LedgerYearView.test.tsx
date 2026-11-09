import { fireEvent, render, screen } from '@testing-library/react-native';

import { LedgerYearView } from '../components/LedgerYearView';
import type { LedgerRow, LedgerYear } from '../types';

const months = (values: Record<number, number>): (number | null)[] =>
  Array.from({ length: 12 }, (_, i) => values[i + 1] ?? null);

const row = (
  partial: Partial<LedgerRow> & Pick<LedgerRow, 'key' | 'source' | 'name' | 'months'>,
): LedgerRow => ({
  id: null,
  kind: null,
  ownerName: null,
  total: 0,
  monthsWithData: 0,
  average: null,
  ...partial,
});

const byMonth = (values: Record<number, number>) =>
  Array.from({ length: 12 }, (_, i) => values[i + 1] ?? 0);

const data: LedgerYear = {
  year: 2026,
  incomeRows: [
    row({
      key: 'manual-1',
      source: 'manual',
      id: 1,
      name: 'Maaş',
      ownerName: 'Ahmet',
      months: months({ 11: 52000 }),
    }),
  ],
  expenseRows: [
    row({ key: 'plan-1', source: 'plan', id: 10, name: 'Kira', months: months({ 11: 22000 }) }),
    row({
      key: 'category-1',
      source: 'category',
      id: 1,
      name: 'Market',
      months: months({ 11: 12480.2, 6: 60000 }),
    }),
  ],
  totals: {
    incomeByMonth: byMonth({ 11: 52000 }),
    expenseByMonth: byMonth({ 11: 34480.2, 6: 60000 }),
    netByMonth: byMonth({ 11: 17519.8, 6: -60000 }),
    incomeTotal: 52000,
    expenseTotal: 94480.2,
    netTotal: -42480.2,
    incomeAverage: 0,
    expenseAverage: 0,
    netAverage: 0,
  },
};

describe('LedgerYearView', () => {
  it('yıl toplamlarını, seçilen ayın bölümlerini ve ay netini gösterir', async () => {
    await render(<LedgerYearView data={data} month={11} onMonthChange={jest.fn()} />);

    expect(screen.getAllByText('₺52.000,00').length).toBeGreaterThan(0);
    expect(screen.getByText('₺94.480,20')).toBeOnTheScreen();
    expect(screen.getByText('-₺42.480,20')).toBeOnTheScreen();
    expect(screen.getByText('Giderler · Sabit ödemeler')).toBeOnTheScreen();
    expect(screen.getByText('Maaş · Ahmet')).toBeOnTheScreen();
    expect(screen.getByText('Kasım neti')).toBeOnTheScreen();
    expect(screen.getByText('+₺17.519,80')).toBeOnTheScreen();
    // Seçili ay sekmesi; netin kısa gösterimi.
    expect(screen.getByRole('tab', { name: /Kasım/ })).toBeSelected();
    expect(screen.getByRole('tab', { name: /Haziran, net −60,0B/ })).toBeOnTheScreen();
  });

  it('ay sekmesine dokununca ay değişir', async () => {
    const onMonthChange = jest.fn();
    await render(<LedgerYearView data={data} month={11} onMonthChange={onMonthChange} />);
    await fireEvent.press(screen.getByRole('tab', { name: /Haziran/ }));
    expect(onMonthChange).toHaveBeenCalledWith(6);
  });

  it('elle kalem satırı yalnızca düzenleme verilirse basılabilir', async () => {
    const onEditLine = jest.fn();
    const { rerender } = await render(
      <LedgerYearView data={data} month={11} onMonthChange={jest.fn()} />,
    );
    expect(screen.queryByRole('button', { name: /Maaş · Ahmet/ })).toBeNull();

    await rerender(
      <LedgerYearView data={data} month={11} onMonthChange={jest.fn()} onEditLine={onEditLine} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: /Maaş · Ahmet/ }));
    expect(onEditLine).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'manual-1', amount: 52000, editable: true }),
    );
    // Otomatik satır (plan) düzenlenemez.
    expect(screen.queryByRole('button', { name: /Kira/ })).toBeNull();
  });
});
