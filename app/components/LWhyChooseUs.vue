<template>
  <section class="py-20 md:py-28 bg-zinc-950">
    <div class="max-w-[1400px] mx-auto px-8 lg:px-12">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div class="space-y-8">
          <span class="font-sans text-xs uppercase tracking-[0.2em] text-zinc-400 font-semibold">05 / Diferenciais</span>
          <h2 class="font-serif text-4xl md:text-5xl text-zinc-100 leading-tight">
            Por que escolher<br />o Studio Blessed?
          </h2>
          <div class="grid grid-cols-2 gap-8">
            <div v-for="item in diferenciais" :key="item.title"
              class="bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-800 space-y-2">
              <div class="w-10 h-10 rounded-full bg-zinc-950/20 flex items-center justify-center">
                <Icon :icon="item.icon" class="w-5 h-5 text-zinc-400" />
              </div>
              <h4 class="font-sans text-sm font-bold text-zinc-100 uppercase tracking-wider">{{ item.title }}</h4>
              <p class="font-sans text-zinc-400 text-xs leading-relaxed">{{ item.description }}</p>
            </div>
          </div>
        </div>

        <div class="space-y-8">
          <p class="font-sans text-zinc-400/80 text-base leading-relaxed">
            Do olhar ao bem-estar, cada detalhe pensado para realçar sua beleza natural.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
const diferenciais = [
  {
    icon: "lucide:monitor",
    title: "Agendamento Online",
    description: "Agende seu horário pelo site, sem precisar ligar ou enviar WhatsApp.",
  },
  {
    icon: "lucide:map-pin",
    title: "Localização Premium",
    description: "Espaço aconchegante no Parque Viana, Barueri, pensado para seu conforto.",
  },
  {
    icon: "lucide:heart",
    title: "Atendimento Premium",
    description: "Produtos de alta qualidade e técnicas especializadas para o melhor resultado.",
  },
  {
    icon: "lucide:smile",
    title: "Resultados Garantidos",
    description: "Profissionais experientes que entregam resultados que superam expectativas.",
  },
];
</script>