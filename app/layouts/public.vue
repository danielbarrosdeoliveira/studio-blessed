<template>
  <div class="min-h-screen bg-default">
    <header class="border-b border-default bg-elevated/25">
      <div class="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <NuxtLink to="/agendamento" class="flex items-center gap-2">
          <div class="flex size-8 items-center justify-center rounded-lg bg-primary">
            <UIcon name="i-ri-scissors-line" class="size-4 text-white" />
          </div>
          <span class="font-semibold text-highlighted">Studio Blessed</span>
        </NuxtLink>

        <div class="flex items-center gap-1 sm:gap-2">
          <UButton
            to="/agendamento"
            icon="i-ri-calendar-check-line"
            label="Agendar"
            size="sm"
            class="hidden sm:inline-flex"
          />
          <UButton
            to="/agendamento"
            icon="i-ri-calendar-check-line"
            aria-label="Agendar"
            size="sm"
            square
            class="sm:hidden"
          />
          <UButton
            to="/meus-agendamentos"
            icon="i-ri-calendar-line"
            label="Meus agendamentos"
            color="neutral"
            variant="ghost"
            size="sm"
            class="hidden sm:inline-flex"
          />
          <UButton
            to="/meus-agendamentos"
            icon="i-ri-calendar-line"
            aria-label="Meus agendamentos"
            color="neutral"
            variant="ghost"
            size="sm"
            square
            class="sm:hidden"
          />
          <UButton
            label="Área da dona"
            icon="i-ri-login-box-line"
            color="neutral"
            variant="outline"
            size="sm"
            to="/login"
            class="hidden sm:inline-flex"
          />
          <UButton
            to="/login"
            icon="i-ri-login-box-line"
            aria-label="Área da dona"
            color="neutral"
            variant="outline"
            size="sm"
            square
            class="sm:hidden"
          />
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <slot />
    </main>
  </div>
</template>
