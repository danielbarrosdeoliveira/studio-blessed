# Architecture - Studio Blessed

> Alinhado ao `docs/discovery.md` e ao `docs/spec.md`.

## 1. Stack Tecnológica Core

- **Framework:** Nuxt 4 (SSR full-stack, estrutura `app/`).
- **Template base:** Nuxt UI Dashboard (`ui/dashboard`) — sidebar, command palette, dark mode, charts e tabelas.
- **UI & Dashboard:** Nuxt UI Dashboard + Tailwind CSS.
- **Gerenciador de Pacotes:** **pnpm** (store global, links simbólicos).
- **Banco de Dados:** PostgreSQL (Oracle Cloud Infrastructure — OCI).
- **Autenticação:** Better Auth com **Google OAuth** ou **e-mail/senha**.
- **Idioma / Fuso:** pt-BR, `America/Sao_Paulo`. **Sem PWA**.

## 2. Padrões de Arquitetura e Organização

- **Camada Server:** usar as rotas nativas do Nuxt (`server/api/`) para lógica de
  backend, validações e integração com APIs externas.
- **Modularização por domínio:** `Auth`, `Professionals`, `Services`, `Scheduling`,
  `Availability`, `Calendar`, `Metrics`, `Blocks`.
- **Princípio Lean AI:** código limpo, modular e estritamente focado no MVP.
  Sem abstrações prematuras (YAGNI).
- **Validação:** schemas (ex.: Zod) na fronteira das rotas de API.

## 3. Agenda Híbrida (Google + Interna)

> **Fase 1:** implementar **somente o provider `internal`**. O provider `google`
> e toda a integração OAuth/Calendar ficam para a **fase final do MVP**. O código
> deve ser preparado com a abstração de provider, mas sem chamadas reais ao Google.

O sistema **não possui um calendário único próprio**. Cada profissional tem uma
fonte de agenda (`agendaProvider`):

| Provider | Fonte da verdade | Leitura | Escrita |
| --- | --- | --- | --- |
| `google` | Google Calendar (`primary`) | freebusy + eventos (contam como `busy`) | criar/atualizar/remover evento |
| `internal` | PostgreSQL | registros do sistema | registros do sistema |

- **OAuth individual por profissional** (Better Auth + Google). Token de refresh
  é armazenado por profissional e usado para ler/escrever a agenda `primary`.
- **Modo Testing:** no MVP o app Google fica em modo *Testing* (escopos de
  Calendar são sensíveis/restritos). Limite ~100 usuários de teste e expiração de
  refresh token em 7 dias. Aceitável, pois apenas a equipe usa Google (2 pessoas).
  Rever verificação antes de crescer.
- **Eventos externos contam como busy:** qualquer evento criado na agenda da
  profissional (mesmo fora do sistema) bloqueia o slot.

### Mapeamento do evento

- **Título:** `Cliente — Serviço`.
- **Descrição:** nome e WhatsApp da cliente, nome do serviço.
- **IDs:** vincular o `Appointment` via `extendedProperties.private.appointmentId`.
- **Cancelar/remarcar:** atualizar `startsAt`/`endsAt` ou remover o evento.

## 4. Motor de Disponibilidade

- **Entrada:** `WorkingHours` da profissional − `TimeBlocks` − eventos `busy`
  (Google ou interno) − serviço (`durationMin` + `bufferMin`).
- **Saída:** lista de horários de início a cada **15 minutos** dentro da jornada.
- **Antecedência:** cliente exige **3 dias**; staff pode hoje/amanhã e encaixes.
- **Concorrência:** sem lock. A disponibilidade é **revalidada imediatamente antes
  de gravar**; se o slot ocupou, o cliente escolhe outro.
  - ⚠️ O `freebusy` do Google é eventualmente consistente — aceitamos o risco
    residual (salão pequeno, baixo volume).
- **Performance:** agrupar chamadas ao Google e cachear `WorkingHours`/serviços.

## 5. Modelo de Dados (PostgreSQL)

- **Client:** `name`, `phone` (único — cliente única por telefone no salão).
- **Professional:** `name`, `email`, `role` (`admin`|`partner`),
  `agendaProvider` (`google`|`internal`).
- **OAuthAccount / Token:** `professionalId`, `refreshToken`, `scope`, `expiresAt`.
- **Service:** `professionalId`, `name`, `durationMin`, `bufferMin`, `price`.
- **WorkingHours:** `professionalId`, `weekday`, `startTime`, `endTime`
  (múltiplos intervalos por dia — cobre almoço).
- **TimeBlock:** `professionalId`, `startsAt`, `endsAt`, `reason`, `recurrence`.
- **Appointment:** `clientId`, `professionalId`, `serviceId`, `startsAt`, `endsAt`,
  `status` (`scheduled`|`completed`|`cancelled`|`no_show`),
  `origin` (`client`|`staff`), `externalEventId`.

## 6. Segurança e LGPD

- **Cliente sem login:** identificação por telefone (risco de privacidade aceito
  conscientemente no MVP). Deve haver **texto de consentimento** ao informar
  nome/telefone e política de retenção (dados vão para a agenda Google da profissional).
- **Tokens OAuth** armazenados de forma cifrada; nunca expostos ao cliente.
- **Autorização por papel:** rotas de API validam `role` e propriedade do recurso
  (profissional só acessa o que é dela).
- **Cliente nunca recebe dados de outra cliente.**

## 7. Integrações Externas

- **Google Calendar API:** OAuth 2.0 + freebusy + events. Quotas e latência exigem
  agrupamento de chamadas e cache.
- **Referência de deploy:** containers na OCI com PostgreSQL gerenciado.
