<template>
  <div class="min-h-screen bg-default">
    <header class="border-b border-default bg-elevated/25">
      <div class="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <NuxtLink
          to="/catalogo"
          class="flex items-center gap-2"
        >
          <div class="size-8 rounded-lg bg-primary flex items-center justify-center">
            <UIcon
              name="i-lucide-scissors"
              class="size-4 text-white"
            />
          </div>
          <span class="font-semibold text-highlighted">Studio Blessed</span>
        </NuxtLink>

        <UButton
          label="Área da equipe"
          icon="i-lucide-log-in"
          color="neutral"
          variant="outline"
          size="sm"
          to="/login"
        />
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <slot />
    </main>
  </div>
</template>
