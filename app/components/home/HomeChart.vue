<script setup lang="ts">
import { eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Period, Range } from '~/types'

const props = defineProps<{
  period: Period
  range: Range
}>()

type DataRecord = {
  date: string
  amount: number
}

const formatNumber = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0
}).format

const formatDate = (date: Date): string => {
  return {
    daily: format(date, 'd MMM', { locale: ptBR }),
    weekly: format(date, 'd MMM yyyy', { locale: ptBR }),
    monthly: format(date, 'MMM yyyy', { locale: ptBR })
  }[props.period]
}

const { data } = await useAsyncData<DataRecord[]>(
  'chart',
  async () => {
    const dates = (
      {
        daily: eachDayOfInterval,
        weekly: eachWeekOfInterval,
        monthly: eachMonthOfInterval
      } as Record<Period, typeof eachDayOfInterval>
    )[props.period](props.range)

    // The y axis rounds the highest amount up to its next step, so keeping it just above 7,000 leaves room above the peak
    const amounts = dates.map(() => randomInt(1000, 7000))
    amounts[randomInt(0, amounts.length - 1)] = randomInt(7100, 7200)

    return dates.map((date, i) => ({ date: formatDate(date), amount: amounts[i]! }))
  },
  {
    watch: [() => props.period, () => props.range],
    default: () => []
  }
)

const total = computed(() => data.value.reduce((acc: number, { amount }) => acc + amount, 0))
</script>

<template>
  <UCard :ui="{ root: 'overflow-visible', body: 'p-0! overflow-hidden rounded-b-[inherit]' }">
    <template #header>
      <div>
        <p class="mb-1.5 text-xs text-muted uppercase">Faturamento</p>
        <p class="text-3xl font-semibold text-highlighted">
          {{ formatNumber(total) }}
        </p>
      </div>
    </template>

    <UChart
      type="area"
      curve="monotone"
      :data="data"
      index="date"
      :categories="[{ key: 'amount', label: 'Faturamento' }]"
      :x-axis="false"
      :y-axis="false"
      :grid="true"
      :format="formatNumber"
      :aspect-ratio="3"
      :initial-width="1152"
      class="-my-px"
      aria-label="Faturamento"
    />
  </UCard>
</template>
