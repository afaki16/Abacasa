<template>
  <!-- Tablo kendi kabında yatay kayar; ilk sütun sabit -->
  <div class="ledger-scroll">
    <table class="ledger-table">
      <thead>
        <tr>
          <th class="sticky-col">Kalem</th>
          <th v-for="label in MONTH_LABELS" :key="label" class="num">{{ label }}</th>
          <th class="num">Toplam</th>
          <th class="num">Ortalama</th>
        </tr>
      </thead>

      <tbody v-for="section in sections" :key="section.title">
        <tr class="section-row">
          <td class="sticky-col">{{ section.title }}</td>
          <td :colspan="14" />
        </tr>
        <tr v-for="row in section.rows" :key="row.key">
          <td class="sticky-col">
            <div class="d-flex align-center ga-1">
              <span>{{ rowLabel(row) }}</span>
              <v-chip v-if="row.source === 'plan' && row.kind" size="x-small" variant="tonal">
                {{ getKindLabel(row.kind) }}
              </v-chip>
              <span v-if="row.source === 'manual' && row.ownerName" class="text-caption text-medium-emphasis">
                · {{ row.ownerName }}
              </span>
              <template v-if="row.source === 'manual'">
                <v-spacer />
                <v-btn v-if="canUpdate" icon="mdi-pencil" size="x-small" variant="text" title="Düzenle" @click="$emit('edit', row)" />
                <v-btn v-if="canDelete" icon="mdi-delete" size="x-small" variant="text" color="error" title="Sil" @click="$emit('delete', row)" />
              </template>
            </div>
          </td>
          <td
            v-for="(value, m) in row.months"
            :key="m"
            class="num"
            :class="isEditable(row) ? 'cell-manual' : 'cell-auto'"
            @click="startEdit(row, m)"
          >
            <input
              v-if="isEditing(row, m)"
              ref="editInput"
              v-model="editValue"
              type="number"
              min="0"
              step="0.01"
              class="cell-input"
              @keydown.enter.prevent="commit"
              @keydown.esc.prevent="cancel"
              @blur="commit"
            />
            <template v-else>{{ formatMoney(value) }}</template>
          </td>
          <td class="num font-weight-medium">{{ formatMoney(row.total) }}</td>
          <td class="num">{{ formatMoney(row.average) }}</td>
        </tr>
        <tr v-if="!section.rows.length">
          <td class="sticky-col text-medium-emphasis">Kayıt yok</td>
          <td :colspan="14" />
        </tr>
      </tbody>

      <tfoot v-if="data">
        <tr>
          <td class="sticky-col">Gelir toplamı</td>
          <td v-for="(value, m) in data.totals.incomeByMonth" :key="m" class="num">{{ formatMoney(value) }}</td>
          <td class="num">{{ formatMoney(data.totals.incomeTotal) }}</td>
          <td class="num">{{ formatMoney(data.totals.incomeAverage) }}</td>
        </tr>
        <tr>
          <td class="sticky-col">Gider toplamı</td>
          <td v-for="(value, m) in data.totals.expenseByMonth" :key="m" class="num">{{ formatMoney(value) }}</td>
          <td class="num">{{ formatMoney(data.totals.expenseTotal) }}</td>
          <td class="num">{{ formatMoney(data.totals.expenseAverage) }}</td>
        </tr>
        <tr>
          <td class="sticky-col">Net (gelir − gider)</td>
          <td v-for="(value, m) in data.totals.netByMonth" :key="m" class="num" :class="{ negative: value < 0 }">
            {{ formatMoney(value) }}
          </td>
          <td class="num" :class="{ negative: data.totals.netTotal < 0 }">{{ formatMoney(data.totals.netTotal) }}</td>
          <td class="num" :class="{ negative: data.totals.netAverage < 0 }">{{ formatMoney(data.totals.netAverage) }}</td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { LedgerRow, LedgerYear } from '~/types'

const MONTH_LABELS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

const props = defineProps<{
  data: LedgerYear | null
}>()

const emit = defineEmits<{
  edit: [row: LedgerRow]
  delete: [row: LedgerRow]
  /** month 1–12; amount null hücreyi temizler */
  'save-cell': [row: LedgerRow, month: number, amount: number | null]
}>()

