<script setup lang="ts">
import { auth } from '~/server/lib/auth'

definePageMeta({
  layout: 'default',
  middleware: ['auth']
})

const { data: session } = await auth.api.getSession()
const isAdmin = session?.user.role === 'admin'

const { data: metrics, pending } = await useFetch('/api/metrics', {
  method: 'get'
})

const formatCurrency = (cents: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
}).format(cents / 100)

const periodLabels: Record<string, string> = {
  day: 'Hoje',
  week: 'Esta semana',
  month: 'Este mês',
  year: 'Este ano'
}
</script>

<template>
  <UPage class="py-8">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold">Dashboard de Métricas</h1>
        <p class="text-muted-foreground">
          Visão operacional do salão
        </p>
      </div>

      <div class="flex gap-2">
        <USegmentedControl
          v-model="period"
          :options="[
            { label: 'Dia', value: 'day' },
            { label: 'Semana', value: 'week' },
            { label: 'Mês', value: 'month' },
            { label: 'Ano', value: 'year' }
          ]"
        />
        <UButton
          icon="i-ri-refresh-line"
          label="Atualizar"
          size="sm"
          @click="() => (metrics = null)"
        />
      </div>
    </div>

    <!-- Cards de resumo -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <UCard class="p-6">
        <div class="flex flex-col">
          <span class="text-xs font-semibold text-muted-foreground uppercase">Faturamento</span>
          <p class="text-2xl font-bold">{{ formatCurrency(metrics?.revenue || 0) }}</p>
        </div>
      </UCard>

      <UCard class="p-6">
        <div class="flex flex-col">
          <span class="text-xs font-semibold text-muted-foreground uppercase">Atendimentos</span>
          <p class="text-2xl font-bold">{{ metrics?.completedCount || 0 }}</p>
        </div>
      </UCard>

      <UCard class="p-6">
        <div class="flex flex-col">
          <span class="text-xs font-semibold text-muted-foreground uppercase">No-show</span>
          <p class="text-2xl font-bold text-destructive">{{ metrics?.noShowCount || 0 }}</p>
        </div>
      </UCard>

      <UCard class="p-6">
        <div class="flex flex-col">
          <span class="text-xs font-semibold text-muted-foreground uppercase">Cancelados</span>
          <p class="text-2xl font-bold text-muted">{{ metrics?.cancelledCount || 0 }}</p>
        </div>
      </UCard>
    </div>

    <!-- Ranking de serviços -->
    <UCard class="mb-8">
      <div class="p-6">
        <h3 class="text-lg font-bold mb-4">Serviços mais realizados</h3>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-muted/30">
                <th class="pb-3 text-sm font-semibold text-muted-foreground">Serviço</th>
                <th class="pb-3 text-sm font-semibold text-muted-foreground text-right">Qtde</th>
                <th class="pb-3 text-sm font-semibold text-muted-foreground text-right">Faturamento</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in metrics?.serviceRanking || []"
                :key="item.serviceName"
                class="border-b border-muted/10"
              >
                <td class="py-3 text-sm">{{ item.serviceName }}</td>
                <td class="py-3 text-sm font-medium text-right">{{ item.total }}</td>
                <td class="py-3 text-sm font-medium text-right">{{ formatCurrency(item.revenue || 0) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!(metrics?.serviceRanking?.length)" class="py-4 text-center text-muted-foreground">
          Nenhum serviço concluído no período.
        </div>
      </div>
    </div>

    <!-- Faturamento por profissional (apenas admin) -->
    <div v-if="isAdmin" class="mb-8">
      <UCard>
        <div class="p-6">
          <h3 class="text-lg font-bold mb-4">Faturamento por profissional</h3>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-muted/30">
                  <th class="pb-3 text-sm font-semibold text-muted-foreground">Profissional</th>
                  <th class="pb-3 text-sm font-semibold text-muted-foreground text-right">Atendimentos</th>
                  <th class="pb-3 text-sm font-semibold text-muted-foreground text-right">Faturamento</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="prof in metrics?.revenueByProfessional || []"
                  :key="prof.professionalId"
                  class="border-b border-muted/10"
                >
                  <td class="py-3 text-sm">{{ prof.professionalName }}</td>
                  <td class="py-3 text-sm font-medium text-right">{{ prof.count }}</td>
                  <td class="py-3 text-sm font-medium text-right">{{ formatCurrency(prof.total || 0) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="!(metrics?.revenueByProfessional?.length)" class="py-4 text-center text-muted-foreground">
            Nenhum faturamento registrado no período.
          </div>
        </div>
      </UCard>
    </div>

    <!-- Período -->
    <div class="text-sm text-muted-foreground mt-4">
      Período: {{ periodLabels[period || 'month'] }} —
      {{ new Date(metrics?.from || '').toLocaleDateString('pt-BR') }} a
      {{ new Date(metrics?.to || '').toLocaleDateString('pt-BR') }}
    </div>
  </UPage>
</template>
