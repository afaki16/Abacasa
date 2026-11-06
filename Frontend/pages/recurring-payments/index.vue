<template>
  <!-- Breadcrumb -->
  <div class="mb-6">
    <BreadCrumb
      :items="[{ text: t('common.home'), to: '/' }, { text: t('recurringPayments.title') }]"
    />
  </div>

  <PageHero
    icon="mdi-calendar-sync"
    :title="t('recurringPayments.title')"
    :subtitle="t('recurringPayments.subtitle')"
  />

  <UiTabs v-model="tab" color="primary" class="mb-4">
    <UiTab value="period">{{ t('recurringPayments.tabs.period') }}</UiTab>
    <UiTab value="plans">{{ t('recurringPayments.tabs.plans') }}</UiTab>
  </UiTabs>

  <!-- Sekme her açılışta yeniden yüklenir; planlardaki değişiklik dönem sekmesine yansır -->
  <RecurringPaymentOccurrences v-if="tab === 'period'" />
  <RecurringPaymentPlans v-else />
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import RecurringPaymentOccurrences from "~/components/RecurringPayments/RecurringPaymentOccurrences.vue";
import RecurringPaymentPlans from "~/components/RecurringPayments/RecurringPaymentPlans.vue";

//#region Page Metadata
definePageMeta({
  title: "Sabit ödemeler",
  requiresAuth: true,
  middleware: ["permission"],
  permissions: ["RecurringPayments.Read"],
});

const { t } = useI18n();

useHead({
  title: computed(() => t("recurringPayments.title")),
});
//#endregion

const tab = ref<"period" | "plans">("period");
</script>
