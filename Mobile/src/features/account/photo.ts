// Profil fotoğrafı yükleme kuralları (backend SetUserPhotoCommand aynası): JPEG, PNG ya da WEBP, en çok 10 MB.
// Sunucu 512 px WEBP'ye çevirip meta veriyi atar. Saf; testlidir.

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const TYPES_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};
const ACCEPTED = new Set(Object.values(TYPES_BY_EXTENSION));

/** Görsel seçicinin döndürdüğü alanların gereken kısmı (expo-image-picker ImagePickerAsset). */
export interface PickedImage {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
}

/** React Native FormData dosya parçası. */
export interface PhotoPart {
  uri: string;
  name: string;
  type: string;
}

export type PhotoCheck = { ok: true; part: PhotoPart } | { ok: false; errorKey: 'tooLarge' | 'unsupported' };

export function preparePhoto(image: PickedImage): PhotoCheck {
  if (image.fileSize && image.fileSize > MAX_PHOTO_BYTES) return { ok: false, errorKey: 'tooLarge' };

  const source = image.fileName || image.uri.split('?')[0].split('/').pop() || '';
  const extension = source.includes('.') ? source.split('.').pop()!.toLowerCase() : '';
  const type = image.mimeType?.toLowerCase() || TYPES_BY_EXTENSION[extension];
  if (!type || !ACCEPTED.has(type)) return { ok: false, errorKey: 'unsupported' };

  const ext = type === 'image/jpeg' ? 'jpg' : type.slice('image/'.length);
  return { ok: true, part: { uri: image.uri, name: `profile.${ext}`, type } };
}
