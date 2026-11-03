<template>
  <LegalDocument title="Kişisel Verilerin İşlenmesine İlişkin Aydınlatma Metni" :version="version">
    <h2>1. Veri sorumlusu</h2>
    <p>
      6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca kişisel verileriniz, veri sorumlusu sıfatıyla
      {{ legal.controllerName }} tarafından bu metinde açıklanan kapsamda işlenir. Adres: {{ legal.address }}. E-posta:
      {{ legal.contactEmail }}.
    </p>

    <h2>2. İşlenen kişisel veriler</h2>
    <ul>
      <li><strong>Kimlik:</strong> ad, soyad.</li>
      <li><strong>İletişim:</strong> e-posta adresi, telefon numarası (isteğe bağlı).</li>
      <li>
        <strong>Müşteri işlem:</strong> uygulamaya girdiğiniz bütçe kayıtları (harcamalar, gelirler, sabit ödemeler, borçlar,
        bağışlar, emanetler, araç ve plaka bilgileri) ile hanenizde tanımladığınız kişilerin adları ve yakınlık bilgileri.
      </li>
      <li><strong>İşlem güvenliği:</strong> giriş kayıtları, IP adresi, oturum bilgileri, şifrelenmiş parola.</li>
      <li>
        <strong>Hukuki işlem:</strong> kullanım koşullarını kabul ettiğinize ve bu metni okuduğunuza ilişkin kayıtlar.
      </li>
    </ul>
    <p>
      Hanenize başka kişilere (örneğin aile üyelerinize) ait bilgi girdiğinizde bu kişileri bilgilendirmek sizin
      sorumluluğunuzdadır.
    </p>

    <h2>3. İşleme amaçları</h2>
    <ul>
      <li>Hesabınızın oluşturulması ve hizmetin sunulması.</li>
      <li>Hane üyeleriyle ortak bütçe takibinin sağlanması.</li>
      <li>Hesap ve sistem güvenliğinin sağlanması, kötüye kullanımın önlenmesi.</li>
      <li>E-posta doğrulama, parola sıfırlama ve davet gibi hizmet bildirimlerinin gönderilmesi.</li>
      <li>Mevzuattan doğan yükümlülüklerin yerine getirilmesi.</li>
    </ul>

    <h2>4. Hukuki sebepler</h2>
    <p>Kişisel verileriniz KVKK'nın 5. maddesinin 2. fıkrasındaki şu sebeplere dayanılarak işlenir:</p>
    <ul>
      <li>(c) bendi: bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması (hizmetin sunulması).</li>
      <li>(ç) bendi: veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi.</li>
      <li>
        (f) bendi: temel hak ve özgürlüklerinize zarar vermemek kaydıyla veri sorumlusunun meşru menfaati (güvenlik
        kayıtları).
      </li>
    </ul>

    <h2>5. Aktarım</h2>
    <p>Kişisel verileriniz şu alıcılara aktarılabilir:</p>
    <ul>
      <li>Üyesi olduğunuz hanenin diğer üyeleri, o hanenin kayıtları kapsamında.</li>
      <li>Türkiye'deki barındırma (sunucu) hizmet sağlayıcısı.</li>
      <li>E-posta gönderimi için {{ legal.emailProvider }}.</li>
      <li>Talep hâlinde yetkili kamu kurum ve kuruluşları.</li>
    </ul>

    <h2>6. Toplama yöntemi</h2>
    <p>
      Kişisel verileriniz, uygulamaya kayıt olurken ve uygulamayı kullanırken girdiğiniz bilgiler ile sistem kayıtları
      aracılığıyla elektronik ortamda toplanır.
    </p>

    <h2>7. Saklama ve imha</h2>
    <ul>
      <li>Kişisel verileriniz hesabınız açık olduğu sürece saklanır.</li>
      <li>Sildiğiniz kayıtlar 30 gün içinde kalıcı olarak silinir.</li>
      <li>
        Hesabınızı sildiğinizde kişisel bilgileriniz anonimleştirilir. Tek üyesi olduğunuz haneler bütün verileriyle
        silinir.
      </li>
      <li>
        Giriş denemesi kayıtları 90 gün saklanır. Oturum ve doğrulama kayıtları, süreleri dolduktan 30 gün sonra silinir.
      </li>
    </ul>

    <h2>8. Haklarınız</h2>
    <p>KVKK'nın 11. maddesi uyarınca şu haklara sahipsiniz:</p>
    <ul>
      <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme.</li>
      <li>İşlenmişse buna ilişkin bilgi talep etme.</li>
      <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme.</li>
      <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme.</li>
      <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme.</li>
      <li>Silinmesini veya yok edilmesini isteme.</li>
      <li>Bu işlemlerin, verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme.</li>
      <li>
        Münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme.
      </li>
      <li>Kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme.</li>
    </ul>
    <p>
      Profil sayfanızdan verilerinizi indirebilir, bilgilerinizi düzeltebilir ve hesabınızı silebilirsiniz. Diğer
      talepleriniz için {{ legal.contactEmail }} adresine yazabilirsiniz. Başvurular en geç 30 gün içinde sonuçlandırılır.
    </p>
  </LegalDocument>
</template>

<script setup lang="ts">
import LegalDocument from '~/components/Legal/LegalDocument.vue'
import { legal } from '~/utils/legal'

// Herkese açık (auth.global'de serbest); giriş sayfası gibi yalın düzen
definePageMeta({ layout: false })
useHead({ title: 'Aydınlatma metni - Abacasa' })

const { getVersions } = useLegal()
const version = ref<string | null>(null)

onMounted(async () => {
  version.value = (await getVersions())?.privacyNoticeVersion ?? null
})
</script>
