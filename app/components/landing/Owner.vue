<template>
  <section id="dona" class="bg-zinc-900/40 py-20 md:py-28">
    <div class="mx-auto max-w-350 px-8 lg:px-12">
      <div class="mb-16 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div class="max-w-lg">
          <span class="font-sans text-xs font-semibold tracking-[0.2em] text-orange-500 uppercase"
            >03 / A Dona</span
          >
          <h2 class="mt-3 font-serif text-4xl/tight text-zinc-50 md:text-5xl">
            Quem Cuida do Seu Horário
          </h2>
        </div>
        <NuxtLink
          to="/agendamento"
          class="rounded-full bg-orange-500 px-8 py-4 text-sm font-semibold tracking-wider whitespace-nowrap text-zinc-950 uppercase shadow-lg shadow-orange-500/20 transition-all duration-300 hover:bg-orange-400"
        >
          Agendar Agora
        </NuxtLink>
      </div>

      <div class="grid max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div
          class="mx-auto aspect-4/5 w-full max-w-sm overflow-hidden rounded-2xl border-2 border-zinc-800 ring-2 ring-orange-500/20 lg:mx-0"
        >
          <img
            src="/images/a-dona.jpg"
            alt="Caroline Silva, dona do Studio Blessed"
            class="size-full object-cover"
            loading="lazy"
          />
        </div>

        <div class="space-y-6 text-center lg:text-left">
          <h3 class="font-serif text-3xl text-zinc-50 md:text-4xl">Caroline Silva</h3>
          <p class="font-sans text-sm font-semibold tracking-[0.2em] text-orange-500 uppercase">
            Dona e Fundadora
          </p>
          <p class="mx-auto max-w-lg font-sans text-base/relaxed text-zinc-400 lg:mx-0">
            O Studio Blessed é cuidar de cada detalhe pessoalmente. Quem agenda, atende e acompanha
            cada cliente é a própria dona do salão — sem intermediários, sem surpresas e com a mesma
            dedicação do primeiro ao último atendimento.
          </p>
          <p class="mx-auto max-w-lg font-sans text-base/relaxed text-zinc-400 lg:mx-0">
            Do olhar ao bem-estar, cada técnica é escolhida pensando em realçar a sua beleza
            natural, com produtos de alta qualidade e um atendimento verdadeiramente personalizado.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
