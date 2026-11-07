<script setup lang="ts">
useHead({
  title: 'Configurações · Studio Blessed'
})
</script>

<template>
  <UDashboardPanel id="configuracoes">
    <template #header>
      <UDashboardNavbar title="Configurações">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex w-full flex-col gap-4 sm:gap-6 lg:max-w-2xl">
        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">Studio Blessed</h2>
          </template>

          <dl class="space-y-3 text-sm">
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted">Modelo de agenda</dt>
              <dd class="font-medium text-highlighted">Dona única</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted">Jornada e bloqueios</dt>
              <dd>
                <UButton
                  to="/painel/jornada"
                  label="Gerenciar"
                  size="xs"
                  color="neutral"
                  variant="outline"
                />
              </dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted">Serviços</dt>
              <dd>
                <UButton
                  to="/painel/servicos"
                  label="Gerenciar"
                  size="xs"
                  color="neutral"
                  variant="outline"
                />
              </dd>
            </div>
          </dl>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
