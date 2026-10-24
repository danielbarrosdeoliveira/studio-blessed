<script setup lang="ts">
import type { PublicServiceGroup } from '~/types/domain'

definePageMeta({
  layout: 'public'
})

useHead({
  title: 'Catálogo · Studio Blessed'
})

const { data: groups, status } = await useFetch<PublicServiceGroup[]>('/api/public/services', {
  default: () => []
})

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function formatPrice(cents: number) {
  return brl.format(cents / 100)
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl sm:text-3xl font-semibold text-highlighted">
        Catálogo
      </h1>
      <p class="text-muted mt-1">
        Veja os serviços do studio e as profissionais que atendem cada um.
      </p>
    </div>

    <div
      v-if="status === 'pending'"
      class="grid gap-4 sm:grid-cols-2"
    >
      <USkeleton
        v-for="index in 4"
        :key="index"
        class="h-40"
      />
    </div>

    <div
      v-else-if="groups.length"
      class="grid gap-4 sm:grid-cols-2"
    >
      <UCard
        v-for="group in groups"
        :key="group.name"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="font-semibold text-highlighted">
              {{ group.name }}
            </h2>
            <p class="text-sm text-muted">
              {{ group.professionals.length }}
              {{ group.professionals.length === 1 ? 'profissional' : 'profissionais' }}
            </p>
          </div>

          <UBadge
            color="primary"
            variant="subtle"
          >
            A partir de {{ formatPrice(group.minPriceCents) }}
          </UBadge>
        </div>

        <USeparator class="my-4" />

        <ul class="space-y-2">
          <li
            v-for="professional in group.professionals"
            :key="professional.serviceId"
            class="flex items-center justify-between gap-3 text-sm"
          >
            <div class="min-w-0">
              <p class="text-highlighted truncate">
                {{ professional.name }}
              </p>
              <p class="text-muted">
                {{ professional.durationMin }} min · {{ formatPrice(professional.priceCents) }}
              </p>
            </div>

            <UButton
              label="Agendar"
              icon="i-ri-calendar-line"
              size="xs"
              variant="outline"
              :to="{ path: '/agendar', query: { serviceId: professional.serviceId, professionalId: professional.id } }"
            />
          </li>
        </ul>
      </UCard>
    </div>

    <UCard v-else>
      <p class="text-sm text-muted text-center">
        Nenhum serviço disponível no momento.
      </p>
    </UCard>
  </div>
</template>
