import type { InvitationInfo } from '@/features/household/types';
import { ApiError } from '@/lib/api/errors';

import { inviteDaysLeft, resolveInviteAction, resolveInviteView } from '../invite';
import { evaluatePasswordRules, formatCountdown, INLINE_MARKER, sanitizeOtp, splitAroundMarker } from '../passwordRules';
import { makeRegisterSchema, toRegisterRequest, type RegisterFormValues } from '../registerForm';
import { passwordSchema } from '../validation';

describe('evaluatePasswordRules (passwordSchema ile aynı kurallar)', () => {
  const met = (pw: string) =>
    Object.fromEntries(evaluatePasswordRules(pw).map((r) => [r.key, r.met])) as Record<string, boolean>;

  it('boş şifrede hiçbir kural sağlanmaz', () => {
    expect(met('')).toEqual({ min: false, upper: false, lower: false, digit: false });
  });

  it('kuralları tek tek işaretler', () => {
    expect(met('Ev2026')).toEqual({ min: false, upper: true, lower: true, digit: true });
    expect(met('abcdefgh')).toEqual({ min: true, upper: false, lower: true, digit: false });
  });

  it.each(['Mobil123', 'Abcdefg1', 'kisa', 'NODIGITSHERE', 'nouppercase1'])(
    'tüm kurallar sağlandığında şema da geçer: %s',
    (pw) => {
      const allMet = evaluatePasswordRules(pw).every((r) => r.met);
      expect(allMet).toBe(passwordSchema.safeParse(pw).success);
    },
  );

  it('etiketler çeviri anahtarıdır', () => {
    expect(evaluatePasswordRules('x').map((r) => r.labelKey)).toEqual([
      'authScreens.passwordRules.min',
      'authScreens.passwordRules.upper',
      'authScreens.passwordRules.lower',
      'authScreens.passwordRules.digit',
    ]);
  });
});

describe('formatCountdown / sanitizeOtp', () => {
  it.each([
    [60, '1:00'],
    [42, '0:42'],
    [5, '0:05'],
    [0, '0:00'],
    [-3, '0:00'],
  ])('%s sn → %s', (seconds, text) => {
    expect(formatCountdown(seconds)).toBe(text);
  });

  it('yalnızca rakam, en fazla 6 hane', () => {
    expect(sanitizeOtp('123 456')).toBe('123456');
    expect(sanitizeOtp('12a3456789')).toBe('123456');
    expect(sanitizeOtp('')).toBe('');
  });

  it('metni yer tutucunun iki yanından böler', () => {
    expect(splitAroundMarker(`${INLINE_MARKER}’nı okudum.`)).toEqual(['', '’nı okudum.']);
    expect(splitAroundMarker(`I accept the ${INLINE_MARKER}.`)).toEqual(['I accept the ', '.']);
    expect(splitAroundMarker('işaretsiz')).toEqual(['işaretsiz', '']);
  });
});

describe('kayıt formu', () => {
  const values: RegisterFormValues = {
    firstName: ' Ayşe ',
    lastName: 'Yılmaz',
    email: 'ayse@ornek.com',
    password: 'Ev2026butce',
    confirmPassword: 'Ev2026butce',
    householdName: ' Yılmaz Ailesi ',
    acceptTerms: true,
    acknowledgePrivacy: true,
  };

  it('davetsiz kayıtta hane adı zorunlu', () => {
    const result = makeRegisterSchema(false).safeParse({ ...values, householdName: ' ' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('validation.householdName.required');
  });

  it('davetli kayıtta hane adı istenmez', () => {
    expect(makeRegisterSchema(true).safeParse({ ...values, householdName: '' }).success).toBe(true);
  });

  it('onaylar ve şifre tekrarı zorunlu', () => {
    const result = makeRegisterSchema(false).safeParse({ ...values, acceptTerms: false, confirmPassword: 'x' });
    const messages = result.error?.issues.map((i) => i.message);
    expect(messages).toEqual(expect.arrayContaining(['validation.acceptTerms', 'validation.password.mismatch']));
  });

  it('davetsiz istek: hane adı kırpılır, telefon null, inviteToken yok', () => {
    const request = toRegisterRequest(values);
    expect(request).toMatchObject({ firstName: 'Ayşe', householdName: 'Yılmaz Ailesi', phoneNumber: null });
    expect(request).not.toHaveProperty('inviteToken');
  });

  it('davetli istek: inviteToken eklenir, hane adı boş', () => {
    const request = toRegisterRequest(values, 'tok123');
    expect(request.inviteToken).toBe('tok123');
    expect(request.householdName).toBe('');
  });
});

describe('davet durumu', () => {
  const info: InvitationInfo = {
    householdName: 'Yılmaz Ailesi',
    inviterName: 'Ayşe Yılmaz',
    email: 'Ali@Ornek.com',
    role: 'Member',
    status: 'Pending',
    userExists: false,
  };

  it('token yoksa bulunamadı', () => {
    expect(resolveInviteView(undefined, { isPending: false })).toEqual({ kind: 'unavailable', reason: 'notFound' });
  });

  it('yükleniyor / bekleyen / kullanılmış', () => {
    expect(resolveInviteView('t', { isPending: true }).kind).toBe('loading');
    expect(resolveInviteView('t', { isPending: false, data: info })).toEqual({ kind: 'pending', info });
    expect(resolveInviteView('t', { isPending: false, data: { ...info, status: 'Expired' } })).toEqual({
      kind: 'unavailable',
      reason: 'Expired',
    });
  });

  it('404 bulunamadı, ağ hatası tekrar denenebilir', () => {
    expect(resolveInviteView('t', { isPending: false, error: new ApiError('x', 404) })).toEqual({
      kind: 'unavailable',
      reason: 'notFound',
    });
    expect(resolveInviteView('t', { isPending: false, error: new ApiError('x', 0) }).kind).toBe('error');
  });

  it('eylem: e-posta eşleşmesi (büyük/küçük harf duyarsız) ve hesap varlığı', () => {
    expect(resolveInviteAction(info, 'ali@ornek.com')).toBe('accept');
    expect(resolveInviteAction(info, 'veli@ornek.com')).toBe('otherAccount');
    expect(resolveInviteAction(info, null)).toBe('register');
    expect(resolveInviteAction({ ...info, userExists: true }, null)).toBe('login');
  });
});

describe('inviteDaysLeft', () => {
  const now = new Date('2026-11-09T10:00:00Z');
  it('kalan gün yukarı yuvarlanır, geçmişte 0, tarih yoksa null', () => {
    expect(inviteDaysLeft('2026-11-16T10:00:00Z', now)).toBe(7);
    expect(inviteDaysLeft('2026-11-09T13:00:00Z', now)).toBe(1);
    expect(inviteDaysLeft('2026-11-08T10:00:00Z', now)).toBe(0);
    expect(inviteDaysLeft(undefined, now)).toBeNull();
    expect(inviteDaysLeft('bozuk', now)).toBeNull();
  });
});
