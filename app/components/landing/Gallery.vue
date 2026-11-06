<template>
  <section id="gallery" class="bg-zinc-950 py-20 md:py-28">
    <div class="mx-auto max-w-350 px-8 lg:px-12">
      <div class="mb-16 space-y-2 text-center">
        <span class="font-sans text-xs font-semibold tracking-[0.2em] text-orange-500 uppercase"
          >Galeria</span
        >
        <h2 class="font-serif text-4xl/tight text-zinc-50 md:text-5xl">Nossos Trabalhos</h2>
        <p class="mx-auto max-w-xl font-sans text-base text-zinc-400">
          Resultados que falam por si.
        </p>
      </div>

      <div class="mb-12 flex flex-wrap justify-center gap-3">
        <button
          v-for="cat in categorias"
          :key="cat"
          class="rounded-full border px-6 py-2 text-sm font-medium transition-all duration-300"
          :class="
            selectedCategory === cat
              ? 'border-orange-500 bg-orange-500 text-zinc-950'
              : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-orange-500/50'
          "
          @click="selectedCategory = cat"
        >
          {{ cat }}
        </button>
      </div>

      <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <div
          v-for="img in filteredImagens"
          :key="img.id"
          class="overflow-hidden rounded-2xl bg-zinc-900 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-orange-500/10"
        >
          <img :src="img.url" :alt="img.alt" class="h-[250px] w-full object-cover" loading="lazy" />
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
