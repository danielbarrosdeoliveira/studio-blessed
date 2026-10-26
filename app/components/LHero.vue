<template>
  <section id="hero" class="relative min-h-[80vh] flex items-center overflow-hidden bg-primary text-primary-foreground">
    <div class="absolute inset-0">
      <video src="/videos/adicionando-cilios.mp4" autoplay muted loop playsinline class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-primary/70" />
    </div>

    <div class="relative z-10 w-full max-w-[1400px] mx-auto px-8 lg:px-12">
      <div class="max-w-2xl">
        <h1 class="font-serif text-4xl md:text-5xl lg:text-6xl text-primary-foreground leading-tight mb-6">
          Realce sua beleza,<br />
          descubra sua<br />
          melhor versão.
        </h1>
        <p class="font-sans text-lg md:text-xl text-primary-foreground/90 max-w-xl mb-10">
          Venha sentir-se única, valorizada e bem cuidada
        </p>
        <div class="flex flex-wrap gap-4">
          <a
            href="https://agenda.studioblessed.com.br"
            class="rounded-full bg-primary-foreground text-primary text-sm uppercase tracking-wider px-8 py-4 font-medium hover:bg-primary-foreground/90 transition-all duration-300 shadow-lg">
            Agendar Agora
          </a>
          <a
            href="#services"
            class="rounded-full border border-primary-foreground/40 text-primary-foreground text-sm uppercase tracking-wider px-8 py-4 font-medium hover:bg-primary-foreground/10 transition-all duration-300">
            Saiba Mais
          </a>
        </div>
      </div>
    </div>

    <div class="absolute bottom-8 right-8 lg:right-12 z-10">
      <div class="bg-primary-foreground/95 backdrop-blur-sm rounded-xl px-5 py-4 shadow-xl flex items-center gap-4">
        <div class="flex -space-x-3">
          <div v-for="i in 3" :key="i"
            class="w-10 h-10 rounded-full border-2 border-primary-foreground bg-primary/20 flex items-center justify-center overflow-hidden">
            <img :src="`https://i.pravatar.cc/80?img=${i + 10}`" alt="" class="w-full h-full object-cover"
              loading="lazy" />
          </div>
        </div>
        <div class="text-left">
          <p class="text-primary-foreground text-sm font-semibold">+3.000 clientes</p>
          <p class="text-primary-foreground/80 text-xs">atendidas com carinho</p>
        </div>
      </div>
    </div>
  </section>
</template>
