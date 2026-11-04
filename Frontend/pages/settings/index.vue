<template>
  <div class="settings-page">
    <div class="mb-6">
      <BreadCrumb
        :items="[{ text: 'Ana Sayfa', to: '/dashboard' }, { text: 'Ayarlar' }]"
      />
    </div>

    <PageHero
      icon="mdi-cog-outline"
      title="Ayarlar"
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
        <UiIcon icon="mdi-shield-account-outline" :size="16" /> Tenant Ayarları
      </button>
      <button
        type="button"
        class="pill-tab"
        :class="{ 'pill-tab--active': activeTab === 'superadmin' }"
        @click="activeTab = 'superadmin'"
      >
        <UiIcon icon="mdi-shield-crown-outline" :size="16" /> Sistem Ayarları
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

useHead({
  title: "Ayarlar - Abacasa",
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
    ? "Tüm tenant'ları kapsayan oturum ve kullanıcı yönetimi"
    : "Kendi tenant'ınıza ait oturum ve kullanıcı yönetimi",
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
