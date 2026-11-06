<template>
  <div class="settings-page">
    <div class="mb-6">
      <BreadCrumb
        :items="[{ text: t('common.home'), to: '/dashboard' }, { text: t('settings.title') }]"
      />
    </div>

    <PageHero
      icon="mdi-cog-outline"
      :title="t('settings.title')"
      :subtitle="heroSubtitle"
    />

    <!-- Admin / SuperAdmin sekmeleri (yalnızca iki rol birden varsa) -->
    <nav v-if="hasMultipleTabs" class="pill-tabs">
      <button
        type="button"
        class="pill-tab"
        :class="{ 'pill-tab--active': activeTab === 'admin' }"
        @click="activeTab = 'admin'"
      >
        <UiIcon icon="mdi-shield-account-outline" :size="16" /> {{ t('settings.tabHouseholdSessions') }}
      </button>
      <button
        type="button"
        class="pill-tab"
        :class="{ 'pill-tab--active': activeTab === 'superadmin' }"
        @click="activeTab = 'superadmin'"
      >
        <UiIcon icon="mdi-shield-crown-outline" :size="16" /> {{ t('settings.tabSystem') }}
      </button>
    </nav>

    <SettingsAdminSection v-if="showAdminTab && activeTab === 'admin'" />
    <SettingsSuperAdminSection v-if="showSuperAdminTab && activeTab === 'superadmin'" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import BreadCrumb from "~/components/BreadCrumb.vue";
import SettingsAdminSection from "~/components/Settings/SettingsAdminSection.vue";
import SettingsSuperAdminSection from "~/components/Settings/SettingsSuperAdminSection.vue";

//#region Page Metadata
definePageMeta({
  title: "Ayarlar",
  requiresAuth: true,
  middleware: ["permission"],
  roles: ["Admin", "SuperAdmin"],
});

const { t } = useI18n();

useHead({
  title: computed(() => t("settings.pageTitle")),
});
//#endregion

//#region Auth & Tabs
const authStore = useAuthStore();

// Tenant Ayarları: sadece Admin rolü (SuperAdmin ayrı sekme; yoksa yanlışlıkla tenant-scope UI görünür)
const showAdminTab = computed(() => authStore.hasRole("Admin"));
const showSuperAdminTab = computed(() => authStore.hasRole("SuperAdmin"));

// Hem Admin hem SuperAdmin atanmış kullanıcıda iki sekme
const hasMultipleTabs = computed(
  () => showAdminTab.value && showSuperAdminTab.value,
);

const activeTab = ref<"admin" | "superadmin">("admin");

const heroSubtitle = computed(() =>
  activeTab.value === "superadmin"
    ? t("settings.heroSuperAdmin")
    : t("settings.heroAdmin"),
);

watch(
  [showAdminTab, showSuperAdminTab],
  ([admin, superAdmin]) => {
    if (superAdmin) activeTab.value = "superadmin";
    else if (admin) activeTab.value = "admin";
  },
  { immediate: true },
);
//#endregion
</script>

<style scoped>
.settings-page {
  max-width: 1080px;
  padding: 24px;
}
</style>
