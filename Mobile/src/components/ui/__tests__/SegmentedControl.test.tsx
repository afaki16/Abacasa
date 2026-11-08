import { fireEvent, render, screen } from '@testing-library/react-native';

import { SegmentedControl } from '../SegmentedControl';

const segments = [
  { value: 'light', label: 'Açık' },
  { value: 'dark', label: 'Koyu' },
  { value: 'system', label: 'Sistem' },
];

describe('SegmentedControl', () => {
  it('seçili parçayı erişilebilirlik bilgisine yansıtır', async () => {
    await render(<SegmentedControl segments={segments} value="dark" onChange={jest.fn()} accessibilityLabel="Tema" />);

    expect(screen.getByRole('radio', { name: 'Koyu' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Açık' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Sistem' })).not.toBeChecked();
  });

  it('başka parçaya dokununca onChange çağrılır; seçiliye dokununca çağrılmaz', async () => {
    const onChange = jest.fn();
    await render(<SegmentedControl segments={segments} value="light" onChange={onChange} />);

    await fireEvent.press(screen.getByRole('radio', { name: 'Açık' }));
    expect(onChange).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('radio', { name: 'Sistem' }));
    expect(onChange).toHaveBeenCalledWith('system');
  });

  it('disabled iken seçim yapılmaz', async () => {
    const onChange = jest.fn();
    await render(<SegmentedControl segments={segments} value="light" onChange={onChange} disabled />);

    await fireEvent.press(screen.getByRole('radio', { name: 'Koyu' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
