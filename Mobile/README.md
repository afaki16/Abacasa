# Abacasa Mobile

Abacasa backend'ine bağlı React Native (iOS + Android) istemcisi. Kickstart'ın mobil iskeletinden
türetildi. Backend ve Frontend bu klasöre bağımlı değildir.

**Abacasa'ya özgü:**

- Backend mobil istemciyi `X-Client: mobile` başlığından tanır (Kickstart madde 26). Refresh token
  cookie'ye değil yanıt gövdesine yazılır, cihazda SecureStore'da durur.
- Giriş e-posta + şifreyle yapılır, hane girişte seçilmez. Son aktif hane açılır, ana sayfadan
  değiştirilir (`POST /api/Auth/switch-household`, yeni token çifti döner).
- Kayıtta hane adı ile Kullanım koşulları ve Aydınlatma metni onayı zorunludur.
- Yasal metin sürümü artınca kullanıcı girişten sonra `consents` ekranında yeniden onaylar (kök
  layout guard'ı). Metinler web uygulamasında açılır (`EXPO_PUBLIC_WEB_URL` + `/legal/...`).

**Yığın:** Expo SDK 58 · React Native 0.88 · TypeScript · Expo Router · TanStack Query · Zustand ·
axios · react-hook-form + zod · expo-secure-store · FlashList · Jest + RNTL · EAS Build/Update ·
Sentry (opsiyonel)

## Çalıştırma

Gereksinimler: Node 22.13+, Android Studio (emulator) ve/veya Xcode (yalnızca macOS).

```bash
npm ci
# .env.development oluştur (aşağıdaki "Ortam değişkenleri")
npm run android    # ilk kez / native paket eklenince: development build derler ve kurar
npm start          # sonraki seferler: yalnızca Metro (dev build zaten cihazda)
```

Backend `http://localhost:5166` üzerinde `--launch-profile http` ile çalışmalı.

- **Android emulator:** `localhost` otomatik olarak `10.0.2.2`'ye çevrilir.
- **Fiziksel cihaz:** Metro'nun LAN IP'si kullanılır. Cihaz aynı Wi-Fi'da olmalı ve backend
  `0.0.0.0`'ı dinlemeli.

Proje Expo Go'yu değil **development build**'i (`expo-dev-client`) hedefler.

- **Windows:** `JAVA_HOME` olarak Android Studio'nun `jbr` klasörü ayarlanmalı. Kayıt defterinde
  `LongPathsEnabled=1` açık olmalı. SDK'da CMake 3.31.6 kurulu olmalı (SDK Manager → SDK Tools →
  CMake). `plugins/withAndroidCmakeVersion.js` bu sürümü tüm native modüllere uygular. Varsayılan
  3.22.1, uzun C++ yollarında `ninja: error: mkdir(...)` hatası verir.
- **Port çakışması:** Backend'i başka bir portta
  açtıysan URL'i ver ve Metro'yu temiz başlat:

  ```bash
  EXPO_PUBLIC_API_URL=http://localhost:<port> npx expo start --dev-client --clear
  ```

## Ortam değişkenleri

