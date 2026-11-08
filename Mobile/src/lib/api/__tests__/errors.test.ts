import { ApiError, ErrorCode, isApiError, toApiError } from '../errors';

describe('toApiError', () => {
  it('Abacasa zarfını çözer: mesaj, sayısal kod, alan hataları', () => {
    const error = toApiError(
      { success: false, error: { status: 400, code: 1001, errors: { email: ['E-posta geçersiz'], password: ['Kısa'] } } },
      400,
      'fallback',
    );
    expect(error.message).toBe('E-posta geçersiz');
    expect(error.status).toBe(400);
    expect(error.code).toBe(ErrorCode.ValidationFailed);
    expect(error.messages).toEqual(['E-posta geçersiz', 'Kısa']);
  });

  it('ASP.NET ProblemDetails gövdesini çözer (model binding)', () => {
    const error = toApiError({ title: 'One or more validation errors occurred.', status: 400, errors: { Id: ['Geçersiz'] } }, 400, 'fallback');
    expect(error.message).toBe('Geçersiz');
    expect(error.code).toBeNull();
  });

  it('tanımsız gövdede fallback mesaja düşer', () => {
    const error = toApiError('<html>502</html>', 502, 'Sunucu hatası');
    expect(error.message).toBe('Sunucu hatası');
    expect(error.status).toBe(502);
    expect(error.messages).toEqual(['Sunucu hatası']);
  });
});

describe('ApiError', () => {
  it('status 0 ağ hatasıdır', () => {
    expect(new ApiError('x', 0).isNetworkError).toBe(true);
    expect(new ApiError('x', 500).isNetworkError).toBe(false);
  });

  it('isApiError kodu da kontrol eder', () => {
    const error = new ApiError('x', 403, ErrorCode.PasswordChangeRequired);
    expect(isApiError(error)).toBe(true);
    expect(isApiError(error, ErrorCode.PasswordChangeRequired)).toBe(true);
    expect(isApiError(error, ErrorCode.EmailNotConfirmed)).toBe(false);
    expect(isApiError(new Error('x'))).toBe(false);
  });
});
