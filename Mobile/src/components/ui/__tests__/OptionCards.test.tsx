// Bileşen testi örneği (React Native Testing Library). Kullanıcı gibi sorgula:
// rol + erişilebilir ad (getByRole), metin (getByText); uygulama detayına (testID) bağlanma.
// RNTL v14: render / rerender / fireEvent asenkron — hepsi await edilir.

import { fireEvent, render, screen } from '@testing-library/react-native';

import { OptionCards } from '../OptionCards';

const options = [
  { value: 1, label: 'Admin' },
  { value: 2, label: 'User' },
];

describe('OptionCards', () => {
  it('çoklu seçimde dokunulan değeri ekler ve çıkarır', async () => {
    const onChange = jest.fn();
    const { rerender } = await render(<OptionCards multiple options={options} value={[1]} onChange={onChange} />);

    await fireEvent.press(screen.getByRole('checkbox', { name: /User/ }));
    expect(onChange).toHaveBeenLastCalledWith([1, 2]);

    await rerender(<OptionCards multiple options={options} value={[1, 2]} onChange={onChange} />);
    await fireEvent.press(screen.getByRole('checkbox', { name: /Admin/ }));
    expect(onChange).toHaveBeenLastCalledWith([2]);
  });

  it('tekli seçimde seçili durumu erişilebilirlik bilgisine yansıtır', async () => {
    const onChange = jest.fn();
    await render(<OptionCards options={options} value={2} onChange={onChange} />);

    expect(screen.getByRole('radio', { name: /User/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Admin/ })).not.toBeChecked();

    await fireEvent.press(screen.getByRole('radio', { name: /Admin/ }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('hata mesajını gösterir; disabled iken seçim yapılmaz', async () => {
    const onChange = jest.fn();
    await render(<OptionCards options={options} value={null} onChange={onChange} error="Seçim gerekli" disabled />);

    expect(screen.getByText('Seçim gerekli')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('radio', { name: /Admin/ }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
