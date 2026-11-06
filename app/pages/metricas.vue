<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

interface Metrics {
  revenue?: number
  completedCount?: number
  noShowCount?: number
  cancelledCount?: number
  serviceRanking?: Array<{
    serviceName: string
    total: number
    revenue?: number
  }>
}

const { data: metrics, pending } = await useFetch<Metrics>('/api/metrics')

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cents / 100)
</script>

<template>
  <UDashboardPanel id="metricas">
    <template #header>
      <UDashboardNavbar title="Métricas">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 sm:gap-6">
        <div v-if="pending" class="text-center py-20">
          <USpinner />
        </div>

        <template v-else-if="metrics">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <UCard>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold text-muted uppercase">Faturamento</span>
                <p class="text-2xl font-bold">{{ formatCurrency(metrics.revenue || 0) }}</p>
              </div>
            </UCard>

            <UCard>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold text-muted uppercase">Atendimentos</span>
                <p class="text-2xl font-bold">{{ metrics.completedCount || 0 }}</p>
              </div>
            </UCard>

            <UCard>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold text-muted uppercase">No-show</span>
                <p class="text-2xl font-bold text-error">{{ metrics.noShowCount || 0 }}</p>
              </div>
            </UCard>

            <UCard>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold text-muted uppercase">Cancelados</span>
                <p class="text-2xl font-bold text-muted">{{ metrics.cancelledCount || 0 }}</p>
              </div>
            </UCard>
          </div>

          <UCard v-if="metrics.serviceRanking?.length">
            <h3 class="text-lg font-bold mb-4">Serviços mais realizados</h3>
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-default">
                  <th class="pb-3 text-sm font-semibold text-muted">Serviço</th>
                  <th class="pb-3 text-sm font-semibold text-muted text-right">Qtde</th>
                  <th class="pb-3 text-sm font-semibold text-muted text-right">Faturamento</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in metrics.serviceRanking" :key="item.serviceName" class="border-b border-default/60">
                  <td class="py-3 text-sm text-default">{{ item.serviceName }}</td>
                  <td class="py-3 text-sm font-medium text-right text-default">{{ item.total }}</td>
                  <td class="py-3 text-sm font-medium text-right text-default">{{ formatCurrency(item.revenue || 0) }}</td>
                </tr>
              </tbody>
            </table>
          </UCard>
        </template>

        <div v-else class="text-center py-20 text-muted">
          Nenhum dado disponível.
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
