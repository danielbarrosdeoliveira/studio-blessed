<template>
  <section id="testimonials" class="bg-zinc-900/40 py-20 md:py-28">
    <div class="mx-auto max-w-350 px-8 lg:px-12">
      <div class="mb-16 space-y-2 text-center">
        <span class="font-sans text-xs font-semibold tracking-[0.2em] text-orange-500 uppercase"
          >Depoimentos</span
        >
        <h2 class="font-serif text-4xl/tight text-zinc-50 md:text-5xl">
          O que nossas clientes dizem
        </h2>
        <p class="mx-auto max-w-xl font-sans text-base text-zinc-400">
          A satisfação de quem vive a experiência Studio Blessed.
        </p>
      </div>

      <div class="relative mx-auto max-w-5xl">
        <div class="overflow-hidden">
          <div
            class="flex items-stretch"
            :class="{ 'transition-transform duration-500 ease-in-out': transitionEnabled }"
            :style="{ transform: `translateX(-${currentIndex * slideWidth}%)` }"
          >
            <div
              v-for="(depo, i) in displayItems"
              :key="i"
              class="flex min-w-full px-3 md:min-w-[50%]"
            >
              <div
                class="flex size-full min-h-70 flex-col rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-8 shadow-sm"
              >
                <LandingIcon icon="lucide:quote" class="mb-4 size-8 text-orange-500/70" />
                <p class="mb-6 grow font-sans leading-relaxed text-zinc-300 italic">
                  “{{ depo.text }}”
                </p>
                <div class="mt-auto flex items-center gap-3">
                  <img
                    v-if="depo.photo"
                    :src="depo.photo"
                    :alt="depo.name"
                    class="size-10 rounded-full object-cover"
                  />
                  <div
                    v-else
                    class="flex size-10 items-center justify-center rounded-full bg-zinc-800 font-serif font-bold text-orange-500"
                  >
                    {{ depo.name.charAt(0) }}
                  </div>
                  <div>
                    <p class="font-sans text-sm font-semibold text-zinc-100">{{ depo.name }}</p>
                    <div class="flex gap-0.5">
                      <span v-for="s in depo.rating" :key="s" class="text-xs text-orange-500"
                        >★</span
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          class="absolute top-1/2 left-0 flex size-10 -translate-x-4 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-md transition-all duration-300 hover:border-orange-500 hover:text-orange-500"
          aria-label="Depoimento anterior"
          @click="prev"
        >
          <LandingIcon icon="lucide:chevron-left" class="size-5" />
        </button>
        <button
          class="absolute top-1/2 right-0 flex size-10 translate-x-4 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-md transition-all duration-300 hover:border-orange-500 hover:text-orange-500"
          aria-label="Próximo depoimento"
          @click="next"
        >
          <LandingIcon icon="lucide:chevron-right" class="size-5" />
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'

const currentIndex = ref(0)
const transitionEnabled = ref(true)

const isDesktop = useMediaQuery('(min-width: 768px)')
const slideWidth = computed(() => (isDesktop.value ? 50 : 100))

const depoimentos = [
  {
    name: 'Maria Fátima de Brito Silva',
    rating: 5,
    text: 'Atendimento excelente, Studio lindo! Amo vim cuidar das minhas sobrancelhas aqui.'
  },
  {
    name: 'Josiane Andriolli',
    rating: 5,
    photo: '/testimonials/josiane-andriolli.png',
    text: 'Incríveis! Parabéns pelo atendimento!'
  },
  {
    name: 'Tamiris Ignacio',
    rating: 5,
    text: 'A Carol é maravilhosa, uma super profissional, detalhista, perfeccionista, se coloca no lugar da cliente sempre! O ambiente (espaço) é acolhedor, descontraído, com bons assuntos quando está cheio rsrs.. aaaamo! De 0 a 10, nota 1000!'
  },
  {
    name: 'Barbara Lucio',
    rating: 4,
    photo: '/testimonials/barbara-lucio.png',
    text: 'Atendimento maravilhoso, lugar limpo, organizado e aconchegante! Recomendo muito'
  },
  {
    name: 'Stephani Oliveira',
    rating: 5,
    photo: '/testimonials/stephani-oliveira.png',
    text: 'Todas as vezes em que fui atendida desde 2022, o trabalho sempre foi feito com muito amor e dedicação, sempre trazendo o melhor para nós clientes, avaliação do seu trabalho seria pouco para o tamanho da profissional que você é Cá, que Deus te abençoe e você voe cada vez mais alto 🙏🏽❤️'
  },
  {
    name: 'Ianny Sousa',
    rating: 5,
    text: 'Atendimento incrível ✨❤️'
  }
]

const displayItems = [...depoimentos, ...depoimentos, ...depoimentos]

function next() {
  if (currentIndex.value < depoimentos.length - 1) {
    currentIndex.value++
  } else {
    currentIndex.value = depoimentos.length
    setTimeout(() => snapTo(0), 500)
  }
}

function prev() {
  if (currentIndex.value > 0) {
    currentIndex.value--
  } else {
    snapTo(depoimentos.length - 1)
  }
}

function snapTo(index: number) {
  transitionEnabled.value = false
  currentIndex.value = index
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      transitionEnabled.value = true
    })
  })
}
</script>
