<template>
  <!-- Breadcrumb -->
  <div class="mb-6">
    <BreadCrumb
      :items="[{ text: t('common.home'), to: '/' }, { text: t('donationTargets.title') }]"
    />
  </div>

  <!-- Yıl seçici ve hedef ekleme -->
  <div class="flex items-center mb-4 gap-2">
    <UiBtn icon="mdi-chevron-left" variant="text" :disabled="isLoading" @click="year--" />
    <div class="text-[1.25rem] leading-[2rem] tracking-[0.0125em] font-medium">{{ year }}</div>
    <UiBtn icon="mdi-chevron-right" variant="text" :disabled="isLoading" @click="year++" />
    <div class="flex-1" />
    <UiBtn v-if="canCreate" color="primary" prepend-icon="mdi-plus" @click="openCreate">{{ t('donationTargets.addTarget') }}</UiBtn>
  </div>

  <UiProgressLinear v-if="isLoading" indeterminate color="primary" class="mb-2" />

  <div v-if="!isLoading && !sections.length" class="text-black/60 dark:text-white/70 mb-4">
    {{ t('donationTargets.emptyYear', { year }) }}
  </div>

  <!-- Her tür için bir bölüm (hedefi ya da gönüllü bağışı varsa) -->
  <UiCard elevation="0" border v-for="section in sections" :key="section.kind" class="mb-4">
    <div class="ui-card-title !text-[1rem] !leading-[1.75rem] !tracking-[0.009375em] !font-normal">{{ getKindLabel(section.kind) }}</div>
    <div class="ui-card-text">
      <div class="ui-row ui-row--dense !mb-2">
        <div class="ui-col ui-col-6 ui-col-md-3">
          <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">{{ t('donationTargets.target') }}</div>
          <div class="text-[1.25rem] leading-[2rem] tracking-[0.0125em] font-medium">{{ formatMoney(section.totals?.target ?? 0) }}</div>
        </div>
        <div class="ui-col ui-col-6 ui-col-md-3">
          <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">{{ t('donationTargets.given') }}</div>
          <div class="text-[1.25rem] leading-[2rem] tracking-[0.0125em] font-medium">{{ formatMoney(section.totals?.given ?? 0) }}</div>
        </div>
        <div class="ui-col ui-col-6 ui-col-md-3">
          <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">{{ t('donationTargets.remaining') }}</div>
          <div class="text-[1.25rem] leading-[2rem] tracking-[0.0125em] font-medium">{{ formatMoney(section.totals?.remainingTotal ?? 0) }}</div>
        </div>
        <div class="ui-col ui-col-6 ui-col-md-3">
          <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">{{ t('donationTargets.remainingAfterPlan') }}</div>
          <div class="text-[1.25rem] leading-[2rem] tracking-[0.0125em] font-medium">{{ formatMoney(section.totals?.remainingAfterPlanTotal ?? 0) }}</div>
        </div>
      </div>

      <div class="overflow-x-auto" v-if="section.rows.length"><table v-stack-table class="ui-table ui-table--compact">
        <thead>
          <tr>
            <th>{{ t('budget.person') }}</th>
            <th class="!text-right">{{ t('donationTargets.target') }}</th>
            <th class="!text-right">{{ t('donationTargets.given') }}</th>
            <th class="!text-right">{{ t('donationTargets.planned') }}</th>
            <th class="!text-right">{{ t('donationTargets.expectedYearEnd') }}</th>
            <th class="!text-right">{{ t('donationTargets.remaining') }}</th>
            <th class="!text-right">{{ t('donationTargets.remainingAfterPlan') }}</th>
            <th v-if="canUpdate || canDelete" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in section.rows" :key="row.targetId">
            <td>{{ row.ownerName ?? t('budget.household') }}</td>
            <td class="!text-right">{{ formatMoney(row.target) }}</td>
            <td class="!text-right">{{ formatMoney(row.given) }}</td>
            <td class="!text-right">{{ formatMoney(row.planned) }}</td>
            <td class="!text-right">{{ formatMoney(row.expectedYearEnd) }}</td>
            <td class="!text-right">
              <span v-if="row.remaining < 0" class="text-primary">{{ t('donationTargets.overpaid', { amount: formatMoney(-row.remaining) }) }}</span>
              <span v-else>{{ formatMoney(row.remaining) }}</span>
            </td>
            <td class="!text-right">{{ formatMoney(row.remainingAfterPlan) }}</td>
            <td v-if="canUpdate || canDelete" class="!text-right whitespace-nowrap">
              <UiBtn v-if="canUpdate" icon="mdi-pencil" size="x-small" variant="text" :title="t('common.edit')" @click="openEdit(row.targetId)" />
              <UiBtn v-if="canDelete" icon="mdi-delete" size="x-small" variant="text" color="error" :title="t('common.delete')" @click="targetToDelete = row" />
            </td>
          </tr>
        </tbody>
      </table></div>
      <div v-else class="text-black/60 dark:text-white/70">{{ t('donationTargets.noTargetForKind') }}</div>
    </div>
  </UiCard>

  <!-- Gönüllü bağışlar -->
  <UiCard elevation="0" border>
    <div class="ui-card-title !text-[1rem] !leading-[1.75rem] !tracking-[0.009375em] !font-normal">{{ t('donationTargets.voluntaryTitle') }}</div>
    <div class="overflow-x-auto"><table class="ui-table ui-table--compact">
      <thead>
        <tr>
          <th>{{ t('budget.person') }}</th>
          <th>{{ t('budget.kind') }}</th>
          <th class="!text-right">{{ t('donationTargets.given') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="v in report?.voluntary ?? []" :key="`${v.personId ?? 'hane'}-${v.kind}`">
          <td>{{ v.name ?? t('budget.household') }}</td>
          <td>{{ getKindLabel(v.kind) }}</td>
          <td class="!text-right">{{ formatMoney(v.given) }}</td>
        </tr>
        <tr v-if="!report?.voluntary?.length">
          <td colspan="3" class="text-black/60 dark:text-white/70">{{ t('donationTargets.noVoluntary') }}</td>
        </tr>
      </tbody>
    </table></div>
  </UiCard>

  <!-- Hedef formu -->
  <ResizableDrawer
    v-model="formDialog"
    :title="editingTarget ? t('donationTargets.editTitle') : t('donationTargets.createTitle')"
    :subtitle="editingTarget ? t('donationTargets.editSubtitle') : t('donationTargets.createSubtitle')"
    icon="mdi-target"
    :default-width="560"
    :min-width="400"
  >
    <DonationTargetForm
      :target="editingTarget"
      :year="year"
      :people="people"
      :loading="isSaving"
      @submit="submitTarget"
      @cancel="formDialog = false"
    />
  </ResizableDrawer>

  <!-- Silme onayı -->
  <ConfirmDialog
    :model-value="!!targetToDelete"
    :title="t('donationTargets.deleteTitle')"
    :message="t('donationTargets.deleteMessage', { owner: targetToDelete?.ownerName ?? t('budget.household'), kind: targetToDelete ? getKindLabel(targetToDelete.kind) : '' })"
    type="error"
    :confirm-text="t('common.delete')"
    :loading="isSaving"
    @confirm="confirmDelete"
    @cancel="targetToDelete = null"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import type {
  DonationTarget,
  DonationTargetReport,
  CreateDonationTargetRequest,
  UpdateDonationTargetRequest,
} from "~/types";
import { DonationKind } from "~/types";
import DonationTargetForm from "~/components/DonationTargets/DonationTargetForm.vue";
import ResizableDrawer from "~/components/UI/ResizableDrawer.vue";
import ConfirmDialog from "~/components/UI/ConfirmDialog.vue";
import { todayIso } from "~/utils/period";
import { useToastStore } from "~/stores/toast";

//#region Page Metadata
definePageMeta({
  title: "Bağış hedefleri",
  requiresAuth: true,
  middleware: ["permission"],
  permissions: ["DonationTargets.Read"],
  // Bağış hedefleri ve emanetler modülü kapalıysa /dashboard'a
  module: "donationExtras",
});

const { t } = useI18n();

useHead({
  title: computed(() => t("donationTargets.title")),
});
//#endregion

//#region Composables
const { formatMoney } = useMoney();
const { hasPermission } = useAuth();
const { getPeople } = usePeople();
const { getKindLabel } = useDonations();
const { getTargetReport, getTargets, createTarget, updateTarget, deleteTarget } = useDonationTargets();
const toastStore = useToastStore();
//#endregion

const canCreate = computed(() => hasPermission("DonationTargets.Create"));
const canUpdate = computed(() => hasPermission("DonationTargets.Update"));
const canDelete = computed(() => hasPermission("DonationTargets.Delete"));

//#region Rapor
const today = todayIso();
const year = ref(Number(today.slice(0, 4)));
const report = ref<DonationTargetReport | null>(null);
const targets = ref<DonationTarget[]>([]);
const isLoading = ref(false);

const load = async () => {
  isLoading.value = true;
  try {
    const [reportRes, targetsRes] = await Promise.all([getTargetReport(year.value, today), getTargets(year.value)]);
    report.value = reportRes;
    targets.value = targetsRes;
  } catch {
    report.value = null;
    targets.value = [];
  } finally {
    isLoading.value = false;
  }
};

watch(year, load);

// Enum isim olarak gelir; türler backend sırasıyla (Bağış, Zekat, Burs) dizilir
const kindOrder = Object.values(DonationKind);

// Hedefi ya da gönüllü bağışı olan türler
const sections = computed(() => {
  const r = report.value;
  if (!r) return [];
  const kinds = [...new Set([...r.rows.map((x) => x.kind), ...r.voluntary.map((x) => x.kind)])].sort(
    (a, b) => kindOrder.indexOf(a) - kindOrder.indexOf(b)
  );
  return kinds.map((kind) => ({
    kind: kind as DonationKind,
    rows: r.rows.filter((x) => x.kind === kind),
    totals: r.totalsByKind.find((x) => x.kind === kind) ?? null,
  }));
});
//#endregion

//#region Form ve silme
const people = ref<{ id: number; name: string }[]>([]);
const formDialog = ref(false);
const editingTarget = ref<DonationTarget | null>(null);
const targetToDelete = ref<DonationTargetReport["rows"][number] | null>(null);
const isSaving = ref(false);

const openCreate = () => {
  editingTarget.value = null;
  formDialog.value = true;
};

const openEdit = (targetId: number) => {
  editingTarget.value = targets.value.find((t) => t.id === targetId) ?? null;
  if (editingTarget.value) formDialog.value = true;
};

const submitTarget = async (payload: CreateDonationTargetRequest | UpdateDonationTargetRequest) => {
  if (isSaving.value) return;
  isSaving.value = true;
  try {
    if (editingTarget.value) {
      await updateTarget(editingTarget.value.id, payload as UpdateDonationTargetRequest);
      toastStore.add("success", t("donationTargets.updated"));
    } else {
      await createTarget(payload as CreateDonationTargetRequest);
      toastStore.add("success", t("donationTargets.created"));
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
  if (!targetToDelete.value || isSaving.value) return;
  isSaving.value = true;
  try {
    await deleteTarget(targetToDelete.value.targetId);
    toastStore.add("success", t("donationTargets.deleted"));
    targetToDelete.value = null;
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
  const peopleRes = await getPeople(1, 1000, "");
  people.value = peopleRes?.data?.items || [];
  await load();
});
//#endregion
</script>
