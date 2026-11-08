import { fireEvent, render, screen } from '@testing-library/react-native';

import { AmountField } from '../AmountField';

describe('AmountField', () => {
  it('ham değeri biçimli gösterir ve yazılanı ham değere çevirir', async () => {
    const onChangeValue = jest.fn();
    await render(<AmountField value="1234,5" onChangeValue={onChangeValue} currency="TRY" />);

    const input = screen.getByLabelText('Tutar');
    expect(input.props.value).toBe('₺1.234,5');

    await fireEvent.changeText(input, '₺1.234,56');
    expect(onChangeValue).toHaveBeenLastCalledWith('1234,56');
  });

  it('çeyrek altında ondalık girilmez ve sayısal klavye tam sayı', async () => {
    const onChangeValue = jest.fn();
    await render(<AmountField value="3" onChangeValue={onChangeValue} currency="QuarterGold" variant="inline" />);

    const input = screen.getByLabelText('Tutar');
    expect(input.props.keyboardType).toBe('number-pad');
    await fireEvent.changeText(input, '3,');
    expect(onChangeValue).toHaveBeenLastCalledWith('3');
  });

  it('para birimi düğmesi seçiciyi açar', async () => {
    const onCurrencyPress = jest.fn();
    await render(<AmountField value="" onChangeValue={jest.fn()} currency="USD" onCurrencyPress={onCurrencyPress} />);

    await fireEvent.press(screen.getByRole('button', { name: /Para birimi: Dolar/ }));
    expect(onCurrencyPress).toHaveBeenCalled();
  });
});
