<template>
  <section class="py-20 md:py-28 bg-muted">
    <div class="max-w-[1400px] mx-auto px-8 lg:px-12">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div class="space-y-8">
          <span class="font-sans text-xs uppercase tracking-[0.2em] text-primary font-semibold">05 /
            Diferenciais</span>
          <h2 class="font-serif text-4xl md:text-5xl text-primary-foreground leading-tight">
            Por que escolher<br>o Studio Blessed?
          </h2>
          <div class="grid grid-cols-2 gap-8">
            <div>
              <p class="font-serif text-5xl md:text-6xl text-primary font-bold">3.000+</p>
              <p class="font-sans text-muted-foreground text-sm mt-1">Clientes satisfeitas</p>
            </div>
            <div>
              <p class="font-serif text-5xl md:text-6xl text-primary font-bold">4+</p>
              <p class="font-sans text-muted-foreground text-sm mt-1">Anos de experiência</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-5">
          <div v-for="item in diferenciais" :key="item.title"
            class="bg-bg rounded-xl p-5 shadow-sm border border-border space-y-2">
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon :icon="item.icon" class="w-5 h-5 text-primary" />
            </div>
            <h4 class="font-sans text-sm font-bold text-primary-foreground uppercase tracking-wider">{{ item.title }}</h4>
            <p class="font-sans text-muted-foreground text-xs leading-relaxed">{{ item.description }}</p>
          </div>
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
