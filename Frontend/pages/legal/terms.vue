<template>
  <LegalDocument :title="$t('legal.terms.title')" :version="version">
    <template v-if="locale === 'en'">
    <p><em>This is an English translation for convenience. The Turkish version is the binding text.</em></p>

    <h2>1. The service</h2>
    <p>
      Abacasa is a budgeting app that lets households keep records of their expenses, income, recurring payments, debts and
      donations. The service is provided by {{ legal.controllerName }}.
    </p>

    <h2>2. Your account</h2>
    <p>
      You are responsible for giving accurate information when you register and for keeping your password safe. You are
      responsible for the actions taken with your account.
    </p>

    <h2>3. Households and members</h2>
    <p>
      All members of a household can see all of that household's records. The household administrator invites members, sets
      their roles and can remove them from the household. Managing members and invitations is the administrator's
      responsibility.
    </p>

    <h2>4. Content</h2>
    <p>
      The records you enter belong to you. When you enter information about other people, you are responsible for informing
      them. Unlawful content may not be entered.
    </p>

    <h2>5. Not advice</h2>
    <p>
      The calculations and summaries in the app are for information only. They are not investment, tax or legal advice.
      Exchange rates are entered by users.
    </p>

    <h2>6. Changes</h2>
    <p>
      The service may be developed, changed or discontinued. When these terms change, you will be asked to accept them the
      next time you sign in.
    </p>

    <h2>7. Closing your account</h2>
    <p>
      You can delete your account at any time from your profile page. Accounts that breach these terms may be closed.
    </p>

    <h2>8. Liability</h2>
    <p>
      The service is provided as is. We recommend that you download your data regularly. [The limitation of liability will be
      completed with a lawyer.]
    </p>

    <h2>9. Governing law</h2>
    <p>
      These terms are governed by the laws of the Republic of Türkiye. [The competent court will be determined with a lawyer.]
    </p>

    <h2>10. Contact</h2>
    <p>{{ legal.contactEmail }}</p>
    </template>

    <template v-else>
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
    </template>
  </LegalDocument>
</template>

<script setup lang="ts">
import LegalDocument from '~/components/Legal/LegalDocument.vue'
import { legal } from '~/utils/legal'

// Herkese açık (auth.global'de serbest); giriş sayfası gibi yalın düzen
definePageMeta({ layout: false })
const { t, locale } = useI18n()
useHead({ title: computed(() => t('legal.terms.pageTitle')) })

const { getVersions } = useLegal()
const version = ref<string | null>(null)

onMounted(async () => {
  version.value = (await getVersions())?.termsVersion ?? null
})
</script>
