import { MAX_PHOTO_BYTES, preparePhoto } from '../photo';

describe('preparePhoto', () => {
  it('mimeType varsa onu kullanır, adı uzantıyla üretir', () => {
    expect(preparePhoto({ uri: 'file:///c/x', mimeType: 'image/jpeg', fileSize: 1000 })).toEqual({
      ok: true,
      part: { uri: 'file:///c/x', name: 'profile.jpg', type: 'image/jpeg' },
    });
  });

  it('mimeType yoksa dosya adından ya da uri uzantısından tahmin eder', () => {
    expect(preparePhoto({ uri: 'file:///c/a', fileName: 'IMG_1.PNG' })).toMatchObject({ ok: true, part: { type: 'image/png' } });
    expect(preparePhoto({ uri: 'file:///c/crop.webp?x=1' })).toMatchObject({ ok: true, part: { name: 'profile.webp' } });
  });

  it('desteklenmeyen tür reddedilir', () => {
    expect(preparePhoto({ uri: 'file:///c/a.heic', mimeType: 'image/heic' })).toEqual({ ok: false, errorKey: 'unsupported' });
    expect(preparePhoto({ uri: 'file:///c/a' })).toEqual({ ok: false, errorKey: 'unsupported' });
  });

  it('10 MB üstü reddedilir', () => {
    expect(preparePhoto({ uri: 'file:///c/a.jpg', mimeType: 'image/jpeg', fileSize: MAX_PHOTO_BYTES + 1 })).toEqual({
      ok: false,
      errorKey: 'tooLarge',
    });
  });
});
