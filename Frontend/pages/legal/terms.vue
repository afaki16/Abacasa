<template>
  <LegalDocument title="Kullanım Koşulları" :version="version">
    <h2>1. Hizmet</h2>
    <p>
      Abacasa, hanelerin harcama, gelir, sabit ödeme, borç ve bağış kayıtlarını tutmasını sağlayan bir bütçe uygulamasıdır.
      Hizmet {{ legal.controllerName }} tarafından sunulur.
    </p>

    <h2>2. Hesap</h2>
    <p>
      Kayıt olurken doğru bilgi vermek ve parolanızı korumak sizin sorumluluğunuzdadır. Hesabınızla yapılan işlemlerden siz
      sorumlusunuz.
    </p>

    <h2>3. Haneler ve üyeler</h2>
    <p>
      Bir hanenin bütün kayıtlarını o hanenin bütün üyeleri görür. Hane yöneticisi üyeleri davet eder, rollerini belirler ve
      haneden çıkarabilir. Üyeleri ve davetleri yönetmek yöneticinin sorumluluğundadır.
    </p>

    <h2>4. İçerik</h2>
    <p>
      Girdiğiniz kayıtlar size aittir. Başka kişilere ait bilgi girerken onları bilgilendirmek sizin sorumluluğunuzdadır.
      Hukuka aykırı içerik girilemez.
    </p>

    <h2>5. Tavsiye niteliği yoktur</h2>
    <p>
      Uygulamadaki hesaplamalar ve özetler bilgilendirme amaçlıdır. Yatırım, vergi ya da hukuki tavsiye niteliği taşımaz.
      Döviz kurları kullanıcı tarafından girilir.
    </p>

    <h2>6. Değişiklikler</h2>
    <p>
      Hizmet geliştirilebilir, değiştirilebilir veya durdurulabilir. Bu koşullar değiştiğinde bir sonraki girişinizde onayınız
      istenir.
    </p>

    <h2>7. Hesabın kapatılması</h2>
    <p>
      Hesabınızı istediğiniz zaman profil sayfasından silebilirsiniz. Bu koşulları ihlal eden hesaplar kapatılabilir.
    </p>

    <h2>8. Sorumluluk</h2>
    <p>
      Hizmet olduğu gibi sunulur. Verilerinizi düzenli olarak indirmeniz önerilir. [Sorumluluğun sınırlandırılması hukukçuyla
      tamamlanacak.]
    </p>

    <h2>9. Uygulanacak hukuk</h2>
    <p>
      Bu koşullara Türkiye Cumhuriyeti hukuku uygulanır. [Yetkili mahkeme hukukçuyla belirlenecek.]
    </p>

    <h2>10. İletişim</h2>
    <p>{{ legal.contactEmail }}</p>
  </LegalDocument>
</template>

<script setup lang="ts">
import LegalDocument from '~/components/Legal/LegalDocument.vue'
import { legal } from '~/utils/legal'

// Herkese açık (auth.global'de serbest); giriş sayfası gibi yalın düzen
definePageMeta({ layout: false })
useHead({ title: 'Kullanım koşulları - Abacasa' })

const { getVersions } = useLegal()
const version = ref<string | null>(null)

onMounted(async () => {
  version.value = (await getVersions())?.termsVersion ?? null
})
</script>
