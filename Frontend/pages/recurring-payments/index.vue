<template>
  <!-- Breadcrumb -->
  <div class="mb-6">
    <BreadCrumb
      :items="[{ text: 'Ana Sayfa', to: '/' }, { text: 'Sabit ödemeler' }]"
    />
  </div>

  <v-tabs v-model="tab" color="primary" class="mb-4">
    <v-tab value="period">Dönem</v-tab>
    <v-tab value="plans">Planlar</v-tab>
  </v-tabs>

  <!-- Sekme her açılışta yeniden yüklenir; planlardaki değişiklik dönem sekmesine yansır -->
  <RecurringPaymentOccurrences v-if="tab === 'period'" />
  <RecurringPaymentPlans v-else />
</template>

<script setup lang="ts">
import { ref } from "vue";
import RecurringPaymentOccurrences from "~/components/RecurringPayments/RecurringPaymentOccurrences.vue";
import RecurringPaymentPlans from "~/components/RecurringPayments/RecurringPaymentPlans.vue";

//#region Page Metadata
definePageMeta({
  title: "Sabit ödemeler",
  requiresAuth: true,
  middleware: ["permission"],
  permissions: ["RecurringPayments.Read"],
});

useHead({
  title: "Sabit ödemeler",
});
//#endregion

const tab = ref<"period" | "plans">("period");
</script>
