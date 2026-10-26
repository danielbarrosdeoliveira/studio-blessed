<template>
  <section id="services" class="py-20 md:py-28 bg-bg">
    <div class="max-w-[1400px] mx-auto px-8 lg:px-12">
      <div class="flex flex-col items-center text-center mb-16">
        <span class="font-sans text-xs uppercase tracking-[0.2em] text-primary font-semibold">04 / Serviços</span>
        <h2 class="font-serif text-4xl md:text-5xl text-primary-foreground mt-3 leading-tight">
          Nossos Serviços
        </h2>
        <p class="font-sans text-muted-foreground text-base leading-relaxed max-w-xl mt-4">
          Do olhar ao bem-estar, cada detalhe pensado para realçar sua beleza natural.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
        <div v-for="servico in servicos" :key="servico.name" class="text-center group">
          <div class="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300 mb-5">
            <Icon :icon="servico.icon" class="w-7 h-7 text-primary" />
          </div>
          <h3 class="font-sans text-base uppercase tracking-[0.15em] text-neutral-100 font-semibold mb-2">
            {{ servico.name }}
          </h3>
          <p class="font-sans text-neutral-300 text-sm leading-relaxed">
            {{ servico.desc }}
          </p>
          <div class="flex items-center justify-center">
            <span class="font-bold text-primary-400">{{ servico.price }}</span>
          </div>
        </div>
      </div>

      <div class="flex justify-center mt-16">
        <a
          href="https://agenda.studioblessed.com.br"
          class="rounded-full bg-primary text-primary-foreground text-sm uppercase tracking-wider px-10 py-4 font-semibold hover:bg-primary/90 transition-all duration-300 shadow-lg">
          Agende Seu Horário
        </a>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
const servicos = [
  { name: "Extensão de Cílios", icon: "lucide:eye", desc: "Fios de seda que realçam o olhar com volume e curvatura natural.", price: "R$ 180" },
  { name: "Lash Lifting", icon: "lucide:scan", desc: "Curvatura duradoura que valoriza seus cílios naturais.", price: "R$ 120" },
  { name: "Sobrancelha", icon: "lucide:sparkles", desc: "Design personalizado para moldar e destacar sua expressão.", price: "R$ 60" },
  { name: "Hidra Gloss Lips", icon: "lucide:droplets", desc: "Hidratação profunda e revitalização labial sem agulhas para lábios viçosos.", price: "R$ 90" },
  { name: "Epilação", icon: "lucide:spray-can", desc: "Técnicas suaves para uma pele lisinha e bem cuidada.", price: "R$ 80" },
  { name: "Limpeza de Pele", icon: "lucide:sparkle", desc: "Limpeza profunda que revitaliza e renova sua pele.", price: "R$ 150" },
  { name: "Brow Lamination", icon: "lucide:wand", desc: "Modelagem e fixação dos fios para sobrancelhas alinhadas.", price: "R$ 110" },
  { name: "Alongamento de Unhas", icon: "lucide:flower-2", desc: "Unhas alongadas com acabamento impecável e durabilidade.", price: "R$ 70" },
];
</script>
