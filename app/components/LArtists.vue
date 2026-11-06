<template>
  <section id="artists" class="py-20 md:py-28 bg-zinc-950">
    <div class="max-w-[1400px] mx-auto px-8 lg:px-12">
      <div class="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-16 gap-8">
        <div class="max-w-lg">
          <span class="font-sans text-xs uppercase tracking-[0.2em] text-zinc-400 font-semibold">03 / Equipe</span>
          <h2 class="font-serif text-4xl md:text-5xl text-zinc-100 mt-3 leading-tight">
            Nossa Equipe
          </h2>
        </div>
        <NuxtLink to="/agendamento"
          class="rounded-full bg-zinc-950 text-zinc-400 text-sm uppercase tracking-wider px-8 py-4 font-semibold hover:bg-zinc-950/90 transition-all duration-300 shadow-lg whitespace-nowrap"
        >
          Agendar Agora
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div v-for="member in equipe" :key="member.id" class="text-center space-y-6">
          <div class="w-20 h-20 mx-auto rounded-full overflow-hidden border border-zinc-800/50">
            <img :src="member.photo" :alt="member.name" class="w-full h-full object-cover" loading="lazy" />
          </div>
          <h3 class="font-serif text-2xl md:text-3xl text-zinc-100 mb-2">
            {{ member.name }}
          </h3>
          <p class="font-sans text-zinc-400/80 text-sm">
            {{ member.role }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
const equipe = [
  {
    id: 1,
    name: "Caroline Silva",
    role: "Dona e Diretora",
    photo: "/images/ceo-caroline-silva.jpg",
  },
  {
    id: 2,
    name: "Daniel Oliveira",
    role: "Diretor Comercial",
    photo: "/images/cto-cmo-daniel-oliveira.jpg",
  },
]
</script>