<template>
  <nav
    class="fixed top-0 left-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md transition-all duration-300"
  >
    <div class="mx-auto flex max-w-350 items-center justify-between px-8 py-4 lg:px-12">
      <a href="#" class="block transition-opacity duration-300 hover:opacity-80">
        <img
          src="/images/logo-studio-blessed-white.svg"
          alt="Studio Blessed"
          class="h-8 w-auto md:h-10"
        />
      </a>

      <div class="hidden items-center gap-8 lg:flex">
        <div
          class="flex items-center gap-6 font-sans text-xs font-medium tracking-[0.15em] text-zinc-400 uppercase"
        >
          <a
            v-for="link in links"
            :key="link.href"
            :href="link.href"
            :class="[
              'whitespace-nowrap transition-all duration-300 hover:text-orange-500',
              { 'text-orange-500': activeSection === link.href.slice(1) }
            ]"
          >
            {{ link.label }}
          </a>
        </div>
        <NuxtLink
          to="/agendamento"
          class="rounded-full bg-orange-500 px-6 py-3 text-xs font-semibold tracking-wider text-zinc-950 uppercase shadow-lg shadow-orange-500/20 transition-all duration-300 hover:bg-orange-400"
        >
          Agendar Agora
        </NuxtLink>
      </div>

      <button
        class="p-2 text-zinc-400 transition-colors duration-300 hover:text-orange-500 lg:hidden"
        aria-label="Abrir menu"
        @click="isOpen = !isOpen"
      >
        <LandingIcon v-if="!isOpen" icon="lucide:menu" class="size-6" />
        <LandingIcon v-else icon="lucide:x" class="size-6" />
      </button>
    </div>

    <div v-if="isOpen" class="space-y-4 border-t border-zinc-800 bg-zinc-950 px-8 py-6 lg:hidden">
      <a
        v-for="link in links"
        :key="link.href"
        :href="link.href"
        :class="[
          'block font-sans text-sm tracking-[0.15em] uppercase transition-all duration-300',
          activeSection === link.href.slice(1)
            ? 'text-orange-500'
            : 'text-zinc-400 hover:text-orange-500'
        ]"
        @click="isOpen = false"
      >
        {{ link.label }}
      </a>
      <NuxtLink
        to="/agendamento"
        class="block rounded-full bg-orange-500 px-6 py-3 text-center text-xs font-semibold tracking-wider text-zinc-950 uppercase transition-all duration-300 hover:bg-orange-400"
        @click="isOpen = false"
      >
        Agendar Agora
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
const isOpen = ref(false)

const links = [
  { href: '#hero', label: 'Início' },
  { href: '#about', label: 'Sobre' },
  { href: '#services', label: 'Serviços' },
  { href: '#dona', label: 'A Dona' },
  { href: '#testimonials', label: 'Depoimentos' },
  { href: '#location', label: 'Onde Estamos' }
]

const activeSection = ref('hero')

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting)
      if (visible.length > 0) {
        const topMost = visible.reduce((prev, curr) =>
          curr.boundingClientRect.top < prev.boundingClientRect.top ? curr : prev
        )
        activeSection.value = topMost.target.id
      }
    },
    { rootMargin: '-40% 0px -55% 0px' }
  )

  for (const link of links) {
    const el = document.getElementById(link.href.slice(1))
    if (el) observer.observe(el)
  }

  onUnmounted(() => observer.disconnect())
})
</script>
