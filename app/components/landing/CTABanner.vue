<template>
  <section class="bg-zinc-950">
    <div class="mx-auto max-w-350 px-8 lg:px-12">
      <div
        class="flex flex-col items-center justify-between gap-6 border-y border-zinc-800/80 py-14 md:flex-row"
      >
        <div>
          <h2 class="font-serif text-3xl/tight text-zinc-50 md:text-4xl">Agende Seu Horário</h2>
          <p class="mt-2 font-sans text-sm text-zinc-400">
            Reserve seu momento de beleza e cuidado.
          </p>
        </div>
        <NuxtLink
          to="/agendamento"
          class="rounded-full bg-orange-500 px-8 py-4 text-sm font-semibold tracking-wider whitespace-nowrap text-zinc-950 uppercase shadow-lg shadow-orange-500/20 transition-all duration-300 hover:bg-orange-400"
        >
          Agendar Agora
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
