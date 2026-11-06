<template>
  <section class="bg-zinc-950 py-20 md:py-28">
    <div class="mx-auto max-w-350 px-8 lg:px-12">
      <div class="mb-16 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div class="max-w-lg">
          <span class="font-sans text-xs font-semibold tracking-[0.2em] text-orange-500 uppercase"
            >01 / Pilares</span
          >
          <h2 class="mt-3 font-serif text-4xl/tight text-zinc-50 md:text-5xl">Nossa Essência</h2>
        </div>
        <p class="max-w-xl font-sans text-base/relaxed text-zinc-400 lg:text-right">
          No Studio Blessed, cada detalhe é pensado para oferecer uma experiência única de beleza e
          bem-estar. Nossos pilares refletem o compromisso com a excelência.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div
          v-for="pilar in pilares"
          :key="pilar.title"
          class="group space-y-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-8 text-center transition-colors duration-300 hover:border-orange-500/40"
        >
          <div
            class="mx-auto flex size-16 items-center justify-center rounded-2xl bg-zinc-800 transition-all duration-300 group-hover:bg-orange-500/10"
          >
            <LandingIcon :icon="pilar.icon" class="size-8 text-orange-500" />
          </div>
          <h3 class="font-sans text-lg font-semibold tracking-[0.15em] text-zinc-100 uppercase">
            {{ pilar.title }}
          </h3>
          <p class="mx-auto max-w-xs font-sans text-sm/relaxed text-zinc-400">
            {{ pilar.description }}
          </p>
          <NuxtLink
            :to="pilar.link"
            class="inline-block rounded-full border border-zinc-700 px-6 py-2 font-sans text-xs tracking-wider text-zinc-100 uppercase transition-all duration-300 hover:border-orange-500 hover:text-orange-500"
          >
            {{ pilar.cta }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const pilares = [
  {
    icon: 'lucide:compass',
    title: 'Nosso Salão',
    description:
      'Um ambiente acolhedor e premium onde cada detalhe é pensado para o seu bem-estar e satisfação.',
    link: '/agendamento',
    cta: 'Conhecer'
  },
  {
    icon: 'lucide:heart',
    title: 'Amamos Atender',
    description:
      'Atendimento personalizado e acolhedor, porque cada cliente é única e merece toda nossa dedicação.',
    link: '/agendamento',
    cta: 'Agendar'
  },
  {
    icon: 'lucide:gift',
    title: 'Vale Presente',
    description:
      'Presenteie quem você ama com uma experiência de beleza e cuidado no Studio Blessed.',
    link: '/agendamento',
    cta: 'Presentear'
  }
]
</script>
