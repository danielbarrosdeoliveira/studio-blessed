<template>
  <section id="hero" class="relative min-h-[80vh] flex items-center overflow-hidden bg-zinc-950">
    <div class="absolute inset-0">
      <video src="/videos/adicionando-cilios.mp4" autoplay muted loop playsinline class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-zinc-950/80" />
    </div>

    <div class="relative z-10 w-full max-w-[1400px] mx-auto px-8 lg:px-12">
      <div class="max-w-2xl">
        <h1 class="font-serif text-4xl md:text-5xl lg:text-6xl text-zinc-100 leading-tight mb-6">
          Realce sua beleza,<br />
          descubra sua<br />
          melhor versão.
        </h1>
        <p class="font-sans text-lg md:text-xl text-zinc-100/90 max-w-xl mb-10">
          Venha sentir-se única, valorizada e bem cuidada
        </p>
        <div class="flex flex-wrap gap-4">
          <NuxtLink to="/agendamento"
            class="rounded-full bg-orange-500 text-zinc-950 text-sm uppercase tracking-wider px-8 py-4 font-semibold hover:bg-orange-500/90 transition-all duration-300 shadow-lg whitespace-nowrap">
            Agendar Agora
          </NuxtLink>
          <a href="#services"
            class="rounded-full border border-zinc-800 text-zinc-100 text-sm uppercase tracking-wider px-8 py-4 font-medium hover:bg-zinc-950/10 transition-all duration-300">
            Saiba Mais
          </a>
        </div>
      </div>
    </div>

    <div class="absolute bottom-8 right-8 lg:right-12 z-10">
      <div class="bg-zinc-950/95 backdrop-blur-sm rounded-xl px-5 py-4 shadow-xl flex items-center gap-4">
        <div class="flex -space-x-3">
          <div v-for="i in 3" :key="i"
            class="w-10 h-10 rounded-full border-2 border-zinc-800 bg-zinc-950/20 flex items-center justify-center overflow-hidden">
            <img :src="`https://i.pravatar.cc/80?img=${i + 10}`" alt="" class="w-full h-full object-cover"
              loading="lazy" />
          </div>
          <div class="text-left">
            <p class="text-zinc-100 text-sm font-semibold">+3.000 clientes</p>
            <p class="text-zinc-100/80 text-xs">atendidas com carinho</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
</script>