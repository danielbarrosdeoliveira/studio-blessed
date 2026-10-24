# MVP Spec - Studio Blessed

> Alinhado ao `docs/discovery.md` (fonte da verdade do produto). Em caso de
> divergência, prevalece o discovery.

## 1. Visão Geral

- Plataforma **web responsiva single-tenant** para gestão de agendamentos do
  salão Studio Blessed.
- Foco em **velocidade, arquitetura enxuta e manutenibilidade** por
  1 desenvolvedor + IA ("Lean AI").
- O salão opera em **modelo de parceria**: a cliente paga **diretamente à
  profissional** e o salão cobra **mensalidade fixa** das parceiras. Não há
  comissão nem repasse controlado pelo sistema.

## 2. Stack Tecnológica

- **Frontend / Backend:** Nuxt 4 (SSR, estrutura `app/`) + Nuxt UI + Tailwind CSS.
- **Template base:** Nuxt UI 4 Dashboard.
- **Banco de Dados:** PostgreSQL hospedado na Oracle Cloud Infrastructure (OCI).
- **Autenticação:** Better Auth — **Google OAuth** (para capturar a agenda do
  profissional) **ou e-mail/senha**.
- **Gerenciador de Pacotes:** **pnpm**.
- **Interface:** web responsiva, **pt-BR** (idioma único). ~~PWA~~ não faz parte
  do MVP.
- **Fuso horário:** `America/Sao_Paulo`.

## 3. Papéis e Permissões

- **Admin (dona):** acesso total. Cadastra serviços, profissionais, jornadas e
  bloqueios para todos. Cria agendamentos para hoje/amanhã e encaixes. Vê todas
  as métricas e corrige status.
- **Profissional (partner / service provider):** opera **apenas o que é dela** —
  agenda própria, serviços próprios, bloqueios próprios, cancelar os **próprios**
  agendamentos e marcar concluído/no-show. Vê o **faturamento próprio**.
- **Cliente (público):** **sem login**, identificada por **nome + WhatsApp**;
  consulta histórico apenas informando o telefone.

## 4. Agenda

> **Fase 1 do MVP:** apenas **agenda interna** (PostgreSQL). A integração com o
> **Google Calendar** fica para a **fase final do MVP** e será plugada como
> provider adicional, sem mudar o restante do domínio.

- **1 agenda por profissional**, com duas fontes possíveis (`agendaProvider`):
  - `google` → agenda `primary` do Google Calendar é o banco de agendamentos.
  - `internal` → agenda interna no PostgreSQL (fallback para quem não usa Google).
- **Sincronização:**
  - Professional com Google: **qualquer evento na agenda conta como `busy`**
    (inclusive criados fora do sistema, pelo celular). Escrita bidirecional via
    Google Calendar API.
  - Professional com agenda interna: apenas os registros do sistema contam.
- **Bloqueios manuais:** em profissional com Google viram evento na agenda; em
  agenda interna viram bloqueio local.

## 5. Funcionalidades do MVP

- **Cliente:** catálogo público de serviços → profissionais que executam →
  horários disponíveis → informa nome + WhatsApp → confirma.
- **Profissional:** vê a própria agenda, gerencia seus serviços, cria bloqueios,
  cancela os próprios agendamentos e marca concluído/no-show; vê o faturamento próprio.
- **Admin:** gerencia jornadas, serviços, profissionais e bloqueios; opera
  agendamentos de todos; dashboard de métricas.
- **Pagamentos:** **nenhum**. Não há gateway, cobrança ou repasse no MVP.

## 6. Regras de Negócio

- **Composição:** 1 agendamento = **1 serviço + 1 profissional + 1 horário**.
  Multi-serviço = repetir o fluxo. Combos são serviços próprios (nome + duração maior).
- **Serviço:** pertence a **uma profissional** (`nome`, `durationMin`, `bufferMin`,
  `price`). O catálogo público **agrega por nome** e o **preço pode variar por
  profissional**.
- **Granularidade:** inícios de horário a cada **15 minutos** dentro da jornada.
- **Antecedência:**
  - Cliente: mínimo de **3 dias**.
  - Staff: pode agendar para **hoje/amanhã** e fazer **encaixes**.
- **Cancelamento / reagendamento (cliente):** permitido **até 24h antes**; dentro
  de 24h não é possível (vira **no-show**). A **taxa de 50%** é **apenas exibida**
  como política — não calculada nem registrada.
- **Concorrência:** sem lock distribuído. **Revalidar a disponibilidade antes de
  gravar**; se ocupou, o cliente escolhe outro horário.
- **Notificações:** **nenhuma** no MVP (só tela de sucesso). Automação futura
  (WAAS/WAHA + N8N) fica pós-MVP.
- **Bloqueios:** admin e a própria profissional podem criar/remover bloqueios
  pontuais ou semanais. Podem sobrepor agendamento `scheduled` somente com
  **confirmação explícita**; o agendamento não é cancelado.
- **Status do agendamento:** `scheduled` → `completed` | `cancelled` | `no_show`.
  O admin pode corrigir o status a qualquer momento.

## 7. Métricas (dashboard do admin)

Períodos: **dia, semana, mês e ano**.

- **Faturamento** = soma dos preços dos serviços **concluídos**, com **quebra por
  profissional** (mede movimento, não receita recebida pelo salão).
- **Total de atendimentos**.
- **Ranking de serviços** mais realizados.
- **No-show**.

A profissional vê **apenas o próprio faturamento**.

## 8. O que NÃO FAZ PARTE do MVP

- Multi-tenant (múltiplos salões).
- Pagamento online / gateway.
- Engine fiscal ou demonstrativos financeiros avançados.
- Controle de recebimento da mensalidade das parceiras.
- Notificações automáticas (e-mail, SMS, WhatsApp).
- PWA / suporte offline.
- Reserva multi-serviço atômica.
- Suporte a outros idiomas.

## 9. Documentos Relacionados

- `docs/discovery.md` — decisões de produto (fonte da verdade).
- `docs/architecture.md` — arquitetura técnica.
- `docs/backlog.md` — épicos e user stories com critérios de aceite.