const { formatMoney } = useMoney()
const { hasPermission } = useAuth()
const { getKindLabel } = useRecurringPayments()

const canUpdate = computed(() => hasPermission('Ledger.Update'))
const canDelete = computed(() => hasPermission('Ledger.Delete'))

const sections = computed(() => {
  const expense = props.data?.expenseRows ?? []
  return [
    { title: 'Gelirler', rows: props.data?.incomeRows ?? [] },
    { title: 'Giderler · Sabit ödemeler', rows: expense.filter((r) => r.source === 'plan') },
    { title: 'Giderler · Harcamalar', rows: expense.filter((r) => r.source === 'category' || r.source === 'donations') },
    { title: 'Giderler · Elle', rows: expense.filter((r) => r.source === 'manual') },
  ]
})

const rowLabel = (row: LedgerRow) => {
  if (row.source === 'category') return `Harcamalar · ${row.name}`
  if (row.source === 'donations') return 'Bağışlar (plan dışı)'
  return row.name
}

// Yalnızca elle kalem hücreleri yazılabilir; otomatik satırlar salt okunur
const isEditable = (row: LedgerRow) => row.source === 'manual' && canUpdate.value

//#region Hücre düzenleme
const editing = ref<{ row: LedgerRow; month: number } | null>(null)
const editValue = ref<string | number>('')
const editInput = ref<HTMLInputElement[] | null>(null)

const isEditing = (row: LedgerRow, m: number) => editing.value?.row.key === row.key && editing.value.month === m

const startEdit = async (row: LedgerRow, m: number) => {
  if (!isEditable(row) || isEditing(row, m)) return
  editing.value = { row, month: m }
  editValue.value = row.months[m] ?? ''
  await nextTick()
  editInput.value?.[0]?.focus()
  editInput.value?.[0]?.select()
}

// Escape vazgeçer; ardından gelen blur kaydetmez
const cancel = () => {
  editing.value = null
}

// Enter ya da odak çıkınca kaydeder; boş bırakılırsa null (girilmemiş)
const commit = () => {
  const current = editing.value
  if (!current) return
  editing.value = null

  const raw = String(editValue.value ?? '').trim()
  const amount = raw === '' ? null : Number(raw)
  if (amount !== null && (Number.isNaN(amount) || amount < 0)) return
  if (amount === current.row.months[current.month]) return

  emit('save-cell', current.row, current.month + 1, amount)
}
//#endregion
</script>

<style scoped>
.ledger-scroll {
  overflow-x: auto;
  max-width: 100%;
}

.ledger-table {
  border-collapse: separate;
  border-spacing: 0;
  width: max-content;
  min-width: 100%;
  font-size: 0.85rem;
}

.ledger-table th,
.ledger-table td {
  padding: 6px 10px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  white-space: nowrap;
}

.ledger-table thead th {
  font-weight: 600;
  background: rgb(var(--v-theme-surface));
}

.num {
  text-align: right;
  min-width: 96px;
}

/* İlk sütun yatay kaydırmada sabit kalır */
.sticky-col {
  position: sticky;
  left: 0;
  z-index: 1;
  min-width: 260px;
  text-align: left;
  background: rgb(var(--v-theme-surface));
}

.section-row td {
  font-weight: 600;
  background: rgba(var(--v-theme-primary), 0.08);
}

.section-row .sticky-col {
  background: rgb(var(--v-theme-surface));
  box-shadow: inset 0 0 0 9999px rgba(var(--v-theme-primary), 0.08);
}

/* Elle hücreler tıklanabilir; otomatik hücreler soluk ve salt okunur */
.cell-manual {
  cursor: pointer;
  border-left: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
}

.cell-manual:hover {
  background: rgba(var(--v-theme-primary), 0.06);
}

.cell-auto {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-style: italic;
}

.cell-input {
  width: 100px;
  text-align: right;
  border: 1px solid rgb(var(--v-theme-primary));
  border-radius: 4px;
  padding: 2px 4px;
  font: inherit;
  color: inherit;
  background: rgb(var(--v-theme-surface));
}

tfoot td {
  font-weight: 600;
}

.negative {
  color: rgb(var(--v-theme-error));
}
</style>
