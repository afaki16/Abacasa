# Abacasa Mobile — Yeni Modül (CRUD) Oluşturma Rehberi

Bu rehber, mobil uygulamaya yeni bir CRUD modülü eklerken hangi dosyaları oluşturacağını ve hangi
mevcut dosyalara satır ekleyeceğini sırayla gösterir. Referans, hazır **Kullanıcılar** modülüdür
(`src/features/users`, `src/app/(app)/users`). Web karşılığı: `Frontend/PAGE_CREATION_GUIDE.md`.

Rehber boyunca `Product` örnek entity olarak kullanılır:

- `Product` → `SeninEntity` (PascalCase, tekil)
- `products` → klasör ve route adı (küçük harf, çoğul)
- Backend: `/api/Products`; yetkiler `Products.Read`, `Products.Create`, `Products.Update`, `Products.Delete`

> Örnek modül ihtiyacın yoksa silebilirsin:
> - `src/features/users/` ve `src/app/(app)/users/` klasörleri
> - `src/app/(app)/_layout.tsx` içindeki 4 `users/*` satırı
> - Profil'deki "Yönetim" kartı

---

## Adımlar (özet)

| # | Dosya | Aksiyon |
|---|-------|---------|
| 1 | `src/features/products/types.ts` | YENİ — backend DTO'larının aynası |
| 2 | `src/features/products/api.ts` | YENİ — uçlar (`apiGet` / `apiPost` / `apiPut` / `apiSend`) |
| 3 | `src/features/products/hooks.ts` | YENİ — sorgu anahtarları, sorgular, mutation'lar |
| 4 | `src/features/products/constants.ts` | YENİ — yetki adları, etiketler, seçenekler |
| 5 | `src/features/products/components/ProductForm.tsx` | YENİ — oluştur/düzenle ortak form |
| 6 | `src/app/(app)/products/index.tsx` | YENİ — liste |
| 7 | `src/app/(app)/products/[id]/index.tsx` | YENİ — detay |
| 8 | `src/app/(app)/products/new.tsx` ve `[id]/edit.tsx` | YENİ — form ekranları |
| 9 | `src/app/(app)/_layout.tsx` | SATIR EKLE — ekran başlıkları |
| 10 | Giriş noktası (sekme / profil menüsü / ana sayfa) | SATIR EKLE |

Bittiğinde `npm run check` çalıştır. Yeni route eklediğin için önce Metro'yu bir kez başlat; yazılı
route tipleri yenilenir (bkz. README → Sorun giderme).

---

## ADIM 1 — Tipler

Backend DTO'larını birebir yansıt. Enum'lar JSON'da string gelir (`"Active"`); hata kodları sayıdır.

```ts
// src/features/products/types.ts
export interface ProductListItem {
  id: number;
  name: string;
  price: number;
  isActive: boolean;
  createdDate: string;
}
export type ProductDetail = ProductListItem & { description: string | null };

export interface ProductListParams { searchTerm?: string }
export interface CreateProductRequest { name: string; description: string | null; price: number }
export interface UpdateProductRequest extends CreateProductRequest { id: number; isActive: boolean }
```

## ADIM 2 — API

Uygulama kodu axios'u doğrudan kullanmaz; `@/lib/api` yardımcıları Result zarfını açar ve her
hatayı `ApiError`'a çevirir. Sayfalı listeler `PagedResult<T>` döner
(`{ items, totalCount, totalPages, pageNumber }`).

```ts
// src/features/products/api.ts
import { apiGet, apiPost, apiPut, apiSend, DEFAULT_PAGE_SIZE, type PagedResult } from '@/lib/api';

export const productsApi = {
  list: (page: number, { searchTerm }: ProductListParams = {}) =>
    apiGet<PagedResult<ProductListItem>>('/api/Products', {
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      searchTerm: searchTerm?.trim() || undefined,
    }),
  get: (id: number) => apiGet<ProductDetail>(`/api/Products/${id}`),
  create: (r: CreateProductRequest) => apiPost<ProductDetail>('/api/Products', r),
  update: (r: UpdateProductRequest) => apiPut<ProductDetail>(`/api/Products/${r.id}`, r),
  remove: (id: number) => apiSend('delete', `/api/Products/${id}`),
};
```

- Veri dönmeyen uçlar (`{ success, message }`) için `apiSend` kullanılır.
- Uzun süren istekler için `{ timeout }` geçilir.

## ADIM 3 — Hook'lar (sorgu anahtarları + önbellek)

`src/features/users/hooks.ts` dosyasını kopyalayıp adları değiştir. Kurallar:

- **Hiyerarşik anahtarlar:** `all → lists → list(params)`, `details → detail(id)`.
  Mutation sonrası `invalidateQueries({ queryKey: productKeys.lists() })` her arama/filtre
  listesini tazeler.
- **Liste:** `useInfiniteQuery` ile `initialPageParam: 1` ve `getNextPageParam: getNextPage`.
- **Detay:** listeden gelindiyse `placeholderData` ile kaydı anında göster.
- **Mutation başarısı:**
  - oluştur/güncelle → `setQueryData(detail)` + listeleri geçersiz kıl.
  - sil → `removeQueries(detail)` + listeleri geçersiz kıl.
- Hesap değişince tüm önbellek zaten sıfırlanır (kök layout); modülde ayrıca bir şey yapma.

## ADIM 4 — Sabitler

```ts
// src/features/products/constants.ts
export const PRODUCT_PERMISSIONS = {
  READ: 'Products.Read',
  CREATE: 'Products.Create',
  UPDATE: 'Products.Update',
  DELETE: 'Products.Delete',
} as const;
```

Yetki adı backend'deki `PermissionDto.Name`'dir (`fullPermission` değil).

## ADIM 5 — Form (görünüm standardı)

Web'deki "Görünüm standardı"nın mobil karşılığı. **Zorunludur.**

| Web | Mobil |
|---|---|
| Bölümlü kartlar | `<Card title="…">` — alanları anlamlı bölümlere ayır (Kişisel bilgiler, İletişim…) |
| Etiket alanın üstünde | `FormField` / `TextField` (`label` prop'u) |
| Kart seçici | `OptionCards` — az seçenekli tekli/çoklu seçim (durum, roller) |
| Switch kartı | `SwitchCard` — açıklamalı açık/kapalı ayarı |

Kurallar:

- react-hook-form + zod. Şema form dosyasında; ortak kurallar `features/auth/validation.ts`'ten
  (`nameSchema`, `emailSchema`, `passwordSchema`, `phoneSchema`, `toNullable`).
- Metin alanları `FormField`. Kart seçici ve switch `Controller` ile bağlanır (bkz. `UserForm.tsx`).
- Alanlar arası geçiş: `{...next(() => setFocus('sonraki'))}`. Son alanda
  `returnKeyType="go"` + `onSubmitEditing={submit}`.
- `handleSubmit` RN olayıyla çağrılmaz: `const submit = () => handleSubmit(fn)();`
- Koşullu alan için `watch()` değil `useWatch({ control, name })` kullan (React Compiler uyumlu).
- Sunucu hataları formun üstünde `<FormError messages={mutation.error?.messages} />`.
- Oluştur ve düzenle **aynı** form bileşenini kullanır; fark prop'larla verilir (`user?`, `isSelf`).

## ADIM 6 — Liste ekranı

`src/app/(app)/users/index.tsx`'i kopyala. İçerdikleri:

- `RequirePermission` ile ekran düzeyinde yetki kapısı. Yetkiler `/me` gelene kadar yükleniyor
  gösterir.
- `SearchBar` + `useDebouncedValue` (yazarken her tuşta istek atılmaz).
- `FlashList` + `onEndReached` ile sonsuz kaydırma, `RefreshControl` ile aşağı çekip yenile.
- `StateView` ile yükleniyor / boş / hata durumları.
- Başlıkta "+" butonu yalnızca `useHasPermission(CREATE)` ise
  (`<Stack.Screen options={{ headerRight }} />`).

## ADIM 7–8 — Detay ve form ekranları

- **Detay:** `useLocalSearchParams` → `useXxx(id)`; bilgiler `Card` + `ListItem`. "Düzenle" ve
  "Sil" butonları yetkiye göre görünür. Silme `Alert.alert` ile onaylanır ve `variant="danger"`
  kullanılır.
- **Yeni:** başarıda `router.replace` ile detaya geçilir; geri tuşu listeye döner.
- **Düzenle:** başarıda `router.back()`.

Route'lar:

```
src/app/(app)/products/index.tsx        → /products
src/app/(app)/products/new.tsx          → /products/new
src/app/(app)/products/[id]/index.tsx   → /products/123
src/app/(app)/products/[id]/edit.tsx    → /products/123/edit
```

## ADIM 9 — Başlıklar

```tsx
// src/app/(app)/_layout.tsx
<Stack.Screen name="products/index" options={{ title: 'Ürünler' }} />
<Stack.Screen name="products/new" options={{ title: 'Yeni ürün' }} />
<Stack.Screen name="products/[id]/index" options={{ title: 'Ürün' }} />
<Stack.Screen name="products/[id]/edit" options={{ title: 'Ürünü düzenle' }} />
```

## ADIM 10 — Giriş noktası

Seçeneklerden birini kullan:

- **Sekme:** `src/app/(app)/(tabs)/` altına ekran ekle ve `(tabs)/_layout.tsx`'e `Tabs.Screen` tanımla.
- **Menü:** Profil'deki gibi `Card` + `ListItem`, yetkiye göre:
  `useHasPermission(PRODUCT_PERMISSIONS.READ) && …`

---

## Kontrol listesi

- [ ] Tipler backend DTO'larıyla birebir (enum'lar string, tarihler ISO string)
- [ ] API yalnızca `@/lib/api` yardımcılarıyla; uçlar modülün `api.ts`'inde
- [ ] Sorgu anahtarları hiyerarşik; mutation'lar ilgili listeleri geçersiz kılıyor
- [ ] Liste: arama debounce, sonsuz kaydırma, aşağı çek yenile, boş/hata durumu
- [ ] Form: bölümlü kartlar, etiket üstte, kart seçici/switch kartı, "ileri" zinciri, `FormError`
- [ ] Yetki: ekranlarda `RequirePermission`, butonlarda `useHasPermission`
- [ ] Yıkıcı işlemler onaylı ve `variant="danger"`
- [ ] Yalnızca `components/ui` kiti ve `constants/theme` token'ları (sabit renk yok, RN `Text` yok)
- [ ] `npm run check` temiz; emulator'de liste → detay → oluştur → düzenle → sil denendi

## Sık yapılan hatalar

| Hata | Doğrusu |
|---|---|
| `onPress={handleSubmit(fn)}` (tip hatası) | `onPress={() => handleSubmit(fn)()}` |
| `watch('alan')` (Compiler uyarısı) | `useWatch({ control, name: 'alan' })` |
| Yetkiyi `fullPermission` ile kontrol | `permission.name` (`hasPermission` bunu yapar) |
| Mutation sonrası liste eski kalıyor | `invalidateQueries({ queryKey: xKeys.lists() })` |
| Yeni route'ta "not assignable to Href" | Metro'yu bir kez başlat (tipler yenilenir) |
| Değişiklik cihaza yansımıyor (Windows) | Metro'yu `--clear` ile yeniden başlat |
| Kendi kaydında yasak alanı göndermek (403) | Formda `isSelf` ile gizle ve isteğe koyma |
