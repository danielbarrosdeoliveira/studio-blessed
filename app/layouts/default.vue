<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)

const { user, isAdmin } = await useUserSession()

const links = computed<NavigationMenuItem[][]>(() => {
  const items: NavigationMenuItem[] = [{
    label: 'Início',
    icon: 'i-lucide-house',
    to: '/',
    onSelect: () => {
      open.value = false
    }
  }]

  items.push({
    label: 'Serviços',
    icon: 'i-lucide-scissors',
    to: '/servicos',
    onSelect: () => {
      open.value = false
    }
  })

  if (isAdmin.value) {
    items.push({
      label: 'Profissionais',
      icon: 'i-lucide-users',
      to: '/profissionais',
      onSelect: () => {
        open.value = false
      }
    })
  } else if (user.value) {
    items.push({
      label: 'Minha jornada',
      icon: 'i-lucide-clock',
      to: `/profissionais/${user.value.id}`,
      onSelect: () => {
        open.value = false
      }
    })
  }

  return [items]
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <NuxtLink
          to="/"
          class="flex items-center gap-2 min-w-0"
        >
          <div class="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <UIcon
              name="i-lucide-scissors"
              class="size-4 text-white"
            />
          </div>
          <span
            v-if="!collapsed"
            class="font-semibold text-highlighted truncate"
          >
            Studio Blessed
          </span>
        </NuxtLink>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
