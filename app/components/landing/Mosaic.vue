<template>
  <section id="about" class="bg-zinc-900/40 py-20 md:py-28">
    <div class="mx-auto max-w-350 px-8 lg:px-12">
      <div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div class="relative">
          <div class="relative grid grid-cols-5 gap-4">
            <div class="col-span-3">
              <img
                src="/images/ceo-caroline-silva.jpg"
                alt="Studio Blessed"
                class="h-100 w-full rounded-2xl object-cover shadow-lg"
                loading="lazy"
              />
            </div>
            <div class="col-span-2 mt-12">
              <img
                src="/images/about-2.jpeg"
                alt="Cuidados capilares"
                class="h-75 w-full rounded-2xl object-cover shadow-lg"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <span class="font-sans text-xs font-semibold tracking-[0.2em] text-orange-500 uppercase"
            >02 / Quem Somos</span
          >
          <h2 class="font-serif text-4xl/tight text-zinc-50 md:text-5xl">
            Um espaço feito para você
          </h2>
          <div class="space-y-5 font-sans text-base/relaxed text-zinc-400">
            <p class="indent-8">
              A história do Studio Blessed é, acima de tudo, uma jornada de resiliência. O sonho
              começou na sala da casa da mãe de <strong class="text-zinc-100">Caroline</strong>,
              onde ela e a irmã deram os primeiros passos. Entre quartos improvisados e a conquista
              do primeiro espaço comercial, Caroline viu sua estrutura mudar e parcerias ficarem
              pelo caminho, mas sua paixão pela beleza e seu propósito nunca vacilaram.
            </p>
            <p class="indent-8">
              Hoje, sob a liderança exclusiva de Caroline, o
              <em class="mx-1 font-serif text-2xl text-orange-500 not-italic">Studio Blessed</em>
              reflete a força de uma mulher que escolheu continuar. Cada detalhe do atendimento
              personalizado carrega sua essência e dedicação total. Aqui, seu momento de autocuidado
              é sagrado.
            </p>
          </div>
          <NuxtLink
            to="/agendamento"
            class="inline-block rounded-full bg-orange-500 px-8 py-4 text-sm font-semibold tracking-wider whitespace-nowrap text-zinc-950 uppercase shadow-lg shadow-orange-500/20 transition-all duration-300 hover:bg-orange-400"
          >
            Agendar Agora
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