`Mobile/.env.development` (git'e girmez):

```bash
# EXPO_PUBLIC_* değerleri uygulama paketine GÖMÜLÜR — gizli anahtar asla buraya girmez.
EXPO_PUBLIC_API_URL=http://localhost:5166
# Yasal metin sayfaları (web uygulaması)
EXPO_PUBLIC_WEB_URL=http://localhost:3010
# development | staging | production
EXPO_PUBLIC_APP_ENV=development
```

`development` dışındaki ortamlarda `EXPO_PUBLIC_API_URL` HTTPS değilse `app.config.ts` build'i
durdurur. Env değişince Metro yeniden başlatılmalıdır (`npm start -- --clear`). SDK 58 yalnızca
`.env`, `.env.local`, `.env.development` ve `.env.production` (ve bunların `.local` sürümlerini)
okur.

**Opsiyonel servisler.** Hepsi boşsa kapalıdır; hesap bağlamadan build alınabilir.

| Değişken | Ne işe yarar | Nerede durur |
|---|---|---|
| `EAS_PROJECT_ID` | OTA güncellemeleri açar (`eas init` sonrası proje ID'si) | eas.json `env` veya EAS ortam değişkeni |
| `EXPO_PUBLIC_SENTRY_DSN` | Hata raporlamayı açar (DSN public'tir) | EAS ortam değişkeni (plaintext) |
| `SENTRY_ORG`, `SENTRY_PROJECT` | Kaynak harita yüklemesinin hedefi | EAS ortam değişkeni |
| `SENTRY_AUTH_TOKEN` | Kaynak harita yüklemesi; yoksa yükleme atlanır, build düşmez | **EAS secret** (asla repoya/pakete değil) |

## Kontrol

```bash
npm run check      # lint + typecheck + test — her değişiklikten sonra (CI da bunu çalıştırır)
npm test           # yalnızca testler (npm run test:watch: izleme modu)
npm run doctor     # Expo bağımlılık/config teşhisi
```

**Testler.** Jest (`jest-expo` preset) ve React Native Testing Library kullanılır. Testler kodun
yanında, `__tests__/` klasörlerinde durur. Örnekler:

- `lib/api/__tests__/refreshInterceptor.test.ts`: refresh akışı. Eşzamanlı 401'ler tek refresh;
  ağ hatası oturumu korur; sunucu reddi oturumu kapatır.
- `stores/__tests__/authStore.test.ts`: saklama, rehydrate, yazma hatasında hayalet oturum olmaması.
- `components/ui/__tests__/OptionCards.test.tsx`: bileşen testi (rol ve erişilebilir ad ile sorgu).

Notlar:

- Native modüllerin sahteleri `jest.setup.ts`'te; SecureStore bellek içi çalışır.
- RNTL v14'te `render`, `rerender` ve `fireEvent` asenkrondur; hepsi `await` edilir.
- CI: `.github/workflows/mobile.yml` yalnızca `Mobile/` değişince `npm ci` + lint + typecheck + test
  çalıştırır.

## Yayın (EAS Build / Update)

İlk kurulum, proje başına bir kez:

```bash
npm i -g eas-cli && eas login
eas init                                  # Expo projesi oluşturur → çıkan proje ID'sini EAS_PROJECT_ID yap
eas env:set --name EXPO_PUBLIC_API_URL --value https://api.ornek.com --environment production --visibility plaintext
eas env:set --name EXPO_PUBLIC_API_URL --value https://staging-api.ornek.com --environment preview --visibility plaintext
```

| Profil (`eas.json`) | Ne için | Komut |
|---|---|---|
| `development` | Geliştirme build'i (dev client), ekipte paylaşılır | `eas build --profile development --platform android` |
| `preview` | Test (staging API), mağazasız dağıtım | `eas build --profile preview` |
| `production` | Mağaza; build numarası otomatik artar (`appVersionSource: remote`) | `eas build --profile production` → `eas submit` |

**OTA (JS güncellemesi, mağazasız):**

```bash
eas update --channel production --environment production --message "…"
```

- Uygulama açılışta güncellemeyi indirir ve bir sonraki açılışta uygular (`checkAutomatically: ON_LOAD`).
- `runtimeVersion: appVersion`: aynı `version`'daki build'ler aynı güncellemeyi alır. **Native kod
  değişince** (yeni native paket, SDK yükseltmesi, config plugin) `app.config.ts`'teki `version`'ı
  artır ve yeni build al. Native değişikliği OTA ile gönderme.
- Development build'de OTA çalışmaz; kod hep Metro'dan gelir. Test için `preview` build kullan.

**Sentry:**

- DSN verilince `src/lib/monitoring/sentry.ts` başlar.
- Yakalanmamış JS hataları ve native çökmeler raporlanır.
- Beklenen API hataları (4xx, ağ kopması) gönderilmez.
- Kişisel veri gönderilmez; kullanıcı yalnızca sayısal id ile işaretlenir.

## Yapı

```
src/
├── app/                      # Expo Router — her dosya bir ekran
│   ├── _layout.tsx           # splash, rehydrate, Provider'lar, Stack.Protected guard'ları
│   ├── (auth)/               # girişsiz: login, register, verify-email, forgot-password
│   ├── (app)/                # girişli — yeni modüller buraya
│   │   ├── (tabs)/           # alt sekmeler: index (Özet), expenses, add (yuva; Ekle sayfasını açar), recurring, more (Diğer)
│   │   ├── profile, account, change-password, sessions   # sekmelerin üstüne açılan, StackHeader başlıklı ekranlar
│   │   └── users/            # ÖRNEK MODÜL: liste, [id] detay, new, [id]/edit
│   └── force-change-password.tsx
├── components/ui/            # UI kiti (aşağıda "UI kiti")
├── components/navigation/    # TabBar, HouseholdBar (HaneBar), StackHeader (StackBar)
├── constants/theme.ts        # renk / boşluk / yazı token'ları
├── features/<modül>/         # api.ts, hooks.ts, types.ts, constants.ts, components/ (modül başına)
│   ├── auth/                 # + validation.ts, RequirePermission
│   ├── shell/                # TabScreen (sekme kabı), AddSheet (Ekle alttan sayfası)
│   └── users/                # ÖRNEK MODÜL — yeni modül için şablon
├── hooks/                    # modülden bağımsız hook'lar (useCooldown, useDebouncedValue)
├── lib/
│   ├── monitoring/           # Sentry (tek erişim noktası; DSN yoksa kapalı)
│   ├── api/                  # axios client, refresh interceptor, hata tipi, queryClient
│   ├── config/env.ts         # TEK env okuma noktası
│   └── storage/              # secureStorage (token + kullanıcı)
└── stores/                   # authStore (oturumun tek doğruluk kaynağı), preferencesStore, toastStore
plugins/                      # Expo config plugin'leri (native ayar — android/ ios/ elle düzenlenmez)
```

## UI kiti

Tasarım kaynağı Claude Design bileşen sayfasıdır (Bilesenler). Renkler `constants/theme.ts` token'larından
(açık + koyu), yazı Inter (`Typography`: amountLarge, h1, h2, section, bodyStrong, body, label, caption), ikonlar
`Icon` (MaterialIcons; tasarımdaki Material Symbols adı kebab-case). Tutarlar `<Text tabular>` ve sağa hizalı.

- **Text, Icon, Button** (primary · secondary · ghost · destructive · danger), **Card**, **Screen**: her ekranın temeli.
- **TextField / FormField** form alanı; **AmountField** tutar (hero: hızlı giriş, inline: form) + **CurrencyPickerSheet**.
- **DatePickerSheet** tarih, **SelectSheet** aranabilir seçim (+ "yeni ekle"), **SegmentedControl** 2–4 kısa seçenek,
  **OptionCards** açıklamalı seçenekler, **Chip** filtre/hızlı seçim, **Switch / SwitchCard**, **Checkbox**.
- **ListItem** (menu: Diğer satırı · record: kayıt satırı, tutar sağda) ve **SwipeableRow** (Düzenle/Sil yalnızca izin varsa verilir).
- **SummaryCard** (ana renk dolgulu dönem toplamı, ekranda bir tane) ve **StatCard** (beyaz kart, turkuaz/ana renk vurgu + ilerleme).
- **Badge**: durum metinle (paid, pending, overdue, admin, member, info, neutral).
- **BottomSheet** tek birincil eylemli alttan sayfa; **ConfirmDialog** silme/çıkış onayı.
- Durumlar: liste yüklenirken **SkeletonList**, **EmptyState**, **ErrorState** (StateView bunların ince sarmalayıcısı),
  **OfflineBanner** (sekme kabında hazır).
- Geri bildirim: `toast.success / error / info(mesaj, { action })` (`stores/toastStore`; ToastHost kök layout'ta).

## Yeni modül eklemek

Adım adım rehber: **[MODULE_CREATION_GUIDE.md](MODULE_CREATION_GUIDE.md)** (web'deki
`Frontend/PAGE_CREATION_GUIDE.md`'nin karşılığı). Referans, hazır Kullanıcılar modülüdür.

## Kurallar

- **Navigasyon:** Yönlendirmeyi guard'lar yapar. Ekranlar login, logout veya şifre değişiminden
  sonra `router.replace` çağırmaz; store değişince `Stack.Protected` doğru ekrana geçer.
- **API:** Uygulama kodu axios'u doğrudan kullanmaz. `@/lib/api` içindeki `apiGet`, `apiPost`,
  `apiPut` ve `apiSend` kullanılır. Tüm hatalar `ApiError` olarak gelir:
  - `status`, `code` (backend `ErrorCode` sayısı), `fieldErrors`, `messages`
  - `status 0` ağ hatası demektir.
- **Anonim uçlar** `{ _skipAuth: true }` ile çağrılır. Böylece token eklenmez ve 401 refresh
  akışını tetiklemez.
- **Hata kodları:** Backend'e `ErrorCode` eklenince `src/lib/api/errors.ts` içindeki ayna da
  güncellenir.
- **Saklama:** Token'lar ve minimum kullanıcı bilgisi yalnızca SecureStore'da tutulur
  (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`, yedeğe girmez). Roller ve yetkiler cihaza yazılmaz;
  açılışta `/me` ile gelir.
- **Yetki:** `features/auth/permissions.ts` yalnızca arayüz kararı içindir; asıl kontrol
  backend'dedir. Kanonik ad `permission.name`'dir.
- **Önbellek:** Hesap değişince TanStack Query önbelleği sıfırlanır. Sorgu anahtarları modül
  başına bir factory'den üretilir:
  ```ts
  export const userKeys = { all: ['users'] as const, detail: (id) => [...userKeys.all, id] };
  ```
- **UI:** Ekranlar yalnızca `components/ui` kitini ve `constants/theme` token'larını kullanır.
  RN'nin `Text`'i ve sabit renk yazılmaz. Formlarda etiket alanın üstünde durur (web standardıyla
  aynı).
- **Formlar:** react-hook-form + zod ve `FormField`. Alanlar `Card` bölümlerinde gruplanır (web'deki
  bölümlü kartlar).
  - Klavyedeki "ileri" tuşu sonraki alana geçer:
    ```tsx
    <FormField name="email" {...next(() => setFocus('password'))} />
    ```
  - Son alanda `returnKeyType="go"` ve `onSubmitEditing={submit}` kullanılır.
  - `handleSubmit` RN olayıyla çağrılmaz: `const submit = () => handleSubmit(fn)();`
  - Şifre kuralı ve diğer şemalar `features/auth/validation.ts`'te; backend kurallarının aynasıdır.
- **Uyarı ve onaylar:** Yıkıcı işlemler (çıkış, oturum kapatma) `Alert.alert` ile onaylanır.
- **Klavye:** Form ekranlarında `<Screen scroll>` kullanılır (react-native-keyboard-controller).
  RN'nin `KeyboardAvoidingView`'i kullanılmaz.
- **Native klasörler:** `android/` ve `ios/` üretilir (CNG) ve git'e girmez. Native ayarlar
  `app.config.ts` ve config plugin'lerinden yapılır.

## Sorun giderme

- **Kod değişikliği cihaza yansımıyor (Windows):** Metro'nun dosya izleyicisi değişiklikleri
  kaçırıp eski dönüşüm önbelleğini sunabiliyor. Metro'yu kapatıp `npm start -- --clear` ile
  yeniden başlat.
- **Yeni route eklendi, `npm run typecheck` "not assignable to Href" diyor:** Yazılı route tipleri
  (`.expo/types`) `npm start` sırasında yeniden üretilir. Metro'yu bir kez başlat, sonra tekrar
  dene.

## Yayın öncesi kontrol listesi

- [ ] `app.config.ts`: `name`, `bundleIdentifier`, `package` (mağazaya çıktıktan sonra
      değiştirilemez), ikonlar, splash
- [ ] Production `EXPO_PUBLIC_API_URL` HTTPS (EAS ortam değişkeni)
- [ ] Backend'de mobil için refresh süresi (`JwtSettings:RefreshTokenExpiryInDaysRememberMe`)
- [ ] `eas init` yapıldı, `EAS_PROJECT_ID` verildi (OTA istiyorsan)
- [ ] Sentry DSN + `SENTRY_AUTH_TOKEN` (secret) tanımlı (hata raporu istiyorsan)
- [ ] `preview` build'i gerçek cihazda denendi: giriş, refresh, çıkış, OTA güncellemesi
- [ ] Örnek Kullanıcılar modülü ihtiyaç değilse kaldırıldı (`MODULE_CREATION_GUIDE.md` başı)
