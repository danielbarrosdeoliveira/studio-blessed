<template>
  <div class="min-h-screen bg-default">
    <header class="border-b border-default bg-elevated/25">
      <div class="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <NuxtLink
          to="/agendamento"
          class="flex items-center gap-2"
        >
          <div class="size-8 rounded-lg bg-primary flex items-center justify-center">
            <UIcon
              name="i-ri-scissors-line"
              class="size-4 text-white"
            />
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
            label="Equipe"
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
            aria-label="Equipe"
            color="neutral"
            variant="outline"
            size="sm"
            square
            class="sm:hidden"
          />
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <slot />
    </main>
  </div>
</template>
