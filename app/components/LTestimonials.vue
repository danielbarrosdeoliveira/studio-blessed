<template>
  <section id="testimonials" class="py-20 md:py-28 bg-bg">
    <div class="max-w-[1400px] mx-auto px-8 lg:px-12">
      <div class="text-center mb-16 space-y-2">
        <span class="font-sans text-xs uppercase tracking-[0.2em] text-primary font-semibold">Depoimentos</span>
        <h2 class="font-serif text-4xl md:text-5xl text-primary-foreground leading-tight">
          O que nossas clientes dizem
        </h2>
        <p class="font-sans text-muted-foreground text-base italic max-w-xl mx-auto">
          A satisfação de quem vive a experiência Studio Blessed.
        </p>
      </div>

      <div class="relative max-w-5xl mx-auto">
        <div class="overflow-hidden">
          <div class="flex" :class="{ 'transition-transform duration-500 ease-in-out': transitionEnabled }"
            :style="{ transform: `translateX(-${currentIndex * 100}%)` }">
            <div v-for="(depo, i) in displayItems" :key="i" class="min-w-full md:min-w-[50%] px-3">
              <div class="bg-bg border border-border rounded-xl p-8 h-full shadow-sm flex flex-col">
                <Icon icon="lucide:quote" class="w-8 h-8 text-primary/20 mb-4" />
                <p class="font-sans text-muted-foreground italic leading-relaxed mb-6">
                  "{{ depo.text }}"
                </p>
                <div class="flex items-center gap-3 mt-auto">
                  <img v-if="depo.photo" :src="depo.photo" :alt="depo.name"
                    class="w-10 h-10 rounded-full object-cover" />
                  <div v-else
                    class="w-10 h-10 rounded-full bg-neutral-800/50 flex items-center justify-center font-serif font-bold text-primary-400">
                    {{ depo.name.charAt(0) }}
                  </div>
                  <div>
                    <p class="font-sans font-semibold text-neutral-100 text-sm">{{ depo.name }}</p>
                    <div class="flex gap-0.5">
                      <span v-for="s in depo.rating" :key="s" class="text-primary-400 text-xs">★</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-bg border border-border shadow-md flex items-center justify-center text-primary-foreground hover:text-primary transition-all duration-300"
          @click="prev">
          <Icon icon="lucide:chevron-left" class="w-5 h-5" />
        </button>
        <button
          class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-bg border border-border shadow-md flex items-center justify-center text-primary-foreground hover:text-primary transition-all duration-300"
          @click="next">
          <Icon icon="lucide:chevron-right" class="w-5 h-5" />
        </button>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const currentIndex = ref(0);
const transitionEnabled = ref(true);

const depoimentos = [
  {
    name: "Maria Fátima de Brito Silva",
    rating: 5,
    text: "Atendimento excelente, Studio lindo! Amo vim cuidar das minhas sobrancelhas aqui.",
  },
  {
    name: "Josiane Andriolli",
    rating: 5,
    photo: "/testimonials/josiane-andriolli.png",
    text: "Incríveis! Parabéns pelo atendimento!",
  },
  {
    name: "Tamiris Ignacio",
    rating: 5,
    text: "A Carol é maravilhosa, uma super profissional, detalhista, perfeccionista, se coloca no lugar da cliente sempre! O ambiente (espaço) é acolhedor, descontraído, com bons assuntos quando está cheio rsrs.. aaaamo! De 0 a 10, nota 1000!",
  },
  {
    name: "Barbara Lucio",
    rating: 4,
    photo: "/testimonials/barbara-lucio.png",
    text: "Atendimento maravilhoso, lugar limpo, organizado e aconchegante! Recomendo muito",
  },
  {
    name: "Stephani Oliveira",
    rating: 5,
    photo: "/testimonials/stephani-oliveira.png",
    text: "Todas a vezes em que fui atendida desde 2022, o trabalho sempre foi feito com muito amor e dedicação, sempre trazendo o melhor para nós clientes, avaliação do seu trabalho seria pouco para o tamanho da profissional que você é Cá, que Deus te abençoe e você voe cada vez mais alto 🙏🏽❤️"
  },
  {
    name: "Ianny Sousa",
    rating: 5,
    text: "Atendimento incrível ✨❤️",
  }
];

const displayItems = [...depoimentos, ...depoimentos, ...depoimentos];

function next() {
  if (currentIndex.value < depoimentos.length - 1) {
    currentIndex.value++;
  } else {
    currentIndex.value = depoimentos.length;
    setTimeout(() => snapTo(0), 500);
  }
}

function prev() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  } else {
    snapTo(depoimentos.length - 1);
  }
}

function snapTo(index: number) {
  transitionEnabled.value = false;
  currentIndex.value = index;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      transitionEnabled.value = true;
    });
  });
}
</script>
