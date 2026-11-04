<template>
  <div class="settings-container">
    <!-- Breadcrumb -->
    <div class="mb-6">
      <BreadCrumb
        :items="[{ text: 'Ana Sayfa', to: '/dashboard' }, { text: 'Ayarlar' }]"
      />
    </div>

    <!-- Page Header -->
    <div class="settings-header mb-8">
      <h1 class="settings-title">Ayarlar</h1>
      <p class="settings-subtitle">Sistem ve tenant ayarlarını yönetin</p>
    </div>

    <!-- Tabs: Admin / SuperAdmin (sadece her iki rol varsa göster) -->
    <UiCard class="settings-card" elevation="2">
      <template v-if="hasMultipleTabs">
        <UiTabs
          v-model="activeTab"
          bg-color="transparent"
          color="primary"
          grow
          class="settings-tabs"
        >
          <UiTab value="admin" prepend-icon="mdi-shield-account-outline">
            Admin Ayarları
          </UiTab>
          <UiTab value="superadmin" prepend-icon="mdi-shield-crown-outline">
            SuperAdmin Ayarları
          </UiTab>
        </UiTabs>
        <hr class="ui-divider" />
      </template>

      <UiWindow v-model="activeTab" class="settings-window">
        <!-- Admin Tab Content -->
        <UiWindowItem value="admin" v-if="showAdminTab">
          <div class="p-6">
            <SettingsAdminSection />
          </div>
        </UiWindowItem>

        <!-- SuperAdmin Tab Content -->
        <UiWindowItem value="superadmin" v-if="showSuperAdminTab">
          <div class="p-6">
            <SettingsSuperAdminSection />
          </div>
        </UiWindowItem>
      </UiWindow>
    </UiCard>
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
.settings-container {
  padding: 24px;
  background: rgb(var(--color-background));
  min-height: 100vh;
}

.settings-header {
  background: rgb(var(--color-surface));
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.settings-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: rgb(var(--color-on-surface));
  margin: 0;
}

.settings-subtitle {
  font-size: 0.95rem;
  color: rgb(var(--color-on-surface-variant));
  margin-top: 8px;
}

.settings-card {
  border-radius: 16px;
  overflow: hidden;
}

.settings-tabs :deep(.ui-tab) {
  text-transform: none;
  font-weight: 600;
}

.settings-window {
  min-height: 300px;
}
</style>
