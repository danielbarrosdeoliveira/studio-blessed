export interface Service {
  id: string
  name: string
  description: string
  image: string
  duration: string
  price: string
}

export const services: Service[] = [
  {
    id: 'extensao-cilios',
    name: 'Extensão de Cílios',
    description:
      'Técnica fio a fio com materiais premium para garantir volume, curvatura e um olhar marcante, mantendo a saúde dos seus fios naturais com acabamento impecável.',
    image: '/images/extensao-cilios.webp',
    duration: '1h30',
    price: 'R$ 180'
  },
  {
    id: 'lash-lifting',
    name: 'Lash Lifting',
    description:
      'Tratamento que eleva e curva seus cílios naturais desde a raiz, proporcionando um efeito de rímel duradouro e um olhar mais aberto sem a necessidade de extensões.',
    image: '/images/lash-lifting.webp',
    duration: '1h',
    price: 'R$ 120'
  },
  {
    id: 'sobrancelha',
    name: 'Sobrancelha',
    description:
      'Design estratégico baseado no visagismo facial para valorizar seu olhar, incluindo mapeamento, remoção precisa de fios e finalização personalizada.',
    image: '/images/sobrancelha.webp',
    duration: '40min',
    price: 'R$ 60'
  },
  {
    id: 'hidra-gloss',
    name: 'Hidra Gloss',
    description:
      'Procedimento de hidratação profunda para lábios, devolvendo o viço e o brilho natural, com efeito revitalizante e preenchimento de linhas finas.',
    image: '/images/hidra-gloss.webp',
    duration: '50min',
    price: 'R$ 90'
  },
  {
    id: 'epilacao-corporal',
    name: 'Epilação Corporal',
    description:
      'Remoção técnica de pelos com ceras de alta qualidade e métodos que minimizam o desconforto, deixando a pele lisa, macia e livre de irritações por muito mais tempo.',
    image: '/images/depilacao-corporal.webp',
    duration: '45min',
    price: 'R$ 80'
  },
  {
    id: 'limpeza-pele',
    name: 'Limpeza de Pele',
    description:
      'Protocolo completo de higienização, extração de impurezas e hidratação profunda para remover células mortas e revitalizar o brilho natural da sua face.',
    image: '/images/limpeza-de-pele.webp',
    duration: '1h',
    price: 'R$ 150'
  }
]
