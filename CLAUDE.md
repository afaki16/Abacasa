# Abacasa
Çok haneli ev bütçesi uygulaması: harcama, sabit ödeme, borç, bağış. Her hane bir tenant'tır.

## Çalışma kuralları
- Sadece istenen değişikliği yap; ekstra geliştirme veya refactor yapma.
- Backend değişikliğinden sonra Backend klasöründe `dotnet build` çalıştır ve hatasız olduğunu doğrula.
- Frontend değişikliğinden sonra Frontend klasöründe `npm run build` çalıştır.
- Git işlemi (commit, branch, push, stash) yapma; bunları kullanıcı yönetiyor.
- Demo hanesinde (demo-admin) kalıcı örnek veri var; testler ona dokunmaz, yalnızca 'Test' ile başlayan kayıtları kullanır ve siler.

## Yapı
- .NET 10 Clean Architecture (API / Application / Domain / Infrastructure), Nuxt 3 SPA (ssr: false), PostgreSQL.
- Yeni entity için Backend/ENTITY_CREATION_GUIDE.md, yeni sayfa için Frontend/PAGE_CREATION_GUIDE.md.
- Yerel portlar: API http://localhost:5166, frontend http://localhost:3010.
- Sayfa route'u, izin adının kebab-case hali olmalı (PaymentMethods → /payment-methods). BaseDataTable ekle/düzenle/sil butonlarının izinlerini route'tan üretir.

## Alan kuralları
- Para tutarları decimal(18,2), kurlar decimal(18,4). İş tarihleri DateOnly.
- Para birimleri TRY ve USD. Döviz ödemede kur elle girilir, TL tutar hesaplanır.
- Toplamlar saklanmaz, kayıtlardan hesaplanır.
- Hane verisi entity'leri ITenantScoped'ı uygular. Tenant filtresi ve TenantId ataması ApplicationDbContext'te otomatiktir; handler'larda TenantId ile elle filtreleme ya da atama yapma.
- Para gösterimi için useMoney().formatMoney kullan, useUtils.formatCurrency kullanma.
- Hane verisinde Update ve Delete'ten önce kayıt her zaman repository ile yüklenir (filtre uygulanır). İstekten gelen Id ile yeni entity oluşturup Update çağrılmaz.
- İstekle gelen her referans (ör. OwnerPersonId) handler'da repository ile yüklenerek doğrulanır; bulunamazsa doğrulama hatası döner. Böylece başka hanenin kaydına bağlanılamaz.
- Başka kayıtların bağlı olduğu bir tanım silinemez; 409 ve "kullanımda" mesajı döner. Ödeme aracı silinmek yerine pasif yapılabilir.
- Bağışlar harcama özetine girmez; birleşik toplam Özet sayfasında.
- Sabit ödemede ödenme durumu saklanmaz; (RecurringPaymentId, RecurringPaymentMonth) ile bağlı canlı harcama/bağış kaydından hesaplanır.
- Borç alma ve geri ödeme dönem harcamasına girmez. Döviz ödemede kur elle girilir. Açık dövizin TL karşılığı en son tarihli kurla hesaplanır.
- Özet: dönem toplamı = gerçekleşen harcama + bağış + ödenmemiş sabit ödeme vadesi; yemek kartı ve borç hareketleri hariç.
- Yıllık tablo: gelirler elle; gider tarafı otomatik (plan ödemeleri vade ayına, plan dışı harcama ve bağışlar kayıt tarihine göre), yemek kartı hariç.
- Emanetten dağıtılan bağış (FundId) hiçbir toplama ve hedefe girmez, emanetle aynı türde olur; emanette elde = kalan − kullanımda, sıfırın altına düşemez.
- Araç işlemi harcama oluşturduysa tarih/tutar değişikliği ve silme harcamaya yansır; tersi yansımaz. Araç hatırlatmaları yalnızca listede, hiçbir toplama girmez.
