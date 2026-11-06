<template>
  <section id="dona" class="py-20 md:py-28 bg-zinc-900/40">
    <div class="max-w-[1400px] mx-auto px-8 lg:px-12">
      <div class="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-16 gap-8">
        <div class="max-w-lg">
          <span class="font-sans text-xs uppercase tracking-[0.2em] text-orange-500 font-semibold">03 / A Dona</span>
          <h2 class="font-serif text-4xl md:text-5xl text-zinc-50 mt-3 leading-tight">
            Quem Cuida do Seu Horário
          </h2>
        </div>
        <NuxtLink
          to="/agendamento"
          class="rounded-full bg-orange-500 text-zinc-950 text-sm uppercase tracking-wider px-8 py-4 font-semibold hover:bg-orange-400 transition-all duration-300 shadow-lg shadow-orange-500/20 whitespace-nowrap"
        >
          Agendar Agora
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center max-w-5xl">
        <div class="w-full max-w-sm mx-auto lg:mx-0 aspect-[4/5] rounded-2xl overflow-hidden border-2 border-zinc-800 ring-2 ring-orange-500/20">
          <img
            src="/images/ceo-caroline-silva.jpg"
            alt="Caroline Silva, dona do Studio Blessed"
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        <div class="space-y-6 text-center lg:text-left">
          <h3 class="font-serif text-3xl md:text-4xl text-zinc-50">
            Caroline Silva
          </h3>
          <p class="font-sans text-orange-500 text-sm uppercase tracking-[0.2em] font-semibold">
            Dona e Fundadora
          </p>
          <p class="font-sans text-zinc-400 text-base leading-relaxed max-w-lg mx-auto lg:mx-0">
            O Studio Blessed é cuidar de cada detalhe pessoalmente. Quem agenda, atende e
            acompanha cada cliente é a própria dona do salão — sem intermediários, sem
            surpresas e com a mesma dedicação do primeiro ao último atendimento.
          </p>
          <p class="font-sans text-zinc-400 text-base leading-relaxed max-w-lg mx-auto lg:mx-0">
            Do olhar ao bem-estar, cada técnica é escolhida pensando em realçar a sua
            beleza natural, com produtos de alta qualidade e um atendimento
            verdadeiramente personalizado.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
