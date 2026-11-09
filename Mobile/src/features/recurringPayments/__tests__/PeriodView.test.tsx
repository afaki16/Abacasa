import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { User } from '@/features/auth/types';
import i18n from '@/lib/i18n';
import { todayIso } from '@/lib/format/period';
import { useAuthStore } from '@/stores/authStore';

import { PeriodView } from '../components/PeriodView';
import type { RecurringPaymentOccurrence, RecurringPaymentOccurrences } from '../types';

const mockPay = jest.fn();
const mockUndo = jest.fn();
let mockData: RecurringPaymentOccurrences | undefined;

jest.mock('../hooks', () => ({
  useRecurringPaymentOccurrences: () => ({
    isPending: false,
    isError: false,
    isRefetching: false,
    data: mockData,
    refetch: jest.fn(),
  }),
  usePayRecurringPayment: () => ({
    mutate: mockPay,
    reset: jest.fn(),
    isPending: false,
    error: null,
  }),
  useUndoRecurringPayment: () => ({ mutate: mockUndo, isPending: false }),
}));

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
// Ödeme sayfasındaki ödeme aracı seçicisi (aktif araçlar).
jest.mock('@/features/paymentMethods/hooks', () => ({
  usePaymentMethodOptions: () => ({ data: [], isPending: false, isError: false }),
}));
// Native klavye modülü testte bağlı değil; paketin kendi sahtesi.
jest.mock('react-native-keyboard-controller', () =>
  jest.requireActual('react-native-keyboard-controller/jest'),
);
// Kit barrel'ı kaydırmalı satırı (reanimated) da yükler; bu ekranda kullanılmıyor.
jest.mock('@/components/ui/SwipeableRow', () => ({
  SwipeableRow: ({ children }: { children: unknown }) => children,
}));

const today = todayIso();
const month = `${today.slice(0, 7)}-01`;

const occ = (patch: Partial<RecurringPaymentOccurrence>): RecurringPaymentOccurrence => ({
  recurringPaymentId: 1,
  name: 'Kira',
  kind: 'Bill',
  month,
  dueDate: today,
  installmentNo: null,
  installmentCount: null,
  paymentMethodId: 1,
  paymentMethodName: 'Banka kartı',
  categoryName: null,
  personName: null,
  recipient: null,
  isPaid: false,
  paidAmount: null,
  paidDate: null,
  expenseId: null,
  donationId: null,
  amount: 22000,
  isEstimated: false,
  ...patch,
});

const setPermissions = (names: string[]) =>
  useAuthStore.setState({
    isUserVerified: true,
    user: {
      id: 1,
      roles: [],
      permissions: names.map((name) => ({ name, fullPermission: name })),
    } as unknown as User,
  });

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};
const renderView = () =>
  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PeriodView />
    </SafeAreaProvider>,
  );

beforeAll(async () => {
  await i18n.changeLanguage('tr');
});

beforeEach(() => {
  mockPay.mockReset();
  mockUndo.mockReset();
  mockData = {
    items: [
      occ({ recurringPaymentId: 1, name: 'Kira' }),
      occ({ recurringPaymentId: 2, name: 'Doğalgaz faturası', amount: null }),
      occ({
        recurringPaymentId: 3,
        name: 'İnternet',
        isPaid: true,
        paidAmount: 449.9,
        paidDate: today,
        expenseId: 77,
        amount: 449.9,
      }),
    ],
    paidTotal: 449.9,
    pendingTotal: 22000,
    total: 22449.9,
    unknownCount: 1,
    byPaymentMethod: [],
  };
});

describe('PeriodView', () => {
  it('vadeleri durum rozetleri ve tutarı belli olmayan uyarısıyla gösterir', async () => {
    setPermissions(['RecurringPayments.Read', 'RecurringPaymentPayments.Create']);
    await renderView();

    expect(screen.getByText('Kira')).toBeTruthy();
    expect(screen.getAllByText('Bekliyor')).toHaveLength(2);
    expect(screen.getByText('Ödendi')).toBeTruthy();
    expect(screen.getByText(/1 kalemin tutarı belli değil/)).toBeTruthy();
    expect(screen.getByText('Ödenen · 1')).toBeTruthy();
    // Ödenmemiş iki vade için düğme var.
    expect(screen.getAllByRole('button', { name: /^Ödendi olarak işaretle:/ })).toHaveLength(2);
  });

  it('izin yoksa ödeme düğmesi görünmez', async () => {
    setPermissions(['RecurringPayments.Read']);
    await renderView();
    expect(screen.queryAllByRole('button', { name: /^Ödendi olarak işaretle/ })).toHaveLength(0);
  });

  it('ödeme sayfası tutarı doldurur ve vadenin ayıyla gönderir', async () => {
    setPermissions(['RecurringPayments.Read', 'RecurringPaymentPayments.Create']);
    await renderView();

    await fireEvent.press(screen.getByRole('button', { name: 'Ödendi olarak işaretle: Kira' }));
    expect(screen.getByLabelText('Ödenen tutar').props.value).toBe('₺22.000,00');
    await fireEvent.press(screen.getByRole('button', { name: 'Ödendi olarak kaydet' }));

    expect(mockPay).toHaveBeenCalledWith(
      { recurringPaymentId: 1, month, amount: 22000, date: today },
      expect.anything(),
    );
  });

  it('tutarı belli olmayan vadede tutar girilmeden gönderilmez', async () => {
    setPermissions(['RecurringPayments.Read', 'RecurringPaymentPayments.Create']);
    await renderView();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Ödendi olarak işaretle: Doğalgaz faturası' }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Ödendi olarak kaydet' }));
    expect(mockPay).not.toHaveBeenCalled();
    expect(screen.getByText('Bu alan gerekli')).toBeTruthy();
  });
});
