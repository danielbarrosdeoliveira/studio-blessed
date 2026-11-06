# MVP Spec - Studio Blessed

> Alinhado ao `docs/discovery.md` (fonte da verdade do produto). Em caso de
> divergência, prevalece o discovery.

## 1. Visão Geral

- Plataforma **web responsiva single-tenant** para gestão de agendamentos do
  salão Studio Blessed.
- Foco em **velocidade, arquitetura enxuta e manutenibilidade** por
  1 desenvolvedor + IA ("Lean AI").
- O salão opera em **modelo de dona única**: a cliente paga **diretamente à
  dona** e o salão não cobra comissão nem repasse, pois há apenas uma usuária.

## 2. Stack Tecnológica

- **Frontend / Backend:** Nuxt 4 (SSR, estrutura `app/`) + Nuxt UI + Tailwind CSS.
- **Template base:** Nuxt UI 4 Dashboard.
- **Banco de Dados:** PostgreSQL hospedado na Oracle Cloud Infrastructure (OCI).
- **Autenticação:** Better Auth — **Google OAuth** (para capturar a agenda da dona)
  **ou e-mail/senha**.
- **Gerenciador de Pacotes:** **pnpm**.
- **Interface:** web responsiva, **pt-BR** (idioma único). ~~PWA~~ não faz parte
  do MVP.
- **Fuso horário:** `America/Sao_Paulo`.

## 3. Papéis e Permissões

O modelo é **single-owner**: não existem papéis, `role` ou hierarquia de acesso.

- **Dona do salão:** qualquer usuário autenticado tem acesso total. Cadastra
  serviços, jornadas e bloqueios. Cria agendamentos para hoje/amanhã e encaixes.
  Vê todas as métricas e corrige status.
- **Profissional:** **não existe** como entidade ou papel. Todas as
  funcionalidades antes atribuídas a profissionais agora pertencem à dona única.
- **Cliente (público):** **sem login**, identificada por **nome + WhatsApp**;
  consulta histórico apenas informando o telefone.

## 4. Agenda

> **Fase 1 do MVP:** apenas **agenda interna** (PostgreSQL). A integração com o
> **Google Calendar** fica para a **fase final do MVP** e será plugada como
> provider adicional, sem mudar o restante do domínio.

- **1 agenda única** para o salão, pertencente à dona.
- **Sincronização:**
  - Dona (agenda interna): apenas os registros do sistema contam.
  - Quando Google Calendar for ativado: qualquer evento na agenda da dona conta como `busy`.
- **Bloqueios manuais:** a dona pode criar bloqueios pontuais ou semanais.
  Podem sobrepor agendamento `scheduled` somente com **confirmação explícita**; o
  agendamento não é cancelado.

## 5. Funcionalidades do MVP

- **Cliente:** acessa `/agendamento` e percorre um **stepper** (Nuxt UI):
  serviço → data/horário → nome + WhatsApp → confirmação. Cada serviço exibe a
  informação de que pertence à dona do salão. A rota antiga `/agendar` redireciona
  para `/agendamento`.
- **Profissional:** **não existe** — não há profissionais no MVP.
- **Dona:** gerencia jornadas, serviços, bloqueios e agenda; opera
  agendamentos de todos; dashboard de métricas.
- **Pagamentos:** **nenhum**. Não há gateway, cobrança ou repasse no MVP.

## 6. Regras de Negócio

- **Composição:** 1 agendamento = **1 serviço + 1 horário**. Multi-serviço = repetir
  o fluxo. Combos são serviços próprios (nome + duração maior).
- **Serviço:** pertence à **dona do salão** (`nome`, `durationMin`, `bufferMin`,
  `price`). O nome é **único entre os serviços ativos do salão**, sem diferenciar
  maiúsculas nem espaços nas pontas. O catálogo lista cada serviço **uma vez**.
- **Granularidade:** inícios de horário a cada **15 minutos** dentro da jornada.
- **Antecedência:**
  - Cliente: mínimo de **3 dias**, contados por **data local** — a
    cliente agenda qualquer horário a partir do 3º dia (inclusive o primeiro
    slot do dia limite).
  - Dona: pode agendar para **hoje/amanhã** e fazer **encaixes**.
- **Cancelamento / reagendamento (cliente):** permitido **até 24h antes**; dentro
  de 24h não é possível (vira **no-show**). A **taxa de 50%** é **apenas exibida**
  como política — não calculada nem registrada.
- **Concorrência:** sem lock distribuído. **Revalidar a disponibilidade antes de
  gravar**; se ocupou, o cliente escolhe outro horário.
- **Notificações:** **nenhuma** no MVP (só tela de sucesso). Automação futura
  (WAHA/WAWA + N8N) fica pós-MVP.
- **Bloqueios:** a dona pode criar/remover bloqueios
  pontuais ou semanais. Podem sobrepor agendamento `scheduled` somente com
  **confirmação explícita**; o agendamento não é cancelado.
- **Status do agendamento:** `scheduled` → `completed` | `cancelled` | `no_show`.
  A dona pode corrigir o status a qualquer momento.

## 7. Métricas (dashboard da dona)

Períodos: **dia, semana, mês e ano**.

- **Faturamento** = soma dos preços dos serviços **concluídos** (mede movimento,
  não receita recebida por terceiros, pois não há profissionais).
- **Total de atendimentos**.
- **Ranking de serviços** mais realizados.

A dona vê **o faturamento total** do salão.

## 8. O que NÃO FAZ PARTE do MVP

- Multi-tenant (múltiplos salões).
- Pagamento online / gateway.
- Engine fiscal ou demonstrativos financeiros avançados.
- Controle de recebimento da mensalidade (não há profissionais a quem repassar).- Notificações automáticas (e-mail, SMS, WhatsApp).
- PWA / suporte offline.
- Reserva multi-serviço atômica.
- Suporte a outros idiomas.

## 9. Documentos Relacionados

- `docs/discovery.md` — decisões de produto (fonte da verdade).
- `docs/architecture.md` — arquitetura técnica.
- `docs/backlog.md` — épicos e user stories com critérios de aceite.
