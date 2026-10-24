# Product Discovery — Studio Blessed (MVP)

> Documento resultante da sessão de discovery (PO) em 2026-10-22.
> Consolida as decisões tomadas, o modelo do produto e os pontos ainda em aberto.
> **Ele prevalece sobre `spec.md` e `architecture.md` onde houver divergência.**

## 1. Visão

Plataforma web responsiva **single-tenant** para gestão de agendamentos do salão
Studio Blessed. Foco em velocidade, arquitetura enxuta e manutenibilidade por
**1 desenvolvedor + IA** ("Lean AI").

O salão opera em **modelo de parceria**: a cliente paga diretamente à
profissional e o salão cobra **mensalidade fixa** das parceiras. Não há controle
financeiro de repasse nem comissão.

## 2. Stack (corrigida)

| Item | Decisão |
| --- | --- |
| Frontend / Backend | Nuxt 4 (SSR, estrutura `app/`) + Nuxt UI 4 Dashboard + Tailwind CSS |
| Gerenciador de pacotes | **pnpm** (decidido após setup; store global + links) |
| Banco de dados | PostgreSQL (OCI) |
| Autenticação | Better Auth — **Google OAuth** ou **e-mail/senha** |
| Interface | **Web responsivo, pt-BR** — ~~PWA~~ (removido do MVP) |
| Fuso horário | `America/Sao_Paulo` |

## 3. Papéis e permissões

- **Admin (dona):** acesso total. Cadastra serviços, profissionais, horários e
  bloqueios para todos. Cria agendamentos para hoje/amanhã/encaixes.
- **Profissional (partner/service provider):** loga no sistema, opera **apenas o
  que é dela** — agenda própria, serviços próprios, blocos próprios, cancelar os
  **próprios** agendamentos, marcar concluído/no-show. Vê o **faturamento próprio**.
- **Cliente (público):** **sem login**. Identificada por **nome + WhatsApp**.
  Consulta histórico apenas informando o telefone (risco aceito).

## 4. Modelo de dados (conceitual)

- **Client:** `name`, `phone` — **única por telefone no salão todo**.
- **Professional:** `name`, `email`, `role` (admin/partner), `agendaProvider`
  (`google` | `internal`), tokens OAuth (quando Google).
- **Service:** pertence a **uma profissional** → `name`, `durationMin`, `bufferMin`,
  `price`. O nome é **único entre os serviços ativos** (sem diferenciar
  maiúsculas/espaços); o catálogo lista cada serviço uma vez com a profissional
  responsável. Serviços inativos preservam o histórico. Combos são serviços
  próprios com nome e duração maior.
- **WorkingHours:** por profissional, por dia da semana, com intervalos (almoço/folgas).
- **Appointment:** `client`, `professional`, `service`, `startsAt`, `endsAt`,
  `status` (`scheduled` | `completed` | `cancelled` | `no_show`), `origin`
  (`client` | `staff`), `externalEventId` (quando Google).
- **TimeBlock:** bloqueio de horário (`professional`, `startsAt`, `endsAt`,
  `reason`, `recurrence?` — ex.: semanal). Em Google vira evento; em agenda
  interna é registro local.

## 5. Fluxo de agendamento (cliente)

1. Abre `/agendamento`.
2. No **stepper**, escolhe um **serviço**.
3. O sistema mostra a **profissional responsável** e os **horários disponíveis**.
4. Informa **nome + WhatsApp** → confirma.
5. Tela de sucesso. **Nenhuma mensagem é enviada** no MVP.

A rota antiga `/agendar` redireciona para `/agendamento`, preservando os
parâmetros de serviço/profissional quando existirem.

**Um agendamento = 1 serviço + 1 profissional + 1 horário.** Para mais de um
serviço, a cliente repete o fluxo (decisão de simplificação do MVP).

## 6. Motor de disponibilidade

> **Faseamento do MVP:** a **Fase 1** usa **apenas a agenda interna** (`internal`).
> O Google Calendar entra na **fase final do MVP**. A abstração de provider já
> existe no código, mas sem chamadas reais ao Google nesta fase.

- **Duas fontes por profissional:**
  - `google` → agenda `primary` da profissional é o banco de agendamentos.
  - `internal` → agenda interna no Postgres (fonte usada na Fase 1).
- **Fonte da verdade:** Google Calendar quando conectado; caso contrário, a
  agenda interna.
