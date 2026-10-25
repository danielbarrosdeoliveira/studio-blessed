<template>
  <section id="services" class="py-20 md:py-28 bg-white">
    <div class="max-w-[1400px] mx-auto px-8 lg:px-12">
      <div class="flex flex-col items-center text-center mb-16">
        <span class="font-sans text-xs uppercase tracking-[0.2em] text-[#10b981] font-semibold">04 / Serviços</span>
        <h2 class="font-serif text-4xl md:text-5xl text-[#0f172a] mt-3 leading-tight">
          Nossos Serviços
        </h2>
        <p class="font-sans text-[#f59e0b] text-base leading-relaxed max-w-xl mt-4">
          Do olhar ao bem-estar, cada detalhe pensado para realçar sua beleza natural.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
        <div v-for="servico in servicos" :key="servico.name" class="text-center group">
          <div class="w-14 h-14 mx-auto rounded-2xl bg-[#10b981]/10 flex items-center justify-center group-hover:bg-[#10b981]/20 transition-all duration-300 mb-5">
            <Icon :icon="servico.icon" class="w-7 h-7 text-[#10b981]" />
          </div>
          <h3 class="font-sans text-base uppercase tracking-[0.15em] text-[#0f172a] font-semibold mb-2">
            {{ servico.name }}
          </h3>
          <p class="font-sans text-[#f59e0b] text-sm leading-relaxed">
            {{ servico.desc }}
          </p>
        </div>
      </div>

      <div class="flex justify-center mt-16">
        <a
          href="https://agenda.studioblessed.com.br"
          class="rounded-full bg-[#0f172a] text-white text-sm uppercase tracking-wider px-10 py-4 font-semibold hover:bg-[#0f172a]/80 transition-all duration-300 shadow-lg"
        >
          Agende Seu Horário
        </a>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
const servicos = [
  { name: "Extensão de Cílios", icon: "lucide:eye", desc: "Fios de seda que realçam o olhar com volume e curvatura natural." },
  { name: "Lash Lifting", icon: "lucide:scan", desc: "Curvatura duradoura que valoriza seus cílios naturais." },
  { name: "Sobrancelha", icon: "lucide:sparkles", desc: "Design personalizado para moldar e destacar sua expressão." },
  { name: "Hidra Gloss Lips", icon: "lucide:droplets", desc: "Hidratação profunda e revitalização labial sem agulhas para lábios viçosos." },
  { name: "Epilação", icon: "lucide:spray-can", desc: "Técnicas suaves para uma pele lisinha e bem cuidada." },
  { name: "Limpeza de Pele", icon: "lucide:sparkle", desc: "Limpeza profunda que revitaliza e renova sua pele." },
  { name: "Brow Lamination", icon: "lucide:wand", desc: "Modelagem e fixação dos fios para sobrancelhas alinhadas." },
  { name: "Alongamento de Unhas", icon: "lucide:flower-2", desc: "Unhas alongadas com acabamento impecável e durabilidade." },
];
</script>
