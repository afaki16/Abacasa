<template>
  <div class="space-y-md">
    <div class="bg-surface-container-lowest border border-solid border-outline-variant/[0.12] rounded-[24px] p-md shadow-sm">
      <h1 class="text-headline-md font-headline-md text-on-surface">UI kiti (geliştirici vitrini)</h1>
      <p class="text-body-sm text-on-surface-variant mt-1">
        Yalnızca geliştirme ortamında açılır. Projedeki bileşenler: <code>components/UI/Ui*.vue</code>
        (Vuetify'ın yerini aldı; API'leri v-btn, v-text-field… ile aynı mantıkta).
      </p>
    </div>

    <div class="kit">
      <section class="kit__cell">
        <h2 class="kit__title">UiBtn</h2>
        <div class="kit__row">
          <UiBtn color="primary">Kaydet</UiBtn>
          <UiBtn variant="outlined" color="primary" prepend-icon="mdi-plus">Ekle</UiBtn>
          <UiBtn variant="text" color="error">Sil</UiBtn>
          <UiBtn variant="tonal" color="primary" size="small">Tonal</UiBtn>
          <UiBtn color="primary" loading>Yük</UiBtn>
          <UiBtn color="primary" disabled>Pasif</UiBtn>
          <UiBtn icon="mdi-pencil" size="small" variant="text" />
        </div>
        <UiBtn size="large" color="primary" block>Büyük blok</UiBtn>
      </section>

      <section class="kit__cell">
        <h2 class="kit__title">UiForm + UiTextField</h2>
        <UiForm ref="uiForm" class="kit__col">
          <UiTextField v-model="text" label="Ad" prepend-inner-icon="mdi-account" required />
          <UiTextField v-model="empty" label="E-posta" prepend-inner-icon="mdi-email" :rules="[required]" />
          <UiTextField v-model="pw" label="Şifre" type="password" prepend-inner-icon="mdi-lock" append-inner-icon="mdi-eye" density="compact" hint="En az 8 karakter" persistent-hint />
          <UiTextField v-model="text" label="Eski görünüm (floating)" label-position="floating" />
          <UiTextField v-model="longText" label="Açıklama" multiline rows="2" auto-grow prepend-inner-icon="mdi-text" />
        </UiForm>
      </section>

      <section class="kit__cell">
        <h2 class="kit__title">UiSelect</h2>
        <div class="kit__col">
          <UiSelect v-model="sel" :items="options" item-title="label" item-value="value" label="Tenant" prepend-inner-icon="mdi-domain" clearable hide-details />
          <UiSelect v-model="sel2" :items="options" item-title="label" item-value="value" label="Aramalı" autocomplete clearable hide-details />
        </div>
      </section>

      <section class="kit__cell">
        <h2 class="kit__title">UiChip, UiIcon, UiAvatar, UiTooltip</h2>
        <div class="kit__row">
          <UiChip color="primary" size="small" prepend-icon="mdi-domain">Default</UiChip>
          <UiChip color="success" size="small">Aktif</UiChip>
          <UiChip color="error" size="x-small">Pasif</UiChip>
          <UiChip color="orange" variant="flat" size="small">Flat</UiChip>
          <UiIcon color="primary" :size="28" icon="mdi-shield-account" />
          <UiAvatar color="primary" variant="tonal" :size="32">AB</UiAvatar>
          <UiTooltip text="İpucu metni"><UiIcon icon="mdi-information-outline" :size="20" /></UiTooltip>
        </div>
      </section>

      <section class="kit__cell">
        <h2 class="kit__title">UiAlert, UiCheckbox, UiSwitch, ilerleme</h2>
        <UiAlert type="error" variant="tonal" density="compact">Bir şeyler ters gitti.</UiAlert>
        <div class="kit__row">
          <UiCheckbox v-model="check" label="Beni hatırla" color="primary" hide-details />
          <UiSwitch v-model="sw" color="primary" hide-details label="Anahtar" />
          <UiProgressCircular indeterminate color="primary" :size="20" :width="2" />
          <div style="width: 160px"><UiProgressLinear :model-value="40" color="primary" /></div>
        </div>
      </section>

      <section class="kit__cell">
        <h2 class="kit__title">UiTabs + UiWindow, tablo, UiDialog</h2>
        <UiTabs v-model="tab" color="primary" grow>
          <UiTab value="a" prepend-icon="mdi-shield-account-outline">Birinci</UiTab>
          <UiTab value="b" prepend-icon="mdi-shield-crown-outline">İkinci</UiTab>
        </UiTabs>
        <UiWindow v-model="tab">
          <UiWindowItem value="a"><p class="py-3">Birinci sekme içeriği</p></UiWindowItem>
          <UiWindowItem value="b"><p class="py-3">İkinci sekme içeriği</p></UiWindowItem>
        </UiWindow>
        <table class="ui-table ui-table--comfortable">
          <thead><tr><th>Kullanıcı</th><th>Oturum</th></tr></thead>
          <tbody><tr><td>Ali Veli</td><td>2</td></tr><tr><td>Ayşe</td><td>1</td></tr></tbody>
        </table>
        <UiBtn id="open-ui-dialog" @click="dialog = true">Pencere aç</UiBtn>
        <UiDialog v-model="dialog" max-width="420">
          <UiCard rounded="xl">
            <div class="ui-card-title">Başlık</div>
            <div class="ui-card-text">İçerik metni.</div>
            <div class="ui-card-actions">
              <div class="flex-1" />
              <UiBtn variant="text" @click="dialog = false">Kapat</UiBtn>
            </div>
          </UiCard>
        </UiDialog>
      </section>

      <section class="kit__cell">
        <h2 class="kit__title">UiMenu + .ui-list, UiBtnToggle</h2>
        <div class="kit__row">
          <UiMenu location="bottom start" min-width="220">
            <template #activator="{ props: menuProps, isActive }">
              <UiBtn v-bind="menuProps" variant="outlined" color="primary" :append-icon="isActive ? 'mdi-chevron-up' : 'mdi-chevron-down'">
                {{ menuChoice }}
              </UiBtn>
            </template>
            <div class="ui-list ui-list--compact">
              <button
                v-for="o in options"
                :key="o.value"
                type="button"
                role="menuitem"
                class="ui-list-item ui-list-item--link"
                :class="{ 'ui-list-item--active': menuChoice === o.label }"
                @click="menuChoice = o.label"
              >
                <span class="ui-list-item__prepend"><UiIcon icon="mdi-domain" :size="20" /></span>
                <span class="ui-list-item__content">
                  <span class="ui-list-title block">{{ o.label }}</span>
                  <span class="ui-list-subtitle block">#{{ o.value }}</span>
                </span>
                <span v-if="menuChoice === o.label" class="ui-list-item__append"><UiIcon icon="mdi-check" :size="20" color="success" /></span>
              </button>
              <hr class="ui-divider !my-1" />
              <div class="ui-list-item ui-list-item--disabled">
                <span class="ui-list-item__content ui-list-title">Pasif öğe</span>
              </div>
            </div>
          </UiMenu>
          <UiBtnToggle
            v-model="toggle"
            :items="[{ title: 'Takvim ayı', value: 'calendar' }, { title: 'Kart dönemi', value: 'statement' }, { title: 'Pasif', value: 'x', disabled: true }]"
            mandatory
            color="primary"
            density="comfortable"
            divided
          />
        </div>
        <ul class="ui-list">
          <li class="ui-list-item">
            <div class="ui-list-item__content"><div class="ui-list-title">Market</div></div>
            <span class="ui-list-item__append">1.250,00 ₺</span>
          </li>
          <li class="ui-list-item">
            <div class="ui-list-item__content">
              <div class="ui-list-title">Kredi kartı</div>
              <div class="ui-list-subtitle">Ödenen 500 · Bekleyen 750</div>
            </div>
            <span class="ui-list-item__append">750,00 ₺</span>
          </li>
        </ul>
        <div class="ui-row ui-row--dense ui-row--align-center">
          <div class="ui-col ui-col-12 ui-col-md-auto"><div class="kit__box">md="auto"</div></div>
          <div class="ui-col ui-col-12 ui-col-md-3"><div class="kit__box">md="3"</div></div>
          <div class="ui-col"><div class="kit__box">col</div></div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found', fatal: true })
}

definePageMeta({ title: 'UI kiti (dev)' })
useHead({ title: 'UI kiti (dev)' })

const text = ref('Ahmet')
const empty = ref('')
const pw = ref('gizli123')
const longText = ref('Birinci satır\nİkinci satır')
const sel = ref<number | null>(1)
const sel2 = ref<number | null>(null)
const check = ref(true)
const sw = ref(true)
const tab = ref('a')
const dialog = ref(false)
const menuChoice = ref('Default Tenant')
const toggle = ref('calendar')
const options = [{ label: 'Default Tenant', value: 1 }, { label: 'Demo Tenant', value: 2 }]
const required = (v: any) => !!v || 'Bu alan zorunludur'

const uiForm = ref<any>(null)
onMounted(() => uiForm.value?.validate())
</script>

<style scoped>
.kit { display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 16px; }
.kit__cell {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid rgb(var(--color-outline-variant));
  border-radius: 12px;
  background: rgb(var(--color-surface-container-lowest));
}
.kit__title { font-weight: 700; }
.kit__row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.kit__col { display: flex; flex-direction: column; gap: 4px; }
.kit__box { padding: 6px 10px; border-radius: 6px; background: rgb(var(--color-surface-container)); font-size: 0.8rem; }
</style>
