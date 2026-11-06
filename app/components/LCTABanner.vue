<template>
  <section class="bg-zinc-950">
    <div class="max-w-[1400px] mx-auto px-8 lg:px-12">
      <div class="flex flex-col md:flex-row justify-between items-center py-12 gap-6">
        <div>
          <h2 class="font-serif text-3xl md:text-4xl text-zinc-100 leading-tight">
            Agende Seu Horário
          </h2>
          <p class="font-sans text-zinc-400/90 text-sm mt-2">
            Reserve seu momento de beleza e cuidado
          </p>
        </div>
        <NuxtLink to="/agendamento"
          class="rounded-full bg-zinc-950 text-zinc-400 text-sm uppercase tracking-wider px-8 py-4 font-semibold hover:bg-zinc-950/90 transition-all duration-300 shadow-lg whitespace-nowrap">
          Agendar Agora
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
</script>