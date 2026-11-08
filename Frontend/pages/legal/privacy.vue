<template>
  <LegalDocument :title="$t('legal.privacy.title')" :version="version">
    <template v-if="locale === 'en'">
    <p><em>This is an English translation for convenience. The Turkish version is the binding text.</em></p>

    <h2>1. Data controller</h2>
    <p>
      Under Turkish Personal Data Protection Law No. 6698 ("KVKK"), your personal data is processed by
      {{ legal.controllerName }}, acting as data controller, within the scope described in this notice. Address:
      {{ legal.address }}. Email: {{ legal.contactEmail }}.
    </p>

    <h2>2. Personal data processed</h2>
    <ul>
      <li><strong>Identity:</strong> first name, last name.</li>
      <li><strong>Contact:</strong> email address, phone number (optional).</li>
      <li>
        <strong>Customer transactions:</strong> the budget records you enter in the app (expenses, income, recurring payments,
        debts, donations, donation funds, vehicle and licence plate details), and the names and relations of the people you
        add to your household.
      </li>
      <li><strong>Transaction security:</strong> sign-in records, IP address, session details, hashed password.</li>
      <li>
        <strong>Legal transactions:</strong> records showing that you accepted the terms of use and read this notice.
      </li>
    </ul>
    <p>
      When you enter information about other people in your household (for example, family members), you are responsible for
      informing them.
    </p>

    <h2>3. Purposes of processing</h2>
    <ul>
      <li>Creating your account and providing the service.</li>
      <li>Enabling shared budget tracking with household members.</li>
      <li>Keeping your account and the system secure and preventing misuse.</li>
      <li>Sending service notifications such as email verification, password reset and invitations.</li>
      <li>Meeting legal obligations.</li>
    </ul>

    <h2>4. Legal grounds</h2>
    <p>Your personal data is processed on the following grounds under Article 5(2) of the KVKK:</p>
    <ul>
      <li>Subparagraph (c): it is directly necessary for entering into or performing a contract (providing the service).</li>
      <li>Subparagraph (ç): it is necessary for the data controller to meet a legal obligation.</li>
      <li>
        Subparagraph (f): the data controller's legitimate interest, provided it does not harm your fundamental rights and
        freedoms (security records).
      </li>
    </ul>

    <h2>5. Transfers</h2>
    <p>Your personal data may be shared with the following recipients:</p>
    <ul>
      <li>Other members of the households you belong to, within the scope of that household's records.</li>
      <li>The hosting (server) provider in Türkiye.</li>
      <li>{{ legal.emailProvider }}, for sending emails.</li>
      <li>Authorised public institutions, upon request.</li>
    </ul>
    <p>
      Because the servers of {{ legal.emailProvider }}, which is used for sending emails, are located outside Türkiye, your
      email address and the content of the emails sent to you are transferred abroad in accordance with Article 9 of the KVKK.
    </p>

    <h2>6. Collection method</h2>
    <p>
      Your personal data is collected electronically, through the information you enter when you register and use the app,
      and through system records.
    </p>

    <h2>7. Retention and deletion</h2>
    <ul>
      <li>Your personal data is kept for as long as your account is open.</li>
      <li>Records you delete are permanently erased within 30 days.</li>
      <li>
        When you delete your account, your personal details are anonymised. Households where you are the only member are
        deleted with all their data.
      </li>
      <li>
        Sign-in attempt records are kept for 90 days. Session and verification records are deleted 30 days after they expire.
      </li>
    </ul>

    <h2>8. Your rights</h2>
    <p>Under Article 11 of the KVKK, you have the right to:</p>
    <ul>
      <li>Find out whether your personal data is processed.</li>
      <li>Request information about it if it has been processed.</li>
      <li>Find out the purpose of processing and whether it is used for that purpose.</li>
      <li>Know the third parties, in Türkiye or abroad, to whom it is transferred.</li>
      <li>Ask for it to be corrected if it is incomplete or inaccurate.</li>
      <li>Ask for it to be deleted or destroyed.</li>
      <li>Ask for these actions to be notified to the third parties to whom the data was transferred.</li>
      <li>Object to an outcome against you that results from analysis carried out solely by automated systems.</li>
      <li>Claim compensation if you suffer damage because of unlawful processing.</li>
    </ul>
    <p>
      From your profile page you can download your data, correct your details and delete your account. For other requests,
      write to {{ legal.contactEmail }}. Requests are answered within 30 days at the latest.
    </p>
    </template>

    <template v-else>
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
    <p>
      E-posta gönderimi için kullanılan {{ legal.emailProvider }} hizmetinin sunucuları yurt dışında bulunduğundan, e-posta
      adresiniz ve size gönderilen e-postaların içeriği KVKK'nın 9. maddesine uygun olarak yurt dışına aktarılır.
    </p>

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
    </template>
  </LegalDocument>
</template>

<script setup lang="ts">
import LegalDocument from '~/components/Legal/LegalDocument.vue'
import { legal } from '~/utils/legal'

// Herkese açık (auth.global'de serbest); giriş sayfası gibi yalın düzen
definePageMeta({ layout: false })
const { t, locale } = useI18n()
useHead({ title: computed(() => t('legal.privacy.pageTitle')) })

const { getVersions } = useLegal()
const version = ref<string | null>(null)

onMounted(async () => {
  version.value = (await getVersions())?.privacyNoticeVersion ?? null
})
</script>
