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
  - **Nota:** Não há seleção de profissional — o serviço pertence à dona única.
  - `/agendar` redireciona para `/agendamento`, preservando query params para links antigos.
- **Princípio Lean AI:** código limpo, modular e estritamente focado no MVP. Sem abstrações prematuras (YAGNI).
- **Validação:** schemas (ex.: Zod) na fronteira das rotas de API.

## 3. Agenda Simplificada (Single-Owner)

> **Fase 1 do MVP:** implementar **somente a agenda interna** (PostgreSQL). Não há integração com Google Calendar na fase atual, pois a agenda é única e da dona do salão.

O sistema **não possui múltiplas agendas**. Apenas **uma agenda única** para o salão, pertencente à dona.

| Item                 | Detalhe                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fonte da verdade** | Google Calendar — evento em qualquer calendário configurado invalida o slot                                                                             |
| **WorkingHours**     | `weekday`, `startMinute`, `endMinute` (sem `professionalId`)                                                                                            |
| **Disponibilidade**  | `WorkingHours` − agendamentos − eventos do Google Calendar                                                                                              |
| **Antecedência**     | Cliente: **3 dias** mínimos, por **data local** (no 3º dia, o primeiro horário já vale). Dona: pode agendar hoje/amanhã e encaixes.                     |

### Mapeamento do agendamento

- **Título:** não aplica (a agenda é da dona única).
- **Descrição:** nome e WhatsApp da cliente, nome do serviço.
- **IDs:** vinculado ao `Appointment` via `clientId` e `serviceId`.

## 4. Motor de Disponibilidade

- **Entrada:** `WorkingHours` da dona − agendamentos com buffer − eventos do Google Calendar (`GOOGLE_CALENDAR_AVAILABILITY_IDS`)
- **Saída:** lista de horários de início a cada **15 minutos** dentro da jornada.
- **Antecedência:** cliente exige **3 dias** por data local; a dona pode hoje/amanhã e encaixes.
- **Concorrência:** sem lock. A disponibilidade é **revalidada imediatamente antes de gravar**; se o slot ocupou, o cliente escolhe outro horário.
  - ⚠️ Risco residual aceito: em salão pequeno com baixo volume, double-booking é improvável.
- **Performance:** agrupar chamadas e cachear `WorkingHours`/serviços.

## 5. Modelo de Dados (PostgreSQL)

- **Client:** `name`, `phone` (único — cliente única por telefone no salão).
- **Service:** `name`, `durationMin`, `bufferMin`, `priceCents`, `active`. O `name` é único entre os serviços ativos (sem diferenciar maiúsculas/espaços). Todos os serviços pertencem à dona.
- **WorkingHours:** `weekday`, `startMinute`, `endMinute` (múltiplos intervalos por dia — cobre almoço).
- **Appointment:** `clientId`, `serviceId`, `startsAt`, `endsAt`, `status` (`scheduled`|`completed`|`cancelled`|`no_show`), `origin` (`client`|`staff`).

**Nota:** **Não existe entidade `Professional`**. Todas as operações são da dona única.

## 6. Segurança e LGPD

- **Cliente sem login:** identificação por telefone (risco de privacidade aceito conscientemente no MVP). Deve haver **texto de consentimento** ao informar nome/telefone e política de retenção.
- **Cliente única:** todos os dados (agendamentos, histórico) pertencem à mesma usuária.
- **Autorização:** rotas de API exigem apenas sessão válida (`requireUser`). Não há papéis, `role` ou escopo por recurso — qualquer usuário autenticado é a dona do salão.
- **Cliente nunca recebe dados de outra cliente.** (Verdadeiro, há apenas uma cliente tipo "pública" por agendamento).

## 7. Integrações Externas

- **Google Calendar API:** (Fase final do MVP, não ativa atualmente). OAuth 2.0 + freebusy + events. Caso seja ativado futuramente, quotas e latência exigem agrupamento de chamadas e cache.
- **Referência de deploy:** containers na OCI com PostgreSQL gerenciado.
