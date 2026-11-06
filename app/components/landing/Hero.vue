<template>
  <section id="hero" class="relative min-h-[90vh] flex items-center overflow-hidden bg-zinc-950">
    <div class="absolute inset-0">
      <video src="/videos/adicionando-cilios.mp4" autoplay muted loop playsinline class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-zinc-950/40" />
    </div>

    <div class="relative z-10 w-full max-w-[1400px] mx-auto px-8 lg:px-12 py-20">
      <div class="max-w-2xl">
        <span class="inline-block font-sans text-xs uppercase tracking-[0.25em] text-orange-500 font-semibold mb-6">
          Studio Blessed · Beleza & Bem-estar
        </span>
        <h1 class="font-serif text-5xl md:text-6xl lg:text-7xl text-zinc-50 leading-[1.05] mb-8">
          Realce sua beleza,<br />
          descubra sua<br />
          melhor versão.
        </h1>
        <p class="font-sans text-lg md:text-xl text-zinc-300 max-w-xl mb-12">
          Venha sentir-se única, valorizada e bem cuidada.
        </p>
        <div class="flex flex-wrap gap-4">
          <NuxtLink
            to="/agendamento"
            class="rounded-full bg-orange-500 text-zinc-950 text-sm uppercase tracking-wider px-8 py-4 font-semibold hover:bg-orange-400 transition-all duration-300 shadow-lg shadow-orange-500/20 whitespace-nowrap"
          >
            Agendar Agora
          </NuxtLink>
          <a
            href="#services"
            class="rounded-full border border-zinc-700 text-zinc-100 text-sm uppercase tracking-wider px-8 py-4 font-medium hover:border-orange-500 hover:text-orange-500 transition-all duration-300"
          >
            Saiba Mais
          </a>
        </div>
      </div>
    </div>

    <div class="absolute bottom-8 right-8 lg:right-12 z-10">
      <div class="bg-zinc-900/90 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-xl border border-zinc-800 flex items-center gap-4">
        <div class="flex -space-x-3">
          <div
            v-for="i in 3"
            :key="i"
            class="size-10 rounded-full border-2 border-zinc-800 bg-zinc-800 flex items-center justify-center overflow-hidden"
          >
            <img
              :src="`https://i.pravatar.cc/80?img=${i + 10}`"
              alt=""
              class="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
        <div class="text-left">
          <p class="text-zinc-100 text-sm font-semibold">+3.000 clientes</p>
          <p class="text-zinc-400 text-xs">atendidas com carinho</p>
        </div>
      </div>
    </div>
  </section>
</template>
