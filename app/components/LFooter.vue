<template>
  <footer id="location" class="bg-zinc-950 px-8 lg:px-12 pt-16 pb-8">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-12 items-start">
      <div class="sm:col-span-2 lg:col-span-1">
        <a href="#" class="inline-block hover:opacity-80 transition-opacity duration-300">
          <img src="/images/logo-studio-blessed-white.svg" alt="Studio Blessed"
            class="h-20 sm:h-28 md:h-36 lg:h-40 xl:h-44 2xl:h-48 w-auto" />
        </a>
      </div>

      <div class="space-y-4">
        <h4 class="font-sans text-xs uppercase tracking-[0.15em] text-zinc-400 font-semibold">Studio</h4>
        <ul class="space-y-2">
          <li v-for="link in studioLinks" :key="link.label">
            <a :href="link.href"
              class="font-sans text-sm text-zinc-400/80 hover:text-zinc-400 transition-colors duration-300">
              {{ link.label }}
            </a>
          </li>
        </ul>
      </div>

      <div class="space-y-4">
        <h4 class="font-sans text-xs uppercase tracking-[0.15em] text-zinc-400 font-semibold">Serviços</h4>
        <ul class="space-y-2">
          <li v-for="s in servicos" :key="s">
            <span class="font-sans text-sm text-zinc-400/80">{{ s }}</span>
          </li>
        </ul>
      </div>

      <div>
        <h3 class="font-sans text-xs uppercase tracking-[0.15em] text-zinc-400 font-semibold mb-8">Horários</h3>
        <div class="space-y-4 font-sans text-sm">
          <div class="flex justify-between border-b border-zinc-800/30 pb-3">
            <span class="text-zinc-400/80">Seg a Sex</span>
            <span class="text-zinc-400/80 font-medium">08h às 18h</span>
          </div>
          <div class="flex justify-between border-b border-zinc-800/30 pb-3">
            <span class="text-zinc-400/80">Sábado</span>
            <span class="text-zinc-400/80 font-medium">08h às 15h</span>
          </div>
          <div class="flex justify-between">
            <span class="text-zinc-400/80 italic">Domingo</span>
            <span class="text-zinc-400/80 font-bold uppercase tracking-tighter">Fechado</span>
          </div>
          <p class="text-[10px] text-zinc-400/60 pt-3 uppercase tracking-[0.2em] italic">
            *Atendemos somente com agendamento prévio.
          </p>
        </div>
      </div>

      <div class="flex gap-4 pt-4">
        <a href="https://wa.me/551198880015" target="_blank" rel="noopener noreferrer"
          class="w-11 h-11 rounded-full bg-zinc-950 flex items-center justify-center text-zinc-400 hover:bg-zinc-950/90 transition-all duration-300">
          <Icon icon="mdi:whatsapp" class="w-5 h-5" />
        </a>
        <a href="https://instagram.com/studio.bles" target="_blank" rel="noopener noreferrer"
          class="w-11 h-11 rounded-full bg-zinc-950 flex items-center justify-center text-zinc-400 hover:bg-zinc-950/90 transition-all duration-300">
          <Icon icon="lucide:instagram" class="w-5 h-5" />
        </a>
      </div>
    </div>

    <div class="border-t border-zinc-800/20 pt-8 text-center">
      <p class="font-sans text-[10px] tracking-[0.3em] text-zinc-400/70 uppercase">
        &copy; 2026 Studio Blessed. Todos os direitos reservados.
      </p>
    </div>
  </footer>
</template>

<script lang="ts" setup>
const studioLinks = [
  { href: "#hero", label: "Início" },
  { href: "#about", label: "Sobre" },
  { href: "#services", label: "Serviços" },
  { href: "#artists", label: "Profissionais" },
  { href: "#testimonials", label: "Depoimentos" },
]

const servicos = [
  'Extensão de Cílios',
  'Lash Lifting',
  'Sobrancelha',
  'Hidra Gloss Lips',
  'Epilação',
  'Limpeza de Pele',
  'Brow Lamination',
  'Alongamento de Unhas',
]
</script>