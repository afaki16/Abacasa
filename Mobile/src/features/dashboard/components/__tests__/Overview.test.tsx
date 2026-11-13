import { fireEvent, render, screen } from '@testing-library/react-native';

import type { Dashboard } from '../../types';
import { Overview } from '../Overview';

// Native modüller: klavye denetleyicisi (BottomSheet / Screen) ve kaydırılabilir satır.

// Yetkiler testte elle verilir (asıl kontrol backend'de).
let mockPermissions: string[] = [];
jest.mock('@/features/auth/permissions', () => ({
  useHasPermission: (p: string) => mockPermissions.includes(p),
}));

const mockGo = jest.fn();
jest.mock('@/features/dashboard/links', () => ({
  ...jest.requireActual('@/features/dashboard/links'),
  go: (path: string) => mockGo(path),
}));

// Bütçe kartı izin listesinde Budgets.Read olmadığı sürece görünmez; sorgu ağ çağrısı yapmaz.
jest.mock('@/features/budgets/hooks', () => ({
  useBudgetReport: () => ({ data: undefined, isPending: false, isError: false }),
}));

let mockDashboard: Dashboard;
jest.mock('@/features/dashboard/hooks', () => ({
  useDashboard: () => ({
    data: mockDashboard,
    isPending: false,
    isError: false,
    isRefetching: false,
    refetch: jest.fn(),
  }),
}));

jest.mock('@/features/expenses/hooks', () => ({
  useExpenseSummary: () => ({
    data: {
      total: 300,
      mealCardTotal: 0,
      count: 2,
      byCategory: [
        { categoryId: 1, categoryName: 'Market', total: 200 },
        { categoryId: 2, categoryName: 'Yakıt', total: 100 },
      ],
      byPaymentMethod: [],
    },
    isPending: false,
    isError: false,
  }),
}));

const today = (() => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return { iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, date: d };
})();

const daysAgo = (n: number) => {
  const d = new Date(today.date);
  d.setDate(d.getDate() - n);
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const emptyDashboard = (): Dashboard => ({
  spent: { expenses: 0, donations: 0, total: 0 },
  pending: { total: 0, count: 0, unknownCount: 0 },
  outflowTotal: 0,
  mealCard: { spent: 0, pending: 0, total: 0 },
  recurring: { paidTotal: 0, pendingTotal: 0, total: 0, unknownCount: 0 },
  byPaymentMethod: [],
  byPerson: [],
  debts: { openTry: 0, foreign: [], openTotalInTry: 0, paidTotalInTry: 0, openCount: 0, rates: [], byCreditor: [] },
  upcoming: [],
});

const fullDashboard = (): Dashboard => ({
  ...emptyDashboard(),
  spent: { expenses: 31420.4, donations: 2500, total: 33920.4 },
  pending: { total: 14330, count: 2, unknownCount: 0 },
  outflowTotal: 48250.4,
  mealCard: { spent: 3240, pending: 760, total: 4000 },
  recurring: { paidTotal: 18200, pendingTotal: 14330, total: 32530, unknownCount: 0 },
  byPaymentMethod: [{ id: 1, name: 'Kredi kartı', type: 'CreditCard', spent: 1000, pending: 0, total: 1000 }],
  byPerson: [{ personId: null, name: null, spent: 500, pending: 0, total: 500 }],
  debts: {
    openTry: 50000,
    foreign: [{ currency: 'EUR', open: 1000, rate: null, openInTry: null }],
    openTotalInTry: null,
    paidTotalInTry: 0,
    openCount: 4,
    rates: [],
    byCreditor: [],
  },
  upcoming: [
    {
      source: 'recurring',
      recurringPaymentId: 1,
      vehicleId: null,
      name: 'Elektrik faturası',
      kind: 'Bill',
      obligationType: null,
      dueDate: daysAgo(2),
      amount: 1240,
      isEstimated: false,
      paymentMethodName: null,
      isOverdue: true,
    },
    {
      source: 'vehicle',
      recurringPaymentId: null,
      vehicleId: 9,
      name: 'Aile arabası · Muayene',
      kind: null,
      obligationType: 'Inspection',
      dueDate: daysAgo(-12),
      amount: null,
      isEstimated: false,
      paymentMethodName: null,
      isOverdue: false,
    },
  ],
});

describe('Overview', () => {
  beforeEach(() => {
    mockGo.mockClear();
    expect(today.iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('dönem toplamı, kartlar, yaklaşan ödemeler, araç hatırlatması ve kategori kırılımı', async () => {
    mockPermissions = ['Expenses.Read', 'Debts.Read', 'RecurringPayments.Read', 'Vehicles.Read'];
    mockDashboard = fullDashboard();
    await render(<Overview />);

    expect(screen.getByText('₺48.250,40')).toBeTruthy();
    expect(screen.getByText('₺31.420,40')).toBeTruthy();
    // Euro kuru yok: TL karşılığı hesaplanamaz, açık tutar satırı + uyarı.
    expect(screen.getByText('₺50.000,00 · €1.000,00')).toBeTruthy();
    expect(screen.getByText('Euro kuru girilmemiş')).toBeTruthy();
    expect(screen.getByText('₺760,00 bekleyen')).toBeTruthy();
    expect(screen.getByText('Gecikti · 2 gün')).toBeTruthy();
    expect(screen.getByText('12 gün kaldı')).toBeTruthy();
    expect(screen.getByText('Market')).toBeTruthy();
    expect(screen.getByText('67%')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: /Açık borç/ }));
    expect(mockGo).toHaveBeenCalledWith('/debts');
  });

  it('Harcama okuma izni yoksa kategori kırılımı ve borç bağlantısı yok', async () => {
    mockPermissions = [];
    mockDashboard = fullDashboard();
    await render(<Overview />);

    expect(screen.queryByRole('radio', { name: 'Kategori' })).toBeNull();
    expect(screen.getByRole('radio', { name: 'Ödeme aracı' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Açık borç/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Tümü' })).toBeNull();
  });

  it('kayıt yoksa boş durum; ekleme düğmesi yalnızca izinle', async () => {
    mockPermissions = ['Expenses.Create'];
    mockDashboard = emptyDashboard();
    await render(<Overview />);

    expect(screen.getByText('Bu ay henüz kayıt yok')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'İlk harcamayı ekle' }));
    expect(mockGo).toHaveBeenCalledWith('/expenses/new');
  });

  it('boş durumda izin yoksa ekleme düğmesi görünmez', async () => {
    mockPermissions = [];
    mockDashboard = emptyDashboard();
    await render(<Overview />);

    expect(screen.getByText('Bu ay henüz kayıt yok')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'İlk harcamayı ekle' })).toBeNull();
  });
});
