<template>
  <!-- Breadcrumb -->
  <div class="mb-6">
    <BreadCrumb
      :items="[{ text: t('common.home'), to: '/' }, { text: t('budgets.title') }]"
    />
  </div>

  <!-- Ay seçici ve bütçe ekleme -->
  <div class="flex items-center mb-4 gap-2">
    <UiBtn icon="mdi-chevron-left" variant="text" :disabled="isLoading" :title="t('budgets.previousMonth')" @click="shift(-1)" />
    <div class="text-[1.25rem] leading-[2rem] tracking-[0.0125em] font-medium capitalize whitespace-nowrap">{{ formatMonth(year, month) }}</div>
    <UiBtn icon="mdi-chevron-right" variant="text" :disabled="isLoading" :title="t('budgets.nextMonth')" @click="shift(1)" />
    <div class="flex-1" />
    <UiBtn v-if="canCreate" color="primary" prepend-icon="mdi-plus" @click="openCreate">{{ t('budgets.addBudget') }}</UiBtn>
  </div>

  <UiProgressLinear v-if="isLoading" indeterminate color="primary" class="mb-2" />

  <div class="text-[0.875rem] leading-[1.425] tracking-[0.0178571429em] font-normal text-black/60 dark:text-white/70 mb-4">
    {{ t('budgets.subtitle') }}
  </div>

  <BudgetOverview v-if="report" :report="report" class="mb-4" />

  <!-- Bütçe kayıtları -->
  <UiCard elevation="0" border>
    <div class="ui-card-title !text-[1rem] !leading-[1.75rem] !tracking-[0.009375em] !font-normal">{{ t('budgets.recordsTitle') }}</div>
    <div class="overflow-x-auto"><table v-stack-table class="ui-table ui-table--compact">
      <thead>
        <tr>
          <th>{{ t('budget.person') }}</th>
          <th>{{ t('budgets.validFrom') }}</th>
          <th class="!text-right">{{ t('budgets.monthlyAmount') }}</th>
          <th>{{ t('budget.note') }}</th>
          <th v-if="canUpdate || canDelete" />
        </tr>
      </thead>
      <tbody>
        <tr v-for="b in budgets" :key="b.id">
          <td>{{ b.ownerName ?? t('budget.household') }}</td>
          <td class="capitalize">{{ formatMonth(b.startYear, b.startMonth) }}</td>
          <td class="!text-right">
            <span v-if="b.amount > 0">{{ formatMoney(b.amount) }}</span>
            <span v-else class="text-black/60 dark:text-white/70">{{ t('budgets.ended') }}</span>
          </td>
          <td>{{ b.note }}</td>
          <td v-if="canUpdate || canDelete" class="!text-right whitespace-nowrap">
            <UiBtn v-if="canUpdate" icon="mdi-pencil" size="x-small" variant="text" :title="t('common.edit')" @click="openEdit(b)" />
            <UiBtn v-if="canDelete" icon="mdi-delete" size="x-small" variant="text" color="error" :title="t('common.delete')" @click="budgetToDelete = b" />
          </td>
        </tr>
        <tr v-if="!budgets.length">
          <td :colspan="canUpdate || canDelete ? 5 : 4" class="text-black/60 dark:text-white/70">{{ t('budgets.noRecords') }}</td>
        </tr>
      </tbody>
    </table></div>
  </UiCard>

  <!-- Bütçe formu -->
  <ResizableDrawer
    v-model="formDialog"
    :title="editingBudget ? t('budgets.editTitle') : t('budgets.createTitle')"
    :subtitle="t('budgets.formSubtitle')"
    icon="mdi-wallet-outline"
    :default-width="560"
    :min-width="400"
  >
    <BudgetForm
      :budget="editingBudget"
      :year="year"
      :month="month"
      :people="people"
      :suggestion="report?.suggestion"
      :loading="isSaving"
      @submit="submitBudget"
      @cancel="formDialog = false"
    />
  </ResizableDrawer>

  <!-- Silme onayı -->
  <ConfirmDialog
    :model-value="!!budgetToDelete"
    :title="t('budgets.deleteTitle')"
    :message="t('budgets.deleteMessage', { owner: budgetToDelete?.ownerName ?? t('budget.household'), month: budgetToDelete ? formatMonth(budgetToDelete.startYear, budgetToDelete.startMonth) : '' })"
    type="error"
    :confirm-text="t('common.delete')"
    :loading="isSaving"
    @confirm="confirmDelete"
    @cancel="budgetToDelete = null"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { Budget, BudgetReport, CreateBudgetRequest, UpdateBudgetRequest } from "~/types";
