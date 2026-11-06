# Architecture - Studio Blessed

> Alinhado ao `docs/discovery.md` e ao `docs/spec.md`.

## 1. Stack Tecnológica Core

- **Framework:** Nuxt 4 (SSR full-stack, estrutura `app/`).
- **Template base:** Nuxt UI 4 Dashboard — sidebar, command palette, dark mode, charts e tabelas.
- **UI & Dashboard:** Nuxt UI 4 + Tailwind CSS.
- **Gerenciador de Pacotes:** **pnpm** (store global, links simbólicos).
- **Banco de Dados:** PostgreSQL (Oracle Cloud Infrastructure — OCI).
- **Autenticação:** Better Auth com **Google OAuth** ou **e-mail/senha**.
- **Idioma / Fuso:** pt-BR, `America/Sao_Paulo`. **Sem PWA**.

## 2. Padrões de Arquitetura e Organização

- **Camada Server:** usar as rotas nativas do Nuxt (`server/api/`) para lógica de backend, validações e integração com APIs externas.
- **Modularização por domínio:** `Auth`, `Services`, `Scheduling`, `Metrics`, `Blocks`.
- **Fluxo público:** `/agendamento` é a entrada canônica e usa o `UStepper` do Nuxt UI 4 em quatro etapas (serviço → data/horário → dados → confirmação).
  - **Nota:** Não há mais seleção de professional — o serviço pertence à dona única.
  - `/agendar` redireciona para `/agendamento`, preservando query params para links antigos.
- **Princípio Lean AI:** código limpo, modular e estritamente focado no MVP. Sem abstrações prematuras (YAGNI).
- **Validação:** schemas (ex.: Zod) na fronteira das rotas de API.

## 3. Agenda Simplificada (Single-Owner)

> **Fase 1 do MVP:** implementar **somente a agenda interna** (PostgreSQL). Não há mais integração com Google Calendar na fase atual, pois não há profissionais com agendas individuais.

O sistema **não possui múltiplas agendas por profissional**. Apenas **uma agenda única** para o salão, pertencente à dona.

| Item | Detalhe |
| --- | --- |
| **Fonte da verdade** | PostgreSQL (agenda interna) — única para todo o salão |
| **WorkingHours** | `professionalId` → agora `salonId` (ou omitido, sendo única dona) |
| **TimeBlock** | `salonId`, `startsAt`, `endsAt`, `reason`, `recurrence` (`weekly` | null) |
| **Disponibilidade** | `WorkingHours` − `TimeBlocks` − serviços agendados. |
| **Antecedência** | Cliente: **3 dias** mínimos. Staff (dona): pode agendar hoje/amanhã e encaixes. |
| **Bloqueios** | Admin (dona) cria bloqueios pontuais ou semanais. Pode sobrepor agendamento `scheduled` somente com **confirmação explícita**; o agendamento não é cancelado. |

### Mapeamento do agendamento

- **Título:** não aplica (não há profissional para no título).
- **Descrição:** nome e WhatsApp da cliente, nome do serviço.
- **IDs:** vinculado ao `Appointment` via `clientId` e `serviceId`.

## 4. Motor de Disponibilidade

- **Entrada:** `WorkingHours` da dona − `TimeBlocks` − serviço (`durationMin` + `bufferMin`).
- **Saída:** lista de horários de início a cada **15 minutos** dentro da jornada.
- **Antecedência:** cliente exige **3 dias**; staff (dona) pode hoje/amanhã e encaixes.
- **Bloqueios:** pontuais ou semanais. Se um bloqueio sobrepõe agendamento `scheduled`, a API responde `409` com os conflitos e só grava após `confirmConflict: true`; o agendamento permanece `scheduled`.
- **Concorrência:** sem lock. A disponibilidade é **revalidada imediatamente antes de gravar**; se o slot ocupou, o cliente escolhe outro horário.
  - ⚠️ Risco residual aceito: em salão pequeno com baixo volume, double-booking é improvável.
- **Performance:** agrupar chamadas e cachear `WorkingHours`/serviços.

## 5. Modelo de Dados (PostgreSQL)

- **Client:** `name`, `phone` (único — cliente única por telefone no salão).
- **Service:** `name`, `durationMin`, `bufferMin`, `priceCents`, `active`. O `name` é único entre os serviços ativos (sem diferenciar maiúsculas/espaços). Cada serviço pertence à dona.
- **WorkingHours:** `salonId` (ou omitido, sendo única dona), `weekday`, `startTime`, `endTime` (múltiplos intervalos por dia — cobre almoço).
- **TimeBlock:** `salonId`, `startsAt`, `endsAt`, `reason`, `recurrence` (`weekly` | null).
- **Appointment:** `clientId`, `serviceId`, `startsAt`, `endsAt`, `status` (`scheduled`|`completed`|`cancelled`|`no_show`), `origin` (`client`).

**Nota:** **Não há mais tabela `Professional`** no MVP. Todas as operações antes atreladas a profissional agora são da dona única.

## 6. Segurança e LGPD

- **Cliente sem login:** identificação por telefone (risco de privacidade aceito conscientemente no MVP). Deve haver **texto de consentimento** ao informar nome/telefone e política de retenção.
- **Cliente única:** todos os dados (agendamentos, histórico) pertencem à mesma usuária.
- **Autorização por papel:** rotas de API validam `role` e propriedade do recurso. Somente a dona (role=admin) tem acesso total; não há roles de partner/professional no MVP.
- **Cliente nunca recebe dados de outra cliente.** (Verdadeiro, há apenas uma cliente tipo "pública" por agendamento).

## 7. Integrações Externas

- **Google Calendar API:** (Fase final do MVP, não ativa atualmente). OAuth 2.0 + freebusy + events. Caso seja ativado futuramente, quotas e latência exigem agrupamento de chamadas e cache.
- **Referência de deploy:** containers na OCI com PostgreSQL gerenciado.

## 8. Testes e Cobertura

- **Unitário:** Vitest 5 sobre lógica pura de `app/utils/**` e `server/utils/**`.
- **Integração:** Vitest 5 com servidor Nuxt real para `server/api/**` e `@nuxt/test-utils` para componentes Vue.
- **E2E:** Playwright + Chromium nos fluxos críticos, com build de produção e cobertura de servidor/SSR via c8.
- **Banco de teste:** PostgreSQL dedicado `studio_blessed_test`, recriado antes das suítes.
- **Metas:** 75% para unitário e integração; 50% para E2E. O gate é local enquanto a esteira de DevOps/deploy não existe e passa a bloquear o deploy quando ela for criada.
- Estratégia completa: [`docs/testing.md`](testing.md).