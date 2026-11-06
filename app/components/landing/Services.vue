<template>
  <section id="services" class="py-20 md:py-28 bg-zinc-950">
    <div class="max-w-[1400px] mx-auto px-8 lg:px-12">
      <div class="flex flex-col items-center text-center mb-16">
        <span class="font-sans text-xs uppercase tracking-[0.2em] text-orange-500 font-semibold">04 / Serviços</span>
        <h2 class="font-serif text-4xl md:text-5xl text-zinc-50 mt-3 leading-tight">
          Nossos Serviços
        </h2>
        <p class="font-sans text-zinc-400 text-base leading-relaxed max-w-xl mt-4">
          Do olhar ao bem-estar, cada detalhe pensado para realçar sua beleza natural.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="servico in servicos" :key="servico.name"
          class="text-center group rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-8 transition-colors duration-300 hover:border-orange-500/40">
          <div
            class="w-14 h-14 mx-auto rounded-2xl bg-zinc-800 flex items-center justify-center group-hover:bg-orange-500/10 transition-all duration-300 mb-5">
            <LandingIcon :icon="servico.icon" class="w-7 h-7 text-orange-500" />
          </div>
          <h3 class="font-sans text-base uppercase tracking-[0.15em] text-zinc-100 font-semibold mb-2">
            {{ servico.name }}
          </h3>
          <p class="font-sans text-zinc-400 text-sm leading-relaxed mb-4">
            {{ servico.desc }}
          </p>
        </div>
      </div>

      <div class="flex justify-center mt-16">
        <NuxtLink to="/agendamento"
          class="rounded-full bg-orange-500 text-zinc-950 text-sm uppercase tracking-wider px-8 py-4 font-semibold hover:bg-orange-400 transition-all duration-300 shadow-lg shadow-orange-500/20 whitespace-nowrap">
          Agendar Agora
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const servicos = [
  { name: 'Extensão de Cílios', icon: 'lucide:eye', desc: 'Fios de seda que realçam o olhar com volume e curvatura natural.' },
  { name: 'Lash Lifting', icon: 'lucide:scan', desc: 'Curvatura duradoura que valoriza seus cílios naturais.' },
  { name: 'Sobrancelha', icon: 'lucide:sparkles', desc: 'Design personalizado para moldar e destacar sua expressão.' },
  { name: 'Hidra Gloss Lips', icon: 'lucide:droplets', desc: 'Hidratação profunda e revitalização labial sem agulhas para lábios viçosos.' },
  { name: 'Epilação', icon: 'lucide:spray-can', desc: 'Técnicas suaves para uma pele lisinha e bem cuidada.' },
  { name: 'Limpeza de Pele', icon: 'lucide:sparkle', desc: 'Limpeza profunda que revitaliza e renova sua pele.' },
  { name: 'Brow Lamination', icon: 'lucide:wand', desc: 'Modelagem e fixação dos fios para sobrancelhas alinhadas.' },
  { name: 'Alongamento de Unhas', icon: 'lucide:flower-2', desc: 'Unhas alongadas com acabamento impecável e durabilidade.' }
]
</script>
