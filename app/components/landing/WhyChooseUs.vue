<template>
  <section class="bg-zinc-950 py-20 md:py-28">
    <div class="mx-auto max-w-350 px-8 lg:px-12">
      <div class="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <div class="space-y-8">
          <span class="font-sans text-xs font-semibold tracking-[0.2em] text-orange-500 uppercase"
            >05 / Diferenciais</span
          >
          <h2 class="font-serif text-4xl/tight text-zinc-50 md:text-5xl">
            Por que escolher<br />o Studio Blessed?
          </h2>
          <p class="max-w-md font-sans text-base/relaxed text-zinc-400">
            Do olhar ao bem-estar, cada detalhe pensado para realçar sua beleza natural — com
            tecnologia, produtos de alta qualidade e um atendimento verdadeiramente personalizado.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div
            v-for="item in diferenciais"
            :key="item.title"
            class="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 transition-colors duration-300 hover:border-orange-500/40"
          >
            <div class="flex size-10 items-center justify-center rounded-full bg-orange-500/10">
              <LandingIcon :icon="item.icon" class="size-5 text-orange-500" />
            </div>
            <h4 class="font-sans text-sm font-bold tracking-wider text-zinc-100 uppercase">
              {{ item.title }}
            </h4>
            <p class="font-sans text-xs/relaxed text-zinc-400">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const diferenciais = [
  {
    icon: 'lucide:monitor',
    title: 'Agendamento Online',
    description: 'Agende seu horário pelo site, sem precisar ligar ou enviar WhatsApp.'
  },
  {
    icon: 'lucide:map-pin',
    title: 'Localização Premium',
    description: 'Espaço aconchegante no Parque Viana, Barueri, pensado para seu conforto.'
  },
  {
    icon: 'lucide:heart',
    title: 'Atendimento Premium',
    description: 'Produtos de alta qualidade e técnicas especializadas para o melhor resultado.'
  },
  {
    icon: 'lucide:smile',
    title: 'Resultados Garantidos',
    description:
      'Atendimento feito pela própria dona do salão, com resultados que superam expectativas.'
  }
]
</script>
