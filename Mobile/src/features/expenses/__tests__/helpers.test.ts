import {
  emptyExpenseValues,
  expenseFormSchema,
  expenseToValues,
  mapServerErrors,
  valuesToRequest,
  type ExpenseFormValues,
} from '../form';
import { dayRelation, groupExpensesByDay } from '../grouping';
import { categoryIcon, paymentMethodIcon } from '../icons';
import type { Expense } from '../types';

const expense = (over: Partial<Expense>): Expense => ({
  id: 1,
  date: '2026-11-08',
  amount: 100,
  description: null,
  categoryId: 3,
  categoryName: 'Market',
  paymentMethodId: 4,
  paymentMethodName: 'Kredi kartı',
  paymentMethodType: 'CreditCard',
  ownerPersonId: null,
  ownerPersonName: null,
  createdDate: '2026-11-08T10:00:00Z',
  ...over,
});

describe('groupExpensesByDay', () => {
  it('ardışık aynı tarihleri tek başlık altında toplar, gün toplamını hesaplar', () => {
    const items = groupExpensesByDay(
      [
        expense({ id: 1, date: '2026-11-08', amount: 1164.4 }),
        expense({ id: 2, date: '2026-11-08', amount: 120 }),
        expense({ id: 3, date: '2026-11-07', amount: 1860 }),
        expense({ id: 4, date: '2026-11-05', amount: 3500 }),
      ],
      '2026-11-08',
    );
    expect(items.map((i) => i.key)).toEqual(['d-2026-11-08', 'e-1', 'e-2', 'd-2026-11-07', 'e-3', 'd-2026-11-05', 'e-4']);
    expect(items[0]).toMatchObject({ type: 'header', relation: 'today', total: 1284.4 });
    expect(items[3]).toMatchObject({ type: 'header', relation: 'yesterday', total: 1860 });
    expect(items[5]).toMatchObject({ type: 'header', relation: null, total: 3500 });
  });

  it('boş listede öğe yok; ay sınırında dün doğru bulunur', () => {
    expect(groupExpensesByDay([], '2026-11-08')).toEqual([]);
    expect(dayRelation('2026-10-31', '2026-11-01')).toBe('yesterday');
    expect(dayRelation('2026-11-02', '2026-11-01')).toBeNull();
  });
});

describe('harcama formu', () => {
  const valid: ExpenseFormValues = {
    amount: '1234,5',
    date: '2026-11-08',
    categoryId: 3,
    paymentMethodId: 4,
    ownerPersonId: null,
    description: '  Haftalık market ',
  };

  it('istek gövdesine çevirir (tutar sayı, boş açıklama null)', () => {
    expect(valuesToRequest(valid)).toEqual({
      date: '2026-11-08',
      amount: 1234.5,
      description: 'Haftalık market',
      categoryId: 3,
      paymentMethodId: 4,
      ownerPersonId: null,
    });
    expect(valuesToRequest({ ...valid, description: '   ' }).description).toBeNull();
  });

  it('kayıttan form değerleri ve geri (gidiş-dönüş)', () => {
    const e = expense({ amount: 186.5, description: 'Öğle yemeği', ownerPersonId: 2, ownerPersonName: 'Ahmet' });
    const values = expenseToValues(e);
    expect(values).toMatchObject({ amount: '186,50', categoryId: 3, ownerPersonId: 2, description: 'Öğle yemeği' });
    expect(valuesToRequest(values)).toMatchObject({ amount: 186.5, ownerPersonId: 2 });
  });

  it('yeni kayıtta bugün; "kaydet ve yeni"de seçimler korunur, tutar ve açıklama boşalır', () => {
    expect(emptyExpenseValues('2026-11-08')).toEqual({
      amount: '',
      date: '2026-11-08',
      categoryId: null,
      paymentMethodId: null,
      ownerPersonId: null,
      description: '',
    });
    expect(emptyExpenseValues('2026-11-08', { ...valid, date: '2026-11-07', ownerPersonId: 5 })).toEqual({
      amount: '',
      date: '2026-11-07',
      categoryId: 3,
      paymentMethodId: 4,
      ownerPersonId: 5,
      description: '',
    });
  });

  it('şema: tutar > 0, kategori ve ödeme aracı zorunlu, açıklama ≤ 200', () => {
    expect(expenseFormSchema.safeParse(valid).success).toBe(true);
    const result = expenseFormSchema.safeParse({
      ...valid,
      amount: '0',
      categoryId: null,
      paymentMethodId: null,
      description: 'x'.repeat(201),
    });
    expect(result.success).toBe(false);
    const messages = Object.fromEntries(result.error!.issues.map((i) => [i.path[0], i.message]));
    expect(messages).toMatchObject({
      amount: 'validation.positive',
      categoryId: 'expenses.validation.categoryRequired',
      paymentMethodId: 'expenses.validation.paymentMethodRequired',
    });
    expect(messages.description).toMatch(/^validation\.maxLength/);
  });

  it('sunucu alan hatalarını alanlara eşler, kalanını banda verir', () => {
    expect(
      mapServerErrors({ Amount: ['Tutar 0’dan büyük olmalı'], CategoryId: ['Kategori gerekli'], Other: ['x', 'y'] }),
    ).toEqual({
      fields: [
        { name: 'amount', message: 'Tutar 0’dan büyük olmalı' },
        { name: 'categoryId', message: 'Kategori gerekli' },
      ],
      rest: ['x', 'y'],
    });
  });
});

describe('ikonlar', () => {
  it('kategori adından ikon tahmin eder, bulamazsa genel ikon', () => {
    expect(categoryIcon('Market')).toBe('shopping-cart');
    expect(categoryIcon('YAKIT')).toBe('local-gas-station');
    expect(categoryIcon('Okul servisi')).toBe('school');
    expect(categoryIcon('Kredi kartı aidatı')).toBe('home');
    expect(categoryIcon('Zzz')).toBe('category');
    expect(categoryIcon(null)).toBe('category');
  });

  it('ödeme aracı türüne göre ikon', () => {
    expect(paymentMethodIcon('MealCard')).toBe('lunch-dining');
    expect(paymentMethodIcon('Cash')).toBe('payments');
  });
});
