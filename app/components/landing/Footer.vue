<template>
  <footer class="border-t border-zinc-800/80 bg-zinc-950 px-8 pt-16 pb-8 lg:px-12">
    <div
      class="mx-auto mb-12 grid max-w-350 grid-cols-1 items-start gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10"
    >
      <div class="space-y-5 sm:col-span-2 lg:col-span-1">
        <a href="#" class="inline-block transition-opacity duration-300 hover:opacity-80">
          <img
            src="/images/logo-studio-blessed-white.svg"
            alt="Studio Blessed"
            class="h-16 w-auto sm:h-20"
          />
        </a>
        <p class="max-w-xs font-sans text-sm/relaxed text-zinc-400">
          Beleza, cuidado e bem-estar em um espaço feito para você.
        </p>
      </div>

      <div class="space-y-4">
        <h4 class="font-sans text-xs font-semibold tracking-[0.15em] text-zinc-500 uppercase">
          Studio
        </h4>
        <ul class="space-y-2">
          <li v-for="link in studioLinks" :key="link.label">
            <a
              :href="link.href"
              class="font-sans text-sm text-zinc-400 transition-colors duration-300 hover:text-orange-500"
            >
              {{ link.label }}
            </a>
          </li>
        </ul>
      </div>

      <div class="space-y-4">
        <h4 class="font-sans text-xs font-semibold tracking-[0.15em] text-zinc-500 uppercase">
          Serviços
        </h4>
        <ul class="space-y-2">
          <li v-for="s in servicos" :key="s">
            <span class="font-sans text-sm text-zinc-400">{{ s }}</span>
          </li>
        </ul>
      </div>

      <div>
        <h3 class="mb-8 font-sans text-xs font-semibold tracking-[0.15em] text-zinc-500 uppercase">
          Horários
        </h3>
        <div class="space-y-4 font-sans text-sm">
          <div class="flex justify-between border-b border-zinc-800/60 pb-3">
            <span class="text-zinc-400">Seg a Sex</span>
            <span class="font-medium text-zinc-200">08h às 18h</span>
          </div>
          <div class="flex justify-between border-b border-zinc-800/60 pb-3">
            <span class="text-zinc-400">Sábado</span>
            <span class="font-medium text-zinc-200">08h às 15h</span>
          </div>
          <div class="flex justify-between">
            <span class="text-zinc-400 italic">Domingo</span>
            <span class="font-semibold tracking-tighter text-orange-500 uppercase">Fechado</span>
          </div>
          <p class="pt-3 text-[10px] tracking-[0.2em] text-zinc-500 uppercase">
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
          class="flex size-11 items-center justify-center rounded-full bg-zinc-900 text-zinc-300 transition-all duration-300 hover:bg-orange-500 hover:text-zinc-950"
        >
          <LandingIcon icon="mdi:whatsapp" class="size-5" />
        </a>
        <a
          href="https://instagram.com/studio.bles"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          class="flex size-11 items-center justify-center rounded-full bg-zinc-900 text-zinc-300 transition-all duration-300 hover:bg-orange-500 hover:text-zinc-950"
        >
          <LandingIcon icon="lucide:instagram" class="size-5" />
        </a>
      </div>
    </div>

    <div class="mx-auto max-w-350 border-t border-zinc-800/60 pt-8 text-center">
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
  'Limpeza de Pele'
]
</script>
