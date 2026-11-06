<template>
  <footer class="bg-zinc-950 border-t border-zinc-800/80 px-8 lg:px-12 pt-16 pb-8">
    <div class="max-w-[1400px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-12 items-start">
      <div class="sm:col-span-2 lg:col-span-1 space-y-5">
        <a href="#" class="inline-block hover:opacity-80 transition-opacity duration-300">
          <img
            src="/images/logo-studio-blessed-white.svg"
            alt="Studio Blessed"
            class="h-16 sm:h-20 w-auto"
          />
        </a>
        <p class="font-sans text-sm text-zinc-400 leading-relaxed max-w-xs">
          Beleza, cuidado e bem-estar em um espaço feito para você.
        </p>
      </div>

      <div class="space-y-4">
        <h4 class="font-sans text-xs uppercase tracking-[0.15em] text-zinc-500 font-semibold">Studio</h4>
        <ul class="space-y-2">
          <li v-for="link in studioLinks" :key="link.label">
            <a
              :href="link.href"
              class="font-sans text-sm text-zinc-400 hover:text-orange-500 transition-colors duration-300"
            >
              {{ link.label }}
            </a>
          </li>
        </ul>
      </div>

      <div class="space-y-4">
        <h4 class="font-sans text-xs uppercase tracking-[0.15em] text-zinc-500 font-semibold">Serviços</h4>
        <ul class="space-y-2">
          <li v-for="s in servicos" :key="s">
            <span class="font-sans text-sm text-zinc-400">{{ s }}</span>
          </li>
        </ul>
      </div>

      <div>
        <h3 class="font-sans text-xs uppercase tracking-[0.15em] text-zinc-500 font-semibold mb-8">Horários</h3>
        <div class="space-y-4 font-sans text-sm">
          <div class="flex justify-between border-b border-zinc-800/60 pb-3">
            <span class="text-zinc-400">Seg a Sex</span>
            <span class="text-zinc-200 font-medium">08h às 18h</span>
          </div>
          <div class="flex justify-between border-b border-zinc-800/60 pb-3">
            <span class="text-zinc-400">Sábado</span>
            <span class="text-zinc-200 font-medium">08h às 15h</span>
          </div>
          <div class="flex justify-between">
            <span class="text-zinc-400 italic">Domingo</span>
            <span class="text-orange-500 font-semibold uppercase tracking-tighter">Fechado</span>
          </div>
          <p class="text-[10px] text-zinc-500 pt-3 uppercase tracking-[0.2em]">
            *Atendemos somente com agendamento prévio.
          </p>
        </div>
      </div>

      <div class="flex gap-4 pt-4">
        <a
          href="https://wa.me/5511988880015"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          class="w-11 h-11 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-300 hover:bg-orange-500 hover:text-zinc-950 transition-all duration-300"
        >
          <LandingIcon icon="mdi:whatsapp" class="w-5 h-5" />
        </a>
        <a
          href="https://instagram.com/studio.bles"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          class="w-11 h-11 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-300 hover:bg-orange-500 hover:text-zinc-950 transition-all duration-300"
        >
          <LandingIcon icon="lucide:instagram" class="w-5 h-5" />
        </a>
      </div>
    </div>

    <div class="max-w-[1400px] mx-auto border-t border-zinc-800/60 pt-8 text-center">
      <p class="font-sans text-[10px] tracking-[0.3em] text-zinc-500 uppercase">
        &copy; 2026 Studio Blessed. Todos os direitos reservados.
      </p>
    </div>
  </footer>
</template>

<script setup lang="ts">
const studioLinks = [
  { href: '#hero', label: 'Início' },
  { href: '#about', label: 'Sobre' },
  { href: '#services', label: 'Serviços' },
  { href: '#dona', label: 'A Dona' },
  { href: '#testimonials', label: 'Depoimentos' }
]

const servicos = [
  'Extensão de Cílios',
  'Lash Lifting',
  'Sobrancelha',
  'Hidra Gloss Lips',
  'Epilação',
  'Limpeza de Pele',
  'Brow Lamination',
  'Alongamento de Unhas'
]
</script>