- **Disponibilidade =** `WorkingHours` − `bloqueios` − `eventos busy`.
  - Professional com Google: **qualquer evento na agenda dela conta como busy**
    (inclusive criados fora do sistema, no celular dela).
  - Professional com agenda interna: só o que está no sistema conta.
- **Escrita:** ao confirmar, cria/atualiza o evento no Google (ou o registro
  interno). Cancelar/remarcar atualiza ou remove o evento correspondente.

### Regras de antecedência
- **Cliente:** antecedência mínima de **3 dias** para qualquer serviço.
- **Staff (admin/profissional):** pode agendar para **hoje/amanhã** e fazer **encaixes**.

### Granularidade dos horários
- Inícios de horário a cada **15 minutos** dentro da jornada.

### Bloqueios
- Admin **e** a própria profissional podem criar bloqueios.
- Suportam **recorrência** (ex.: semanal), além de bloqueios pontuais.
- Em profissional com Google, o bloqueio é gravado como evento na agenda `primary`.

### Concorrência
- Sem lock distribuído no MVP. Estratégia: **revalidar a disponibilidade
  imediatamente antes de gravar**; se ocupou, o cliente escolhe outro horário.
- Risco residual aceito: double-booking é improvável (salão pequeno, baixo volume).

### Cancelamento / reagendamento (cliente)
- Permitido **até 24h antes**.
- Dentro de 24h **não** é possível (vira **no-show**).
- Reagendamento segue a mesma regra.
- Cancelamento com menos de 24h prevê **taxa de 50%** — **apenas exibida como
  política**; o sistema não calcula, não registra e não bloqueia.

## 7. Métricas (dashboard do admin)

Períodos: **dia, semana, mês e ano**.
- **Faturamento** = soma dos preços dos serviços **concluídos**, com **quebra por
  profissional** (mede movimento, não receita recebida pelo salão).
- **Total de atendimentos**.
- **Ranking de serviços** mais realizados.
- **No-show**.
- A profissional vê **apenas o próprio faturamento**.
- O **admin pode corrigir o status** de qualquer agendamento (concluído/no-show)
  a qualquer momento.

## 8. Fora do escopo do MVP

Multi-tenant; pagamento online/gateway; engine fiscal; notificações automáticas
(e-mail/SMS/WhatsApp); PWA/offline; reserva multi-serviço atômica; controle de
pagamento da mensalidade das parceiras; controle financeiro de repasse/comissão;
suporte a outros idiomas.

## 9. Riscos

1. **OAuth do Google em modo Testing** — escopos de Calendar são sensíveis/restritos.
   Enquanto não verificado, o app fica limitado a ~100 usuários de teste e tokens
   expiram em 7 dias. **Decisão: aceitável no MVP** (só a equipe usa Google:
   2 profissionais). Rever antes de crescer.
2. **Latência/quota da API do Google** ao calcular disponibilidade.
3. **Consistência do `freebusy`** — resolvida por revalidação antes de gravar.
4. **Metadados no evento** — nome do cliente, telefone e serviço precisam ir para
   `description`/`extendedProperties` do evento.

## 10. Pontos ainda em aberto (backlog de discovery)

1. **Admin agendando para uma profissional sem Google conectado:** confirma que
   cai na agenda interna?
2. **LGPD:** texto de consentimento ao informar nome/telefone e política de
   retenção (dados vão para a agenda Google da profissional).
3. **Semana:** semanas de calendário ou ISO? Início no domingo ou segunda?

## 11. Contradições resolvidas

- `architecture.md` (Yarn) × `spec.md` (pnpm) → **pnpm** (decisão final pós-setup).
- `spec.md`: "Profissional: comissão por valor fixo" → **modelo de parceria com
  mensalidade fixa**; sem comissão.
- "Sem notificações" × "enviar mensagem de confirmação" → **sem envio no MVP**
  (só tela de sucesso); automação futura via WAHA + N8N.
- PWA (ambos os docs) → **web responsivo, sem PWA**.
- "Comissão/repasse" × métrica "faturamento" → faturamento = **movimento**
  (soma dos preços de serviços concluídos), quebrado por profissional.
- **Bloqueio sobre agendamento existente** → exige **confirmação explícita**;
  o bloqueio é salvo e o agendamento permanece `scheduled`.
- **Agregação de serviços por nome** → regra definida: o nome é **único entre os
  serviços ativos** (sem diferenciar maiúsculas/espaços) e cada serviço tem **uma
  profissional responsável**. Não há o mesmo serviço em profissionais diferentes.
