<template>
  <section id="gallery" class="py-20 md:py-28 bg-bg">
    <div class="max-w-[1400px] mx-auto px-8 lg:px-12">
      <div class="text-center mb-16 space-y-2">
        <span class="font-sans text-xs uppercase tracking-[0.2em] text-primary font-semibold">Galeria</span>
        <h2 class="font-serif text-4xl md:text-5xl text-primary-foreground leading-tight">
          Nossos Trabalhos
        </h2>
        <p class="font-sans text-muted-foreground text-base italic max-w-xl mx-auto">
          Resultados que falam por si.
        </p>
      </div>

      <div class="flex flex-wrap justify-center gap-3 mb-12">
        <button
          v-for="cat in categorias"
          :key="cat"
          @click="selectedCategory = cat"
          class="px-6 py-2 rounded-full text-sm font-medium transition-all duration-300"
          :class="selectedCategory === cat
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/50'"
        >
          {{ cat }}
        </button>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="(img, i) in filteredImagens"
          :key="i"
          class="group overflow-hidden rounded-lg"
          :class="i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-[4/5]'"
        >
          <img
            :src="img.src"
            :alt="`Galeria Studio Blessed ${img.category}`"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';

const imagens = [
  { src: "/images/trabalhos/extensao-cilios-1.jpeg", category: "Extensão de Cílios" },
  { src: "/images/trabalhos/hydra-gloss.jpeg", category: "Hydra Gloss" },
  { src: "/images/trabalhos/extensao-cilios-2.jpeg", category: "Extensão de Cílios" },
  { src: "/images/trabalhos/extensao-cilios-3.jpeg", category: "Extensão de Cílios" },
  { src: "/images/trabalhos/extensao-cilios-4.jpeg", category: "Extensão de Cílios" },
  { src: "/images/trabalhos/sobrancelha.jpeg", category: "Sobrancelha" },
  { src: "/images/trabalhos/extensao-cilios-5.jpeg", category: "Extensão de Cílios" },
  { src: "/images/trabalhos/extensao-cilios-6.jpeg", category: "Extensão de Cílios" },
  { src: "/images/trabalhos/extensao-cilios-7.jpeg", category: "Extensão de Cílios" },
  { src: "/images/trabalhos/sobrancelha-cilios.jpeg", category: "Cílios & Sobrancelha" },
  { src: "/images/trabalhos/brown-lamination.jpeg", category: "Brow Lamination" },
]

const categorias = ['Todas', ...new Set(imagens.map(i => i.category))]

const selectedCategory = ref('Todas')

const filteredImagens = computed(() =>
  selectedCategory.value === 'Todas'
    ? imagens
    : imagens.filter(i => i.category === selectedCategory.value)
)
</script>
