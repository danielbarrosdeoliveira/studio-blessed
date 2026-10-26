<template>
  <section class="py-20 md:py-28 bg-bg">
    <div class="max-w-[1400px] mx-auto px-8 lg:px-12">
      <div class="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-16 gap-8">
        <div class="max-w-lg">
          <span class="font-sans text-xs uppercase tracking-[0.2em] text-primary font-semibold">01 / Pilares</span>
          <h2 class="font-serif text-4xl md:text-5xl text-primary-foreground mt-3 leading-tight">
            Nossa Essência
          </h2>
        </div>
        <p class="font-sans text-muted-foreground text-base leading-relaxed max-w-xl lg:text-right">
          No Studio Blessed, cada detalhe é pensado para oferecer uma experiência única de beleza e bem-estar.
          Nossos pilares refletem o compromisso com a excelência.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div v-for="pilar in pilares" :key="pilar.title" class="text-center space-y-5 group">
          <div class="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300">
            <Icon :icon="pilar.icon" class="w-10 h-10 text-primary" />
          </div>
          <h3 class="font-sans text-lg uppercase tracking-[0.15em] text-primary-foreground font-semibold">
            {{ pilar.title }}
          </h3>
          <p class="font-sans text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
            {{ pilar.description }}
          </p>
          <NuxtLink
            :to="pilar.link"
            class="inline-block font-sans text-xs uppercase tracking-wider text-primary border border-primary/30 rounded-full px-6 py-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
            {{ pilar.cta }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
const pilares = [
  {
    icon: "lucide:compass",
    title: "Nosso Salão",
    description:
      "Um ambiente acolhedor e premium onde cada detalhe é pensado para o seu bem-estar e satisfação.",
    link: "https://agenda.studioblessed.com.br",
    cta: "Conhecer",
  },
  {
    icon: "lucide:heart",
    title: "Amamos Atender",
    description:
      "Atendimento personalizado e acolhedor, porque cada cliente é única e merece toda nossa dedicação.",
    link: "https://agenda.studioblessed.com.br",
    cta: "Agendar",
  },
  {
    icon: "lucide:gift",
    title: "Vale Presente",
    description:
      "Presenteie quem você ama com uma experiência de beleza e cuidado no Studio Blessed.",
    link: "https://agenda.studioblessed.com.br",
    cta: "Presentear",
  },
];
</script>
