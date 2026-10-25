<template>
  <section id="artists" class="py-20 md:py-28 bg-[#f59e0b]/10">
    <div class="max-w-[1400px] mx-auto px-8 lg:px-12">
      <div class="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-6">
        <div>
          <span class="font-sans text-xs uppercase tracking-[0.2em] text-[#10b981] font-semibold">03 / Profissionais</span>
          <h2 class="font-serif text-4xl md:text-5xl text-[#0f172a] mt-3 leading-tight">
            Nossa Equipe
          </h2>
          <p class="font-sans text-[#f59e0b] text-base mt-4 max-w-lg">
            Conheça as profissionais que fazem do Studio Blessed um espaço único de beleza e cuidado.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <div
          v-for="member in team"
          :key="member.name"
          class="group"
        >
          <div class="overflow-hidden rounded-lg bg-[#f59e0b]/20 mb-5">
            <img
              :src="member.image"
              :alt="member.name"
              class="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-700"
            />
          </div>
          <h3 class="font-sans text-sm uppercase tracking-[0.15em] text-[#0f172a] font-bold">
            {{ member.role }}
          </h3>
          <p class="font-serif text-xl text-[#0f172a] mt-1">
            <template v-if="member.link">
              <a :href="member.link" target="_blank" rel="noopener noreferrer" class="hover:text-[#10b981] transition-colors">
                {{ member.name }}
              </a>
            </template>
            <template v-else>
              {{ member.name }}
            </template>
          </p>
          <p class="font-sans text-sm text-[#f59e0b] mt-3 leading-relaxed">
            {{ member.description }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
interface TeamMember {
  name: string
  role: string
  image: string
  description: string
  link?: string
}

const team: TeamMember[] = [
  {
    name: "Caroline Silva",
    role: "CEO & Lash Designer",
    image: "/images/ceo-caroline-silva.jpg",
    description:
      "Fundadora, CEO e Lash Designer do Studio Blessed, Caroline Silva carrega uma verdadeira paixão pelo cuidado e pelo embelezamento do olhar. Através de sua dupla visão, como gestora e especialista técnica, ela transformou o estúdio em um ambiente único e focado no bem-estar, onde cada cliente é recebida com acolhimento, respeito e os procedimentos mais modernos e seguros do mercado.",
  },
  {
    name: "Daniel Oliveira",
    role: "CTO & CMO",
    image: "/images/cto-cmo-daniel-oliveira.jpg",
    link: "https://www.linkedin.com.br/in/danielbarrosdeoliveira",
    description:
      "Sócio, CTO e CMO do Studio Blessed, Daniel Oliveira lidera a transformação tecnológica e o marketing estratégico da marca. Atuando ao lado de sua esposa e CEO, Caroline Silva, Daniel combina visão de futuro e inovação para acelerar o crescimento do negócio. Fora dos bastidores do estúdio, sua maior dedicação é como pai do Felipe.",
  },
  {
    name: "Thalita Brito",
    role: "Nail Designer",
    image: "/images/parceira-thalita-brito.jpg",
    description:
      "Referência em versatilidade e cuidado, Thalita Brito é a nova Nail Designer do Studio Blessed. Especialista em embelezamento de mãos e pés, ela oferece desde os serviços tradicionais de manicure e pedicure até procedimentos avançados de extensão em fibra de vidro, gel e esmaltação em gel. Alinhada ao padrão de excelência do estúdio, Thalita entrega resultados sofisticados que aliam beleza, técnica e durabilidade.",
  },
]
</script>
