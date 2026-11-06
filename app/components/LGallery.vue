<template>
  <section id="gallery" class="py-20 md:py-28 bg-zinc-950">
    <div class="max-w-[1400px] mx-auto px-8 lg:px-12">
      <div class="text-center mb-16 space-y-2">
        <span class="font-sans text-xs uppercase tracking-[0.2em] text-zinc-400 font-semibold">Galeria</span>
        <h2 class="font-serif text-4xl md:text-5xl text-zinc-100 leading-tight">
          Nossos Trabalhos
        </h2>
        <p class="font-sans text-zinc-400/80 text-base italic max-w-xl mx-auto">
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
            ? 'bg-zinc-950 text-zinc-100'
            : 'bg-zinc-950/80 text-zinc-400 hover:bg-zinc-950/90'"
        >
          {{ cat }}
        </button>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="(img, i) in filteredImagens"
          :key="img.id"
          class="rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:transform hover:scale-[1.02]"
        >
          <img
            :src="img.url"
            :alt="img.alt"
            class="w-full h-[250px] object-cover loading='lazy'"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
const categorias = ['Todos', 'Cílios', 'Sobrancelha', 'Unhas', 'Peelings']
const imagens = [
  { id: 1, url: '/images/gallery-1.jpg', alt: 'Cliente com cílios' },
  { id: 2, url: '/images/gallery-2.jpg', alt: 'Sobrancelha feita' },
  { id: 3, url: '/images/gallery-3.jpg', alt: 'Unhas alongadas' },
  { id: 4, url: '/images/gallery-4.jpg', alt: 'Peeling de pele' },
  { id: 5, url: '/images/gallery-5.jpg', alt: 'Maquiagem' },
  { id: 6, url: '/images/gallery-6.jpg', alt: 'Tratamento capilar' },
]

const selectedCategory = ref('Todos')
const filteredImagens = computed(() => {
  if (selectedCategory.value === 'Todos') {
    return imagens
  }
  return imagens.filter((img) => categorias.includes(img.alt))
})
</script>