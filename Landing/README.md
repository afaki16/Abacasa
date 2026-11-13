# Abacasa tanıtım sayfası (abacasa.com)

Derleme gerektirmeyen statik site: `index.html`, `styles.css`, `main.js`, `assets/`. Klasör olduğu gibi herhangi bir
statik sunucuya (Nginx, Caddy, Cloudflare Pages…) konur.

- **Dil:** Türkçe metin HTML'dedir; İngilizce `main.js` içindeki `EN` sözlüğündedir. Yeni metin eklerken öğeye
  `data-i18n="anahtar"` (öznitelik için `data-i18n-attr="content:anahtar"`) ver ve anahtarı `EN`'e ekle.
  Seçim sırası: `?lang=en|tr` → kayıtlı tercih → tarayıcı dili.
- **Uygulama bağlantıları:** `data-app="/yol"` taşıyan bağlantılar `main.js`'teki `APP_URL`
  (`https://app.abacasa.com`) ile kurulur. Web uygulamasının adresi değişirse yalnızca orayı güncelle.
- **Mağaza rozetleri:** Uygulamalar yayınlanınca `index.html`'deki "Yakında" rozetlerini mağaza bağlantılarıyla değiştir.
- **Yazı tipi:** Inter, yerel dosyalardan (`assets/fonts`, SIL OFL lisansı `OFL.txt`); dış kaynağa istek atılmaz.

Yerelde bakmak için: `npx serve Landing` ya da herhangi bir statik sunucu.
