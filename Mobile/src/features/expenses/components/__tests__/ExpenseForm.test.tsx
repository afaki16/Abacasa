import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ApiError } from '@/lib/api';

import { ExpenseForm } from '../ExpenseForm';


jest.mock('@/features/categories/hooks', () => ({
  useCategoryOptions: () => ({ data: [{ id: 3, name: 'Market', createdDate: '' }], isError: false }),
}));
jest.mock('@/features/paymentMethods/hooks', () => ({
  usePaymentMethodOptions: () => ({
    data: [
      { id: 4, name: 'Bonus', type: 'CreditCard', bank: null, ownerPersonId: null, ownerPersonName: null, statementDay: 15, isActive: true, createdDate: '' },
      { id: 5, name: 'Sodexo', type: 'MealCard', bank: null, ownerPersonId: null, ownerPersonName: null, statementDay: null, isActive: true, createdDate: '' },
      { id: 6, name: 'Eski kart', type: 'Cash', bank: null, ownerPersonId: null, ownerPersonName: null, statementDay: null, isActive: false, createdDate: '' },
    ],
    isError: false,
  }),
}));
jest.mock('@/features/people/hooks', () => ({
  usePersonOptions: () => ({ data: [{ id: 2, name: 'Ayşe', relation: null, createdDate: '' }], isError: false }),
}));

describe('ExpenseForm (hızlı giriş)', () => {
  it('boş gönderimde alan hataları; istek gönderilmez', async () => {
    const onSave = jest.fn();
    await render(<ExpenseForm variant="quick" onSave={onSave} onSaved={jest.fn()} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));

    expect(await screen.findByText('Kategori seçmelisin.')).toBeTruthy();
    expect(screen.getByText('Ödeme aracı seçmelisin.')).toBeTruthy();
    expect(screen.getByText('Sıfırdan büyük olmalı')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('seçimlerle kaydeder; yemek kartında ipucu görünür, pasif araç listelenmez', async () => {
    const onSave = jest.fn().mockResolvedValue({});
    const onSaved = jest.fn();
    await render(<ExpenseForm variant="quick" onSave={onSave} onSaved={onSaved} />);

    await fireEvent.changeText(screen.getByLabelText('Tutar'), '₺245,9');
    await fireEvent.press(screen.getByRole('button', { name: 'Kategori: Seç' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Market' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Ödeme aracı: Seç' }));
    expect(screen.queryByRole('radio', { name: /Eski kart/ })).toBeNull();
    await fireEvent.press(screen.getByRole('radio', { name: /Sodexo/ }));
    expect(screen.getByText('Yemek kartı · toplama dahil değil')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: /Kişi:/ }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Ayşe' }));

    await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(false));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 245.9, categoryId: 3, paymentMethodId: 5, ownerPersonId: 2, description: null }),
    );
  });

  it('sunucu alan hatası ilgili alanın altında gösterilir', async () => {
    const onSave = jest.fn().mockRejectedValue(new ApiError('Doğrulama', 400, 1001, { CategoryId: ['Kategori bulunamadı'] }));
    await render(<ExpenseForm variant="quick" onSave={onSave} onSaved={jest.fn()} />);

    await fireEvent.changeText(screen.getByLabelText('Tutar'), '₺10');
    await fireEvent.press(screen.getByRole('button', { name: 'Kategori: Seç' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Market' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Ödeme aracı: Seç' }));
    await fireEvent.press(screen.getByRole('radio', { name: /Bonus/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));

    expect(await screen.findByText('Kategori bulunamadı')).toBeTruthy();
  });
});
