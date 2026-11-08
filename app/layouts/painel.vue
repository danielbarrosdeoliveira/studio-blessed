<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

/** Valida a sessão do Better Auth no servidor/SSR. Sem sessão → redireciona para /login. */
const { data: session } = await useFetch<{ user: unknown | null }>('/api/auth/session')

if (import.meta.server && !session.value?.user) {
  await navigateTo('/login')
}

const open = ref(false)

const links = computed<NavigationMenuItem[][]>(() => {
  const close = () => {
    open.value = false
  }

  return [
    [
      { label: 'Início', icon: 'i-ri-home-line', to: '/', onSelect: close },
      { label: 'Agenda', icon: 'i-ri-calendar-line', to: '/painel', onSelect: close },
      { label: 'Serviços', icon: 'i-ri-scissors-line', to: '/painel/servicos', onSelect: close },
      { label: 'Clientes', icon: 'i-ri-user-line', to: '/painel/clientes', onSelect: close },
      { label: 'Jornada', icon: 'i-ri-time-line', to: '/painel/jornada', onSelect: close },
      { label: 'Métricas', icon: 'i-ri-bar-chart-line', to: '/painel/metricas', onSelect: close },
      {
        label: 'Configurações',
        icon: 'i-ri-settings-3-line',
        to: '/painel/configuracoes',
        onSelect: close
      }
    ]
  ]
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="painel"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <NuxtLink to="/" class="flex min-w-0 items-center gap-2">
          <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <UIcon name="i-ri-scissors-line" class="size-4 text-white" />
          </div>
          <span v-if="!collapsed" class="truncate font-semibold text-highlighted">
            Studio Blessed
          </span>
        </NuxtLink>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu :collapsed="collapsed" :items="links[0]" orientation="vertical" tooltip />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
