<template>
  <UiCard elevation="0" border>
    <div class="ui-card-title !text-[1rem] !leading-[1.75rem] !tracking-[0.009375em] !font-normal">
      <div class="flex items-center gap-2">
        <span>{{ t('budgets.overviewTitle', { month: formatMonth(report.year, report.month) }) }}</span>
        <div class="flex-1" />
        <NuxtLink v-if="link" to="/budgets" class="text-[0.875rem] leading-[1.425] tracking-[0.0178571429em] font-normal text-[rgb(var(--color-brand))]">
          {{ t('budgets.goToBudgets') }}
        </NuxtLink>
      </div>
    </div>
    <div class="ui-card-text">
      <!-- Bütçe yok -->
      <div v-if="!report.household && !report.rows.length" class="text-black/60 dark:text-white/70">
        {{ t('budgets.noBudget') }}
      </div>

      <!-- Hane -->
      <div v-if="report.household" class="mb-4">
        <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal text-black/60 dark:text-white/70">
          {{ report.household.remaining >= 0 ? t('budgets.canSpend') : t('budgets.overBy') }}
        </div>
        <div
          class="text-[1.75rem] leading-[2.25rem] font-bold"
          :class="report.household.remaining < 0 ? 'text-[rgb(var(--color-error))]' : ''"
        >
          {{ formatMoney(Math.abs(report.household.remaining)) }}
        </div>
        <div v-if="report.household.dailyAllowance !== null" class="text-[0.875rem] leading-[1.425] font-normal">
          {{ t('budgets.daily', { amount: formatMoney(report.household.dailyAllowance) }) }}
          · {{ t('budgets.daysLeft', { days: report.daysLeft }, report.daysLeft) }}
        </div>
        <UiProgressLinear
          :model-value="report.household.usedPercent"
          :color="usageColor(report.household.usedPercent)"
          :height="8"
          rounded
          class="my-2"
        />
        <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal text-black/60 dark:text-white/70">
          {{ t('budgets.breakdown', {
            budget: formatMoney(report.household.budget),
            spent: formatMoney(report.household.spent),
            pending: formatMoney(report.household.pending),
            percent: formatPercent(report.household.usedPercent),
          }) }}
        </div>
      </div>

      <!-- Kişiler ve Ortak -->
      <div v-for="row in report.rows" :key="row.isShared ? 'shared' : row.personId ?? 'household'" class="mb-3">
        <div class="flex items-baseline gap-2">
          <span class="font-medium">{{ rowName(row) }}</span>
          <div class="flex-1" />
          <span :class="row.remaining < 0 ? 'text-[rgb(var(--color-error))]' : ''" class="font-medium">
            {{ row.remaining >= 0 ? t('budgets.left', { amount: formatMoney(row.remaining) }) : t('budgets.over', { amount: formatMoney(-row.remaining) }) }}
          </span>
        </div>
        <UiProgressLinear :model-value="row.usedPercent" :color="usageColor(row.usedPercent)" :height="6" rounded class="my-1" />
        <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal text-black/60 dark:text-white/70">
          {{ t('budgets.rowBreakdown', { used: formatMoney(row.used), budget: formatMoney(row.budget), percent: formatPercent(row.usedPercent) }) }}
          <template v-if="row.dailyAllowance !== null && row.remaining > 0"> · {{ t('budgets.daily', { amount: formatMoney(row.dailyAllowance) }) }}</template>
        </div>
      </div>

      <UiAlert v-if="report.personBudgetsExceedHousehold" type="warning" variant="tonal" density="compact" class="mt-2">
        {{ t('budgets.exceedsHousehold') }}
      </UiAlert>
      <div v-if="report.pendingUnknownCount > 0" class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal text-black/60 dark:text-white/70 mt-2">
        {{ t('budgets.unknownAmounts', { count: report.pendingUnknownCount }, report.pendingUnknownCount) }}
      </div>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import type { BudgetReport } from '~/types'

// Ayın bütçe özeti: hane kalanı, günlük limit, kişi ve Ortak satırları. Özet sayfası ve Bütçe sayfası ortak kullanır.
defineProps<{
  report: BudgetReport
  /** Bütçe sayfasına bağlantı göster (Özet'te) */
  link?: boolean
}>()

const { t, locale } = useI18n()
const { formatMoney } = useMoney()
const { formatMonth, rowName, usageColor } = useBudgets()

const formatPercent = (value: number) =>
  new Intl.NumberFormat(locale.value === 'en' ? 'en-US' : 'tr-TR', { maximumFractionDigits: 0 }).format(value)
</script>
