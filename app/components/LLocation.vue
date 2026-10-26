<template>
  <section id="location" class="py-20 md:py-28 bg-muted">
    <div class="max-w-[1400px] mx-auto px-8 lg:px-12">
      <div class="text-center mb-16 space-y-2">
        <span class="font-sans text-xs uppercase tracking-[0.2em] text-primary font-semibold">Localização</span>
        <h2 class="font-serif text-4xl md:text-5xl text-neutral-100 leading-tight">
          Onde Estamos
        </h2>
        <p class="font-sans text-neutral-300 text-base italic max-w-xl mx-auto">
          Estamos localizados no coração do Parque Viana, em Barueri.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div class="overflow-hidden rounded-xl shadow-xl border-2 border-border">
          <iframe title="Mapa da localização do Studio Blessed"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.693785668594!2d-46.87051772467042!3d-23.543513578812046!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94cf010616dab381%3A0xce1051bab47c8e84!2sR.%20Imbauva%2C%2020%20-%204%20-%20Parque%20Viana%2C%20Barueri%20-%20SP%2C%2006449-310!5e0!3m2!1spt-BR!2sbr!4v1743297689841!5m2!1spt-BR!2sbr"
            class="w-full h-full min-h-[400px]" style="border: 0" loading="lazy"
            referrerpolicy="no-referrer-when-downgrade" />
        </div>

        <div class="space-y-8">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon icon="lucide:phone" class="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p class="font-sans text-xs uppercase tracking-wider text-neutral-400/60">Telefone</p>
              <a href="tel:+5511988880015"
                class="font-sans text-base text-neutral-100 hover:text-primary-400 transition-colors">
                (11) 98888-0015
              </a>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon icon="lucide:mail" class="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p class="font-sans text-xs uppercase tracking-wider text-neutral-400/60">E-mail</p>
              <a href="mailto:contato@blessedstudio.com.br"
                class="font-sans text-base text-neutral-100 hover:text-primary-400 transition-colors">
                contato@blessedstudio.com.br
              </a>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon icon="lucide:map-pin" class="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p class="font-sans text-xs uppercase tracking-wider text-neutral-400/60">Endereço</p>
              <p class="font-sans text-base text-neutral-100">
                R. Imbauva, 20 - Pq. Viana, Sala 3<br>
                Barueri-SP
              </p>
            </div>
          </div>

          <div class="flex gap-4 pt-4">
            <a href="https://wa.me/5511988880015" target="_blank" rel="noopener noreferrer"
              class="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all duration-300">
              <Icon icon="mdi:whatsapp" class="w-5 h-5" />
            </a>
            <a href="https://instagram.com/studio.bles" target="_blank" rel="noopener noreferrer"
              class="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all duration-300">
              <Icon icon="lucide:instagram" class="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
