<script setup lang="ts">
import { auth as betterAuth } from '../../server/lib/auth'

definePageMeta({
  layout: 'default'
})

const session = await betterAuth.api.getSession()
const isAdmin = session?.user?.role === 'admin'

const { data: metrics, pending } = await useFetch<any>('/api/metrics')

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cents / 100)
</script>

<template>
  <UPage class="py-8">
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold">Dashboard de Métricas</h1>
        <p class="text-muted-foreground">Visão operacional do salão</p>
      </div>
    </div>

    <div v-if="pending" class="text-center py-20">
      <USpinner />
    </div>

    <div v-else-if="metrics" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <UCard class="p-6">
        <div class="flex flex-col">
          <span class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Faturamento</span>
          <p class="text-2xl font-bold">{{ formatCurrency(metrics.revenue || 0) }}</p>
        </div>
      </UCard>

      <UCard class="p-6">
        <div class="flex flex-col">
          <span class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Atendimentos</span>
          <p class="text-2xl font-bold">{{ metrics.completedCount || 0 }}</p>
        </div>
      </UCard>

      <UCard class="p-6">
        <div class="flex flex-col">
          <span class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">No-show</span>
          <p class="text-2xl font-bold text-destructive">{{ metrics.noShowCount || 0 }}</p>
        </div>
      </UCard>

      <UCard class="p-6">
        <div class="flex flex-col">
          <span class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Cancelados</span>
          <p class="text-2xl font-bold text-muted">{{ metrics.cancelledCount || 0 }}</p>
        </div>
      </UCard>
    </div>

    <div v-else class="text-center py-20 text-muted-foreground">
      Nenhum dado disponível.
    </div>

    <UCard v-if="metrics && metrics.serviceRanking?.length" class="mb-8">
      <div class="p-6">
        <h3 class="text-lg font-bold mb-4">Serviços mais realizados</h3>
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-muted/30">
              <th class="pb-3 text-sm font-semibold text-neutral-500 dark:text-neutral-400">Serviço</th>
              <th class="pb-3 text-sm font-semibold text-neutral-500 dark:text-neutral-400 text-right">Qtde</th>
              <th class="pb-3 text-sm font-semibold text-neutral-500 dark:text-neutral-400 text-right">Faturamento</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in metrics.serviceRanking" :key="item.serviceName" class="border-b border-muted/10">
              <td class="py-3 text-sm text-neutral-100">{{ item.serviceName }}</td>
              <td class="py-3 text-sm font-medium text-right text-neutral-100">{{ item.total }}</td>
              <td class="py-3 text-sm font-medium text-right text-neutral-100">{{ formatCurrency(item.revenue || 0) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <UCard v-if="isAdmin && metrics && metrics.revenueByProfessional?.length" class="mb-8">
      <div class="p-6">
        <h3 class="text-lg font-bold mb-4">Faturamento por profissional</h3>
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-muted/30">
              <th class="pb-3 text-sm font-semibold text-neutral-500 dark:text-neutral-400">Profissional</th>
              <th class="pb-3 text-sm font-semibold text-neutral-500 dark:text-neutral-400 text-right">Atendimentos</th>
              <th class="pb-3 text-sm font-semibold text-neutral-500 dark:text-neutral-400 text-right">Faturamento</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="prof in metrics.revenueByProfessional" :key="prof.professionalId" class="border-b border-muted/10">
              <td class="py-3 text-sm text-neutral-100">{{ prof.professionalName }}</td>
              <td class="py-3 text-sm font-medium text-right text-neutral-100">{{ prof.count }}</td>
              <td class="py-3 text-sm font-medium text-right text-neutral-100">{{ formatCurrency(prof.total || 0) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </UPage>
</template>
