<template>
  <section id="gallery" class="py-20 md:py-28 bg-zinc-950">
    <div class="max-w-[1400px] mx-auto px-8 lg:px-12">
      <div class="text-center mb-16 space-y-2">
        <span class="font-sans text-xs uppercase tracking-[0.2em] text-orange-500 font-semibold">Galeria</span>
        <h2 class="font-serif text-4xl md:text-5xl text-zinc-50 leading-tight">
          Nossos Trabalhos
        </h2>
        <p class="font-sans text-zinc-400 text-base max-w-xl mx-auto">
          Resultados que falam por si.
        </p>
      </div>

      <div class="flex flex-wrap justify-center gap-3 mb-12">
        <button
          v-for="cat in categorias"
          :key="cat"
          class="px-6 py-2 rounded-full text-sm font-medium border transition-all duration-300"
          :class="selectedCategory === cat
            ? 'bg-orange-500 text-zinc-950 border-orange-500'
            : 'bg-zinc-900/60 text-zinc-300 border-zinc-800 hover:border-orange-500/50'"
          @click="selectedCategory = cat"
        >
          {{ cat }}
        </button>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="img in filteredImagens"
          :key="img.id"
          class="rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-orange-500/10 bg-zinc-900"
        >
          <img
            :src="img.url"
            :alt="img.alt"
            class="w-full h-[250px] object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const categorias = ['Todos', 'Cílios', 'Sobrancelha', 'Unhas', 'Peelings']
const imagens = [
  { id: 1, url: '/images/gallery-1.jpg', alt: 'Cliente com cílios' },
  { id: 2, url: '/images/gallery-2.jpg', alt: 'Sobrancelha feita' },
  { id: 3, url: '/images/gallery-3.jpg', alt: 'Unhas alongadas' },
  { id: 4, url: '/images/gallery-4.jpg', alt: 'Peeling de pele' },
  { id: 5, url: '/images/gallery-5.jpg', alt: 'Maquiagem' },
  { id: 6, url: '/images/gallery-6.jpg', alt: 'Tratamento capilar' }
]

const selectedCategory = ref('Todos')
const filteredImagens = computed(() => {
  if (selectedCategory.value === 'Todos') {
    return imagens
  }
  return imagens.filter((img) => categorias.includes(img.alt))
})
</script>
