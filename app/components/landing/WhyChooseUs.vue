<template>
  <section class="py-20 md:py-28 bg-zinc-950">
    <div class="max-w-[1400px] mx-auto px-8 lg:px-12">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div class="space-y-8">
          <span class="font-sans text-xs uppercase tracking-[0.2em] text-orange-500 font-semibold">05 / Diferenciais</span>
          <h2 class="font-serif text-4xl md:text-5xl text-zinc-50 leading-tight">
            Por que escolher<br />o Studio Blessed?
          </h2>
          <p class="font-sans text-zinc-400 text-base leading-relaxed max-w-md">
            Do olhar ao bem-estar, cada detalhe pensado para realçar sua beleza natural — com
            tecnologia, produtos de alta qualidade e um atendimento verdadeiramente personalizado.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div
            v-for="item in diferenciais"
            :key="item.title"
            class="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 space-y-3 transition-colors duration-300 hover:border-orange-500/40"
          >
            <div class="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <LandingIcon :icon="item.icon" class="w-5 h-5 text-orange-500" />
            </div>
            <h4 class="font-sans text-sm font-bold text-zinc-100 uppercase tracking-wider">
              {{ item.title }}
            </h4>
            <p class="font-sans text-zinc-400 text-xs leading-relaxed">{{ item.description }}</p>
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
    description: 'Atendimento feito pela própria dona do salão, com resultados que superam expectativas.'
  }
]
</script>