import BudgetForm from "~/components/Budgets/BudgetForm.vue";
import BudgetOverview from "~/components/Budgets/BudgetOverview.vue";
import ResizableDrawer from "~/components/UI/ResizableDrawer.vue";
import ConfirmDialog from "~/components/UI/ConfirmDialog.vue";
import { addMonths, todayIso } from "~/utils/period";
import { useToastStore } from "~/stores/toast";

//#region Page Metadata
definePageMeta({
  title: "Aylık bütçe",
  requiresAuth: true,
  middleware: ["permission"],
  permissions: ["Budgets.Read"],
});

const { t } = useI18n();

useHead({
  title: computed(() => t("budgets.title")),
});
//#endregion

//#region Composables
const { formatMoney } = useMoney();
const { hasPermission } = useAuth();
const { getPeople } = usePeople();
const { getBudgetReport, getBudgets, createBudget, updateBudget, deleteBudget, formatMonth } = useBudgets();
const toastStore = useToastStore();
//#endregion

const canCreate = computed(() => hasPermission("Budgets.Create"));
const canUpdate = computed(() => hasPermission("Budgets.Update"));
const canDelete = computed(() => hasPermission("Budgets.Delete"));

//#region Rapor
const today = todayIso();
const [todayYear, todayMonth] = today.split("-").map(Number);
const year = ref(todayYear);
const month = ref(todayMonth);
const report = ref<BudgetReport | null>(null);
const budgets = ref<Budget[]>([]);
const isLoading = ref(false);

const loadReport = async () => {
  try {
    report.value = await getBudgetReport(year.value, month.value, today);
  } catch {
    report.value = null;
  }
};

const load = async () => {
  isLoading.value = true;
  try {
    const [, list] = await Promise.all([loadReport(), getBudgets().catch(() => [])]);
    budgets.value = list;
  } finally {
    isLoading.value = false;
  }
};

const shift = async (direction: number) => {
  const next = addMonths(year.value, month.value, direction);
  year.value = next.year;
  month.value = next.month;
  isLoading.value = true;
  try {
    await loadReport();
  } finally {
    isLoading.value = false;
  }
};
//#endregion

//#region Form ve silme
const people = ref<{ id: number; name: string }[]>([]);
const formDialog = ref(false);
const editingBudget = ref<Budget | null>(null);
const budgetToDelete = ref<Budget | null>(null);
const isSaving = ref(false);

const openCreate = () => {
  editingBudget.value = null;
  formDialog.value = true;
};

const openEdit = (budget: Budget) => {
  editingBudget.value = budget;
  formDialog.value = true;
};

const submitBudget = async (payload: CreateBudgetRequest | UpdateBudgetRequest) => {
  if (isSaving.value) return;
  isSaving.value = true;
  try {
    if (editingBudget.value) {
      await updateBudget(editingBudget.value.id, payload as UpdateBudgetRequest);
      toastStore.add("success", t("budgets.updated"));
    } else {
      await createBudget(payload as CreateBudgetRequest);
      toastStore.add("success", t("budgets.created"));
    }
    formDialog.value = false;
    await load();
  } catch {
    // Hata mesajı useApi tarafından gösterilir
  } finally {
    isSaving.value = false;
  }
};

const confirmDelete = async () => {
  if (!budgetToDelete.value || isSaving.value) return;
  isSaving.value = true;
  try {
    await deleteBudget(budgetToDelete.value.id);
    toastStore.add("success", t("budgets.deleted"));
    budgetToDelete.value = null;
    await load();
  } catch {
    // Hata mesajı useApi tarafından gösterilir
  } finally {
    isSaving.value = false;
  }
};
//#endregion

//#region Lifecycle
onMounted(async () => {
  if (hasPermission("People.Read")) {
    const peopleRes = await getPeople(1, 1000, "");
    people.value = peopleRes?.data?.items || [];
  }
  await load();
});
//#endregion
</script>
