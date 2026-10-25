<script setup lang="ts">
definePageMeta({
  layout: false
})

useHead({
  title: 'Studio Blessed — Alongamento de Cílios e Beleza do Olhar'
})

useSeoMeta({
  title: 'Studio Blessed — Beleza do Olhar',
  description: 'Studio Blessed: alongamento de cílios, lash lifting, design de sobrancelhas e muito mais. Agende seu horário.',
  ogTitle: 'Studio Blessed — Beleza do Olhar',
  ogDescription: 'Alongamento de cílios, lash lifting, sobrancelhas, hidratação labial e mais. Agende agora.',
  ogType: 'website'
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <!-- Hero Section -->
    <header class="bg-primary text-primary-foreground pt-20 pb-12 px-4 sm:pt-28 sm:pb-16">
      <div class="mx-auto max-w-7xl">
        <div class="text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm font-medium mb-6">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Aberta hoje até 19h
          </div>
          <h1 class="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
            Realce seu olhar com<br />
            <span class="text-emerald-400">especialistas em cílios</span>
          </h1>
          <p class="text-lg sm:text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-10">
            Studio Blessed é um estúdio especializado em beleza do olhar,
            localizado no coração da cidade. Técnicas premium, materiais de
            qualidade e atendimento personalizado para realçar sua beleza natural.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <UButton
              to="/login"
              label="Agendar Horário"
              icon="i-ri-calendar-line"
              size="xl"
              variant="solid"
            />
            <UButton
              label="Ver Serviços"
              icon="i-ri-scissors-line"
              size="xl"
              variant="outline"
              class="bg-white/10 hover:bg-white/20 border-white/20"
            />
          </div>
        </div>
      </div>
    </header>

    <!-- Seção Sobre a Dona / Studio -->
    <section class="py-20 px-4">
      <div class="mx-auto max-w-7xl">
        <div class="flex flex-col lg:flex-row gap-12 items-center">
          <div class="lg:w-1/2">
            <div class="relative">
              <img
                src="/images/studio-blessed.webp"
                alt="Estúdio Studio Blessed"
                class="rounded-2xl shadow-2xl w-full h-[400px] object-cover"
              >
              <div class="absolute -bottom-6 left-6 bg-white p-6 rounded-xl shadow-lg max-w-xs sm:max-w-md">
                <h3 class="font-bold text-xl mb-2">Conheça a Amanda</h3>
                <p class="text-muted-foreground">
                  Especialista em extensão de cílios e beleza do olhar com mais de
                  5 anos de experiência. Formada pelas melhores escolas de estética
                  do país.
                </p>
              </div>
            </div>
          </div>
          <div class="lg:w-1/2 space-y-8">
            <div>
              <h2 class="text-3xl font-bold mb-6">Por que escolher o Studio Blessed?</h2>
            </div>
            <div class="space-y-6">
              <div class="flex gap-4">
                <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <UIcon name="i-ri-check-line" />
                </div>
                <div>
                  <h4 class="font-bold">Materiais Premium</h4>
                  <p class="text-muted-foreground">
                    Trabalhamos apenas com produtos de alta qualidade para garantir
                    a saúde dos seus fios naturais.
                  </p>
                </div>
              </div>
              <div class="flex gap-4">
                <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <UIcon name="i-ri-check-line" />
                </div>
                <div>
                  <h4 class="font-bold">Técnicas Avançadas</h4>
                  <p class="text-muted-foreground">
                    Fio a fio, volume russo, lash lifting e visagismo para sobrancelhas.
                  </p>
                </div>
              </div>
              <div class="flex gap-4">
                <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <UIcon name="i-ri-check-line" />
                </div>
                <div>
                  <h4 class="font-bold">Atendimento Personalizado</h4>
                  <p class="text-muted-foreground">
                    Cada cliente é única. Avaliamos seu formato de rosto e indicamos
                    o melhor design para você.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Seção de Serviços -->
    <section class="py-20 bg-muted/50">
      <div class="mx-auto max-w-7xl px-4">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold mb-4">Nossos Serviços</h2>
          <p class="text-muted-foreground">
            Conheça nossos procedimentos especializados em beleza do olhar e estética.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="service in services"
            :key="service.id"
            class="UCard p-6 hover:shadow-lg transition-shadow"
          >
            <div class="relative h-48 overflow-hidden rounded-xl mb-4">
              <img
                :src="service.image"
                :alt="service.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              >
              <div class="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full text-xs font-medium text-white">
                {{ service.duration }}
              </div>
            </div>
            <h3 class="font-bold text-lg mb-2">{{ service.name }}</h3>
            <p class="text-muted-foreground text-sm mb-4 line-clamp-3">
              {{ service.description }}
            </p>
            <div class="flex items-center justify-between">
              <span class="font-bold">{{ service.price }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Final -->
    <section class="py-20 px-4">
      <div class="mx-auto max-w-3xl">
        <div class="UCard p-8 sm:p-12 text-center">
          <h2 class="text-2xl sm:text-3xl font-bold mb-4">Pronto para realçar seu olhar?</h2>
          <p class="text-muted-foreground mb-8">
            Agende seu horário agora mesmo e venha conhecer o Studio Blessed.
          </p>
          <UButton
            to="/login"
            label="Fazer Login e Agendar"
            icon="i-ri-login-box-line"
            size="xl"
            class="w-full sm:w-auto"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { services } = await import('~/composables/services')
</script>
