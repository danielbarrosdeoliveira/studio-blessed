<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const links = [[{
  label: 'General',
  icon: 'i-ri-user-line',
  to: '/configuracoes',
  exact: true
}, {
  label: 'Members',
  icon: 'i-ri-group-line',
  to: '/configuracoes/members'
}, {
  label: 'Notifications',
  icon: 'i-ri-notification-3-line',
  to: '/configuracoes/notifications'
}, {
  label: 'Security',
  icon: 'i-ri-shield-line',
  to: '/configuracoes/security'
}], [{
  label: 'Documentation',
  icon: 'i-ri-book-open-line',
  to: 'https://ui.nuxt.com/docs/getting-started/installation/nuxt',
  target: '_blank'
}]] satisfies NavigationMenuItem[][]
</script>

<template>
  <UDashboardPanel id="configuracoes" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar title="Configurações">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
        <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-2xl mx-auto">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
