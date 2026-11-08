<template>
  <section id="hero" class="relative flex min-h-[90vh] items-center overflow-hidden bg-zinc-950">
    <div class="absolute inset-0">
      <video
        src="/videos/adicionando-cilios.mp4"
        autoplay
        muted
        loop
        playsinline
        class="size-full object-cover"
      />
      <div class="absolute inset-0 bg-linear-to-r from-zinc-950 via-zinc-950/80 to-zinc-950/40" />
    </div>

    <div class="relative z-10 mx-auto w-full max-w-350 px-8 py-20 lg:px-12">
      <div class="max-w-2xl">
        <span
          class="mb-6 inline-block font-sans text-xs font-semibold tracking-[0.25em] text-orange-500 uppercase"
        >
          Studio Blessed · Beleza & Bem-estar
        </span>
        <!-- eslint-disable-next-line tailwindcss/no-unnecessary-arbitrary-value -- `leading-1.05` não existe no Tailwind v4: line-height é unitless, não tem equivalente na escala. -->
        <h1 class="mb-8 font-serif text-5xl leading-[1.05] text-zinc-50 md:text-6xl lg:text-7xl">
          Realce sua beleza,<br />
          descubra sua<br />
          melhor versão.
        </h1>
        <p class="mb-12 max-w-xl font-sans text-lg text-zinc-300 md:text-xl">
          Venha sentir-se única, valorizada e bem cuidada.
        </p>
        <div class="flex flex-wrap gap-4">
          <NuxtLink
            to="/agendamento"
            class="rounded-full bg-orange-500 px-8 py-4 text-sm font-semibold tracking-wider whitespace-nowrap text-zinc-950 uppercase shadow-lg shadow-orange-500/20 transition-all duration-300 hover:bg-orange-400"
          >
            Agendar Agora
          </NuxtLink>
          <a
            href="#services"
            class="rounded-full border border-zinc-700 px-8 py-4 text-sm font-medium tracking-wider text-zinc-100 uppercase transition-all duration-300 hover:border-orange-500 hover:text-orange-500"
          >
            Saiba Mais
          </a>
        </div>
      </div>
    </div>

    <div class="absolute right-8 bottom-8 z-10 lg:right-12">
      <div
        class="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/90 px-5 py-4 shadow-xl backdrop-blur-sm"
      >
        <div class="flex -space-x-3">
          <div
            v-for="i in 3"
            :key="i"
            class="flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-800 bg-zinc-800"
          >
            <img
              :src="`https://randomuser.me/api/portraits/women/${i}.jpg`"
              alt=""
              class="size-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
        <div class="text-left">
          <p class="text-sm font-semibold text-zinc-100">+3.000 clientes</p>
          <p class="text-xs text-zinc-400">atendidas com carinho</p>
        </div>
      </div>
    </div>
  </section>
</template>
