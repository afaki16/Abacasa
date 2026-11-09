import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import RegisterScreen from '@/app/(auth)/register';

const mockRegister = jest.fn();
const mockLogin = jest.fn();
let mockParams: Record<string, string | undefined> = {};

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/features/auth/hooks', () => ({
  useRegister: () => ({ mutateAsync: mockRegister, isPending: false, error: null }),
  useLogin: () => ({ mutateAsync: mockLogin, isPending: false, error: null }),
}));
jest.mock('@/features/auth/legal', () => ({ openLegalDocument: jest.fn() }));

async function fillCommonFields() {
  await fireEvent.changeText(screen.getByLabelText('Ad'), 'Ali');
  await fireEvent.changeText(screen.getByLabelText('Soyad'), 'Yılmaz');
  await fireEvent.changeText(screen.getByLabelText('Şifre'), 'Ev2026butce');
  await fireEvent.changeText(screen.getByLabelText('Şifre tekrarı'), 'Ev2026butce');
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Kullanım koşulları’nı okudum, kabul ediyorum.' }));
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Aydınlatma metni’ni okudum.' }));
}

describe('Kayıt ekranı', () => {
  beforeEach(() => {
    mockRegister.mockReset().mockResolvedValue(undefined);
    mockLogin.mockReset().mockResolvedValue(undefined);
  });

  it('şifre kuralları canlı güncellenir; onaylar olmadan düğme kapalı', async () => {
    mockParams = {};
    await render(<RegisterScreen />);

    expect(screen.getByLabelText('Hane adı')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hesap oluştur' })).toBeDisabled();
    expect(screen.getByLabelText('En az 8 karakter: henüz sağlanmadı')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Şifre'), 'Ev2026butce');
    expect(screen.getByLabelText('En az 8 karakter: sağlandı')).toBeTruthy();
    expect(screen.getByLabelText('Rakam: sağlandı')).toBeTruthy();
  });

  it('davetle kayıt: hane adı sorulmaz, inviteToken gönderilir ve giriş yapılır', async () => {
    mockParams = { inviteToken: 'tok123', email: 'ali@ornek.com', household: 'Yılmaz Ailesi' };
    await render(<RegisterScreen />);

    expect(screen.queryByLabelText('Hane adı')).toBeNull();
    expect(screen.getByText(/Yılmaz Ailesi hanesine katılmak için/)).toBeTruthy();

    await fillCommonFields();
    await fireEvent.press(screen.getByRole('button', { name: 'Hesap oluştur' }));

    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));
    expect(mockRegister.mock.calls[0][0]).toMatchObject({
      email: 'ali@ornek.com',
      inviteToken: 'tok123',
      householdName: '',
      acceptTerms: true,
      acknowledgePrivacy: true,
    });
    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith({ email: 'ali@ornek.com', password: 'Ev2026butce' }),
    );
  });

  it('davetsiz kayıtta hane adı boşsa istek gönderilmez', async () => {
    mockParams = {};
    await render(<RegisterScreen />);

    await fireEvent.changeText(screen.getByLabelText('E-posta'), 'ali@ornek.com');
    await fillCommonFields();
    await fireEvent.press(screen.getByRole('button', { name: 'Hesap oluştur' }));

    expect(await screen.findByText('Hane adı gerekli')).toBeTruthy();
    expect(mockRegister).not.toHaveBeenCalled();
  });
});
