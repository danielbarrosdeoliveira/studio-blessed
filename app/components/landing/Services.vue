<template>
  <section id="services" class="bg-zinc-950 py-20 md:py-28">
    <div class="mx-auto max-w-350 px-8 lg:px-12">
      <div class="mb-16 flex flex-col items-center text-center">
        <span class="font-sans text-xs font-semibold tracking-[0.2em] text-orange-500 uppercase"
          >04 / Serviços</span
        >
        <h2 class="mt-3 font-serif text-4xl/tight text-zinc-50 md:text-5xl">Nossos Serviços</h2>
        <p class="mt-4 max-w-xl font-sans text-base/relaxed text-zinc-400">
          Do olhar ao bem-estar, cada detalhe pensado para realçar sua beleza natural.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="servico in servicos"
          :key="servico.name"
          class="group rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-8 text-center transition-colors duration-300 hover:border-orange-500/40"
        >
          <div
            class="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-zinc-800 transition-all duration-300 group-hover:bg-orange-500/10"
          >
            <LandingIcon :icon="servico.icon" class="size-7 text-orange-500" />
          </div>
          <h3
            class="mb-2 font-sans text-base font-semibold tracking-[0.15em] text-zinc-100 uppercase"
          >
            {{ servico.name }}
          </h3>
          <p class="mb-4 font-sans text-sm/relaxed text-zinc-400">
            {{ servico.desc }}
          </p>
        </div>
      </div>

      <div class="mt-16 flex justify-center">
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

<script setup lang="ts">
const servicos = [
  {
    name: 'Extensão de Cílios',
    icon: 'lucide:eye',
    desc: 'Fios de seda que realçam o olhar com volume e curvatura natural.'
  },
  {
    name: 'Lash Lifting',
    icon: 'lucide:scan',
    desc: 'Curvatura duradoura que valoriza seus cílios naturais.'
  },
  {
    name: 'Sobrancelha',
    icon: 'lucide:sparkles',
    desc: 'Design personalizado para moldar e destacar sua expressão.'
  },
  {
    name: 'Hidra Gloss Lips',
    icon: 'lucide:droplets',
    desc: 'Hidratação profunda e revitalização labial sem agulhas para lábios viçosos.'
  },
  {
    name: 'Epilação',
    icon: 'lucide:spray-can',
    desc: 'Técnicas suaves para uma pele lisinha e bem cuidada.'
  },
  {
    name: 'Limpeza de Pele',
    icon: 'lucide:sparkle',
    desc: 'Limpeza profunda que revitaliza e renova sua pele.'
  },
  {
    name: 'Brow Lamination',
    icon: 'lucide:wand',
    desc: 'Modelagem e fixação dos fios para sobrancelhas alinhadas.'
  },
  {
    name: 'Alongamento de Unhas',
    icon: 'lucide:flower-2',
    desc: 'Unhas alongadas com acabamento impecável e durabilidade.'
  }
]
</script>
