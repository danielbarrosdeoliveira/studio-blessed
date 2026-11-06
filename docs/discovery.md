# Product Discovery — Studio Blessed (MVP)

> Documento resultante da sessão de discovery (PO) em 2026-10-22.
> Consolida as decisões tomadas, o modelo do produto e os pontos ainda em aberto.
> **Ele prevalece sobre `spec.md` e `architecture.md` onde houver divergência.**

## 1. Visão

Plataforma web responsiva **single-tenant** para gestão de agendamentos do salão
Studio Blessed. Foco em velocidade, arquitetura enxuta e manutenibilidade por
**1 desenvolvedor + IA** ("Lean AI").

O salão opera em **modelo de dona única**: a cliente paga diretamente à dona do salão
e o salão cobra **mensalidade fixa** da própria administração. Não há controle
financeiro de repasse nem comissão, pois há apenas uma usuária.

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

O modelo é **single-owner**: não existem papéis, `role` ou hierarquia de acesso.

- **Dona do salão:** qualquer usuário autenticado tem acesso total. Cadastra serviços, horários e bloqueios. Cria agendamentos para hoje/amanhã/encaixes. Vê todas as métricas e corrige status.
- **Cliente (público):** **sem login**. Identificada por **nome + WhatsApp**. Consulta histórico apenas informando o telefone (risco aceito).
- **Profissional:** **não existe** como entidade ou papel. Todas as funcionalidades antes atribuídas a profissionais agora pertencem à dona.

## 4. Modelo de dados (conceitual)

- **Client:** `name`, `phone` — **única por telefone no salão todo**.
- **Service:** `name`, `durationMin`, `bufferMin`, `priceCents`, `active`. O nome é **único entre os serviços ativos** (sem diferenciar maiúsculas/faixas); o catálogo lista cada serviço uma vez. Serviços inativos preservam o histórico. Combos são serviços próprios com nome e duração maior.
- **WorkingHour:** `weekday`, `startMinute`, `endMinute`, `createdAt`. Pertence à dona.
- **Appointment:** `client`, `service`, `startsAt`, `endsAt`, `status` (`scheduled` | `completed` | `cancelled` | `no_show`), `origin` (`client` | `staff`). **Sem `professionalId`** — a relação é implícita pela dona única do salão.
- **TimeBlock:** `startsAt`, `endsAt`, `reason`, `recurrence` (`weekly`). Bloqueios da dona.

## 5. Fluxo de agendamento (cliente)

1. Abre `/agendamento`.
2. No **stepper**, escolhe um **serviço**.
3. O sistema mostra a **duração e o preço** do serviço selecionado.
4. Informa **nome + WhatsApp** → confirma.
5. Tela de sucesso. **Nenhuma mensagem é enviada** no MVP.

A rota antiga `/agendar` redireciona para `/agendamento`, preservando os parâmetros de serviço quando existirem.

**Um agendamento = 1 serviço + 1 horário.** Para mais de um serviço, a cliente repete o fluxo (decisão de simplificação do MVP).

## 6. Motor de disponibilidade

> **Faseamento do MVP:** a **Fase 1** usa **apenas a agenda interna** (`internal`).
> O Google Calendar entra na **fase final do MVP**. A abstração de provider já
> existe no código, mas sem chamadas reais ao Google nesta fase.

- **Fonte da verdade:** Agenda interna no Postgres (fase 1).
- **Disponibilidade =** `WorkingHours` − `TimeBlocks` − eventos busy.
- **Escrita:** ao confirmar, cria registro no PostgreSQL.
- **Rules de antecedência:**
  - **Cliente:** antecedência mínima de **3 dias** para qualquer serviço,
    contada por **data local** — no 3º dia, o primeiro horário (09:00) já está
    disponível.
  - **Dona:** pode agendar para **hoje/amanhã** e fazer **encaixes**.

### Granularidade dos horários
- Inícios de horário a cada **15 minutos** dentro da jornada.

### Bloqueios
- A dona **pode** criar bloqueios pontuais ou semanais.
- Suportam **recorrência** (ex.: semanal), além de bloqueios pontuais.

### Concorrência
- Sem lock distribuído no MVP. Estratégia: **revalidar a disponibilidade imediatamente antes de gravar**; se ocupou, o cliente escolhe outro horário.
- Risco residual aceito: double-booking é improvável (salão pequeno, baixo volume).

### Cancelamento / reagendamento (cliente)
- Permitido **até 24h antes**.
- Dentro de 24h **não** é possível (vira **no-show**).
- Reagendamento segue a mesma regra.
- Cancelamento com menos de 24h prevê **taxa de 50%**, **apenas exibida como política** — o sistema não calcula, não registra e não bloqueia.

## 7. Métricas (dashboard da dona)

Períodos: **dia, semana, mês e ano**.
- **Faturamento** = soma dos preços dos serviços **concluídos** (mede movimento, não receita recebida por terceiros, pois não há profissionais).
- **Total de atendimentos**.
- **Ranking de serviços** mais realizados.
- **No-show**.
- A **dona** vê **todos os dados** (não há separação por agenda, pois há apenas uma).

## 8. Fora do escopo do MVP

Multi-tenant; pagamento online/gateway; engine fiscal; notificações automáticas (e-mail/SMS/WhatsApp); PWA/offline; reserva multi-serviço atômica; suporte a outros idiomas.

## 9. Riscos

1. **Latência/quota da API do Google** ao calcular disponibilidade (se/quando ativado).
2. **Consistência do `freebusy`** — resolvida por revalidação antes de gravar.
3. **Metadados no evento** — nome do cliente e telefone precisam ir para `description`/`extendedProperties` do evento (quando Google Calendar for ativado).

## 10. Pontos ainda em aberto (backlog de discovery)

1. **Semana:** semanas de calendário ou ISO? Início no domingo ou segunda?

## 11. Contradições resolvidas

- `architecture.md` (Yarn) × `spec.md` (pnpm) → **pnpm** (decisão final pós-setup).
- Modelo multi-tenant × modelo single-owner → **single-owner** (decisão de escopo pós-funding).
- `spec.md`: "Profissional: comissão por valor fixo" → **modelo de dona única**; sem comissão (a lógica de "movimento vs receita" se mantém).
- "Sem notificações" × "enviar mensagem de confirmação" → **sem envio no MVP** (só tela de sucesso); automação futura via WAHA + N8N.
- PWA (ambos os docs) → **web responsivo, sem PWA**.
- "Comissão/repasse" × métrica "faturamento" → faturamento = **movimento** (soma dos preços de serviços concluídos), sem quebra por agenda (não há profissionais).
- **Bloqueio sobre agendamento existente** → exige **confirmação explícita**; o bloqueio é salvo e o agendamento permanece `scheduled`.
- **Agregação de serviços por nome** → regra definida: o nome é **único entre os serviços ativos** (sem diferenciar maiúsculas/espaços) e cada serviço pertence à dona. Não há o mesmo serviço em agendas diferentes (não há profissionais).

---

### Próximos Steps (Discovery Completo)

- [ ] Validar com usuárias se a remoção da exibição de "profissional responsável" afeta a confiança no serviço.
- [ ] Confirmar se o fluxo de 4 steps ainda é esperado ou pode ser reduzido para 3.
- [ ] Definir política de retenção de dados (LGPD) para a única cliente do salão.