<template>
  <nav class="fixed top-0 left-0 w-full z-50 bg-bg border-b border-border transition-all duration-300">
    <div class="max-w-[1400px] mx-auto flex items-center justify-between px-8 lg:px-12 py-4">
      <a href="#" class="block hover:opacity-80 transition-opacity duration-300">
        <img src="/images/logo-studio-blessed.svg" alt="Studio Blessed" class="h-8 md:h-10 w-auto" />
      </a>

      <div class="hidden lg:flex items-center gap-8">
        <div class="flex items-center gap-6 font-sans text-xs uppercase font-medium tracking-[0.15em] text-muted-foreground">
          <a
            v-for="link in links"
            :key="link.href"
            :href="link.href"
            :class="[
              'hover:text-primary transition-all duration-300 whitespace-nowrap',
              { 'text-primary': activeSection === link.href.slice(1) },
            ]"
          >
            {{ link.label }}
          </a>
        </div>
        <a
          href="https://agenda.studioblessed.com.br"
          class="rounded-full bg-primary text-primary-foreground text-xs uppercase tracking-wider px-6 py-3 font-medium hover:bg-primary/90 transition-all duration-300">
          Agendar Agora
        </a>
      </div>

      <button class="lg:hidden p-2 text-muted-foreground hover:text-primary transition-colors duration-300" @click="isOpen = !isOpen">
        <Icon v-if="!isOpen" icon="lucide:menu" class="w-6 h-6" />
        <Icon v-else icon="lucide:x" class="w-6 h-6" />
      </button>
    </div>

    <div v-if="isOpen" class="lg:hidden bg-bg border-t border-border px-8 py-6 space-y-4">
      <a
        v-for="link in links"
        :key="link.href"
        :href="link.href"
        :class="[
          'block font-sans text-sm uppercase tracking-[0.15em] transition-all duration-300',
          activeSection === link.href.slice(1) ? 'text-primary' : 'text-muted-foreground hover:text-primary',
        ]"
        @click="isOpen = false"
      >
        {{ link.label }}
      </a>
      <a
        href="https://agenda.studioblessed.com.br"
        class="block text-center rounded-full bg-primary text-primary-foreground text-xs uppercase tracking-wider px-6 py-3 font-medium hover:bg-primary/90 transition-all duration-300"
        @click="isOpen = false"
      >
        Agendar Agora
      </a>
    </div>
  </nav>
</template>

<script setup lang="ts">
const isOpen = ref(false);

const links = [
  { href: "#hero", label: "Início" },
  { href: "#about", label: "Sobre" },
  { href: "#services", label: "Serviços" },
  { href: "#artists", label: "Profissionais" },
  { href: "#testimonials", label: "Depoimentos" },
  { href: "#location", label: "Onde Estamos" },
];

const activeSection = ref("hero");

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting);
      if (visible.length > 0) {
        const topMost = visible.reduce((prev, curr) =>
          curr.boundingClientRect.top < prev.boundingClientRect.top ? curr : prev,
        );
        activeSection.value = topMost.target.id;
      }
    },
    { rootMargin: "-40% 0px -55% 0px" },
  );

  for (const link of links) {
    const el = document.getElementById(link.href.slice(1));
    if (el) observer.observe(el);
  }

  onUnmounted(() => observer.disconnect());
});
</script>
