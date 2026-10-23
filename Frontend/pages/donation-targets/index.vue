<template>
  <!-- Breadcrumb -->
  <div class="mb-6">
    <BreadCrumb
      :items="[{ text: 'Ana Sayfa', to: '/' }, { text: 'Bağış hedefleri' }]"
    />
  </div>

  <!-- Yıl seçici ve hedef ekleme -->
  <div class="d-flex align-center mb-4 ga-2">
    <v-btn icon="mdi-chevron-left" variant="text" :disabled="isLoading" @click="year--" />
    <div class="text-h6">{{ year }}</div>
    <v-btn icon="mdi-chevron-right" variant="text" :disabled="isLoading" @click="year++" />
    <v-spacer />
    <v-btn v-if="canCreate" color="primary" prepend-icon="mdi-plus" @click="openCreate">Hedef ekle</v-btn>
  </div>

  <v-progress-linear v-if="isLoading" indeterminate color="primary" class="mb-2" />

  <div v-if="!isLoading && !sections.length" class="text-medium-emphasis mb-4">
    {{ year }} için hedef ya da bağış yok.
  </div>

  <!-- Her tür için bir bölüm (hedefi ya da gönüllü bağışı varsa) -->
  <v-card v-for="section in sections" :key="section.kind" variant="outlined" class="mb-4">
    <v-card-title class="text-subtitle-1">{{ getKindLabel(section.kind) }}</v-card-title>
    <v-card-text>
      <v-row dense class="mb-2">
        <v-col cols="6" md="3">
          <div class="text-caption">Hedef</div>
          <div class="text-h6">{{ formatMoney(section.totals?.target ?? 0) }}</div>
        </v-col>
        <v-col cols="6" md="3">
          <div class="text-caption">Verilen</div>
          <div class="text-h6">{{ formatMoney(section.totals?.given ?? 0) }}</div>
        </v-col>
        <v-col cols="6" md="3">
          <div class="text-caption">Kalan</div>
          <div class="text-h6">{{ formatMoney(section.totals?.remainingTotal ?? 0) }}</div>
        </v-col>
        <v-col cols="6" md="3">
          <div class="text-caption">Plana göre kalan</div>
          <div class="text-h6">{{ formatMoney(section.totals?.remainingAfterPlanTotal ?? 0) }}</div>
        </v-col>
      </v-row>

      <v-table v-if="section.rows.length" density="compact">
        <thead>
          <tr>
            <th>Kişi</th>
            <th class="text-right">Hedef</th>
            <th class="text-right">Verilen</th>
            <th class="text-right">Planlanan</th>
            <th class="text-right">Beklenen yıl sonu</th>
            <th class="text-right">Kalan</th>
            <th class="text-right">Plana göre kalan</th>
            <th v-if="canUpdate || canDelete" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in section.rows" :key="row.targetId">
            <td>{{ row.ownerName ?? "Hane" }}</td>
            <td class="text-right">{{ formatMoney(row.target) }}</td>
            <td class="text-right">{{ formatMoney(row.given) }}</td>
            <td class="text-right">{{ formatMoney(row.planned) }}</td>
            <td class="text-right">{{ formatMoney(row.expectedYearEnd) }}</td>
            <td class="text-right">
              <span v-if="row.remaining < 0" class="text-success">Fazla ödendi {{ formatMoney(-row.remaining) }}</span>
              <span v-else>{{ formatMoney(row.remaining) }}</span>
            </td>
            <td class="text-right">{{ formatMoney(row.remainingAfterPlan) }}</td>
            <td v-if="canUpdate || canDelete" class="text-right text-no-wrap">
              <v-btn v-if="canUpdate" icon="mdi-pencil" size="x-small" variant="text" title="Düzenle" @click="openEdit(row.targetId)" />
              <v-btn v-if="canDelete" icon="mdi-delete" size="x-small" variant="text" color="error" title="Sil" @click="targetToDelete = row" />
            </td>
          </tr>
        </tbody>
      </v-table>
      <div v-else class="text-medium-emphasis">Bu tür için hedef yok.</div>
    </v-card-text>
  </v-card>

  <!-- Gönüllü bağışlar -->
  <v-card variant="outlined">
    <v-card-title class="text-subtitle-1">Hedefsiz bağışlar (gönüllü)</v-card-title>
    <v-table density="compact">
      <thead>
        <tr>
          <th>Kişi</th>
          <th>Tür</th>
          <th class="text-right">Verilen</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="v in report?.voluntary ?? []" :key="`${v.personId ?? 'hane'}-${v.kind}`">
          <td>{{ v.name ?? "Hane" }}</td>
          <td>{{ getKindLabel(v.kind) }}</td>
          <td class="text-right">{{ formatMoney(v.given) }}</td>
        </tr>
        <tr v-if="!report?.voluntary?.length">
          <td colspan="3" class="text-medium-emphasis">Hedefsiz bağış yok</td>
        </tr>
      </tbody>
    </v-table>
  </v-card>

  <!-- Hedef formu -->
  <ResizableDrawer
    v-model="formDialog"
    :title="editingTarget ? 'Hedefi Düzenle' : 'Hedef Ekle'"
    :subtitle="editingTarget ? 'Hedef bilgilerini güncelleyin' : 'Kişi, yıl ve tür için hedef tutar'"
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
    title="Hedefi Sil"
    :message="`${targetToDelete?.ownerName ?? 'Hane'} için ${targetToDelete ? getKindLabel(targetToDelete.kind) : ''} hedefini silmek istediğinizden emin misiniz?`"
    type="error"
    confirm-text="Sil"
    :loading="isSaving"
    @confirm="confirmDelete"
    @cancel="targetToDelete = null"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import type {
  DonationKind,
  DonationTarget,
  DonationTargetReport,
  CreateDonationTargetRequest,
  UpdateDonationTargetRequest,
} from "~/types";
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
});

useHead({
  title: "Bağış hedefleri",
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

// Hedefi ya da gönüllü bağışı olan türler
const sections = computed(() => {
  const r = report.value;
  if (!r) return [];
  const kinds = [...new Set([...r.rows.map((x) => x.kind), ...r.voluntary.map((x) => x.kind)])].sort((a, b) => a - b);
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
      toastStore.add("success", "Hedef güncellendi");
    } else {
      await createTarget(payload as CreateDonationTargetRequest);
      toastStore.add("success", "Hedef eklendi");
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
    toastStore.add("success", "Hedef silindi");
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
