# Backlog — Studio Blessed (MVP)

> Derivado de `docs/discovery.md` e `docs/spec.md`.
> Cada história tem critérios de aceite (CA) em formato Given/When/Then.
> Prioridade: **P0** (núcleo, bloqueia o MVP) · **P1** (importante) · **P2** (desejável).

## Épicos

| ID | Épico | Prioridade |
| --- | --- | --- |
| E1 | Fundação & Autenticação | P0 |
| E2 | Profissionais & Jornada | P0 |
| E3 | Serviços | P0 |
| E4 | Integração Google Calendar | P2 (fase final do MVP) |
| E5 | Bloqueios de Horário | P1 |
| E6 | Motor de Disponibilidade | P0 |
| E7 | Agendamento Público (Cliente) | P0 |
| E8 | Operação de Agendamentos (Staff) | P0 |
| E9 | Dashboard de Métricas | P1 |

---

## E1 — Fundação & Autenticação (P0)

**Objetivo:** base do app, contas e controle de acesso por papel.

### US1.1 — Login do staff
**Como** profissional/admin, **quero** entrar no sistema com Google ou e-mail/senha,
**para** acessar minha área.

- **CA1:** Dado um usuário convidado, quando autentica via provedor válido, então
  é redirecionado ao dashboard conforme seu `role`.
- **CA2:** Dado um e-mail não convidado, quando tenta autenticar, então recebe
  acesso negado (não há auto-cadastro público de staff).
- **CA3:** Dado login bem-sucedido com Google, quando autoriza os escopos de
  Calendar, então o `refreshToken` é persistido para o profissional.

### US1.2 — Convite de profissional
**Como** admin, **quero** convidar uma profissional por e-mail, **para** que ela
crie o próprio acesso.

- **CA1:** Dado o e-mail informado, quando o convite é enviado, então a profissional
  recebe o link/instrução de acesso.
- **CA2:** Dado o convite aceito, quando a profissional entra, então seu `role`
  é `partner` e ela só enxerga os próprios recursos.

### US1.3 — Roteamento por papel
**Como** sistema, **quero** proteger rotas por papel, **para** garantir isolamento.

- **CA1:** Dado `role=partner`, quando acessa recurso de outro profissional, então
  recebe 403.
- **CA2:** Dado `role=admin`, quando acessa qualquer recurso, então é permitido.

### US1.4 — Acesso da cliente sem login
**Como** cliente, **quero** agendar sem criar conta, **para** ter o menor atrito.

- **CA1:** Dado o catálogo público, quando a cliente navega, então nenhuma
  autenticação é exigida.

---

## E2 — Profissionais & Jornada (P0)

**Objetivo:** cadastro de profissionais e configuração de horário de trabalho.

### US2.1 — Cadastro de profissional
**Como** admin, **quero** cadastrar/editar profissionais, **para** que elas
apareçam na operação.

- **CA1:** Dado nome/e-mail válidos, quando salvo, então a profissional é criada
  com `agendaProvider` definido.
- **CA2:** Dado uma profissional sem Google, quando configurada, então
  `agendaProvider=internal` e ela opera via agenda interna.

### US2.2 — Configurar jornada
**Como** profissional/admin, **quero** definir meus horários por dia da semana
com intervalos, **para** que o sistema calcule os slots corretos.

- **CA1:** Dado segunda 09:00–18:00 com intervalo 12:00–13:00, quando o dia é
  processado, então nenhum slot é gerado entre 12:00 e 13:00.
- **CA2:** Dado um dia sem `WorkingHours`, quando consultado, então não há
  disponibilidade.
- **CA3:** Dado alteração de jornada, quando salva, então os próximos cálculos de
  disponibilidade refletem a mudança.

### US2.3 — Definir provedor de agenda
**Como** profissional, **quero** conectar minha agenda Google, **para** que
compromissos externos contem como ocupados.

- **CA1:** Dado autorização OAuth concluída, quando o profissional é salvo, então
  `agendaProvider=google` e a agenda `primary` é usada.
- **CA2:** Dado que revogo a conexão, quando acesso o sistema, então sinaliza a
  necessidade de reconectar.

---

## E3 — Serviços (P0)

**Objetivo:** catálogo de serviços por profissional, agregado por nome na vitrine.

### US3.1 — Cadastrar serviço
**Como** profissional/admin, **quero** criar serviços com nome, duração, buffer e
preço, **para** oferecê-los aos clientes.

- **CA1:** Dado nome, duração (ex.: 40/90/120 min), buffer e preço válidos, quando
  salvo, então o serviço pertence à profissional.
- **CA2:** Dado um combo, quando criado como serviço próprio (nome + duração
  maior), então comporta-se como qualquer serviço.

### US3.2 — Editar apenas os próprios serviços
**Como** profissional, **quero** editar os meus serviços, **para** manter o catálogo
atualizado.

- **CA1:** Dado `role=partner`, quando tenta editar serviço de outra profissional,
  então recebe 403.
- **CA2:** Dado `role=admin`, quando edita qualquer serviço, então é permitido.

### US3.3 — Catálogo agregado por nome
**Como** cliente, **quero** ver um catálogo unificado, **para** escolher o serviço
independentemente de quem o executa.

- **CA1:** Dado o mesmo nome de serviço em 2 profissionais, quando a cliente vê o
  catálogo, então aparece **uma** entrada do serviço.
- **CA2:** Dado o serviço escolhido, quando avanço, então vejo as profissionais que
  o executam, com o preço de cada uma.

---

## E4 — Integração Google Calendar (P0)

**Objetivo:** ler `busy` e escrever/cancelar eventos na agenda da profissional.

### US4.1 — Bloquear slots por eventos externos
**Como** admin, **quero** que eventos fora do sistema contem como ocupados,
**para** não vender horário indisponível.

- **CA1:** Dado um evento criado direto no Google da profissional, quando calculo
  disponibilidade, então o intervalo do evento não aparece como slot.
- **CA2:** Dado um evento de dia inteiro, quando calculo disponibilidade, então o
  dia fica indisponível.

### US4.2 — Criar evento ao confirmar agendamento
**Como** sistema, **quero** gravar o agendamento na agenda, **para** manter a
fonte da verdade única.

- **CA1:** Dado um agendamento confirmado, quando a profissional usa Google, então
  um evento é criado no `primary` com título `Cliente — Serviço`.
- **CA2:** Dado o evento criado, quando consulto, então o `appointmentId` está em
  `extendedProperties.private`.
- **CA3:** Dado profissional com agenda interna, quando confirmado, então o
  registro fica no PostgreSQL (sem evento).

### US4.3 — Cancelar/remarcar reflete na agenda
**Como** sistema, **quero** atualizar a agenda ao cancelar/remarcar, **para** evitar
bloqueio fantasma.

- **CA1:** Dado cancelamento, quando a profissional usa Google, então o evento é
  removido.
- **CA2:** Dado reagendamento, quando a profissional usa Google, então o evento é
  movido para o novo horário.

---

## E5 — Bloqueios de Horário (P1)

**Objetivo:** registrar folgas, almoços e compromissos.

### US5.1 — Criar bloqueio
**Como** profissional/admin, **quero** bloquear um período, **para** deixá-lo
indisponível.

- **CA1:** Dado um bloqueio `13:00–14:00`, quando calculo disponibilidade, então
  não há slots nesse intervalo.
- **CA2:** Dado profissional com Google (E4), quando o bloqueio é salvo, então
  vira evento na agenda.

### US5.2 — Bloqueio recorrente
**Como** profissional, **quero** bloqueios recorrentes (ex.: semanal), **para**
não recriar o almoço todos os dias.

- **CA1:** Dado um bloqueio semanal, quando o dia da semana coincide, então o
  intervalo é bloqueado em todas as ocorrências.

### US5.3 — Bloqueio sobre agendamento
**Como** profissional, **quero** ser avisada ao tentar bloquear sobre um
agendamento existente, **para** não perder o compromisso.

- **CA1:** Dado conflito com agendamento `scheduled`, quando tento salvar o
  bloqueio, então a API responde `409` com a lista de conflitos e a UI pede
  confirmação explícita.
- **CA2:** Dado que confirmo, quando salvo, então o bloqueio é criado e o
  agendamento permanece `scheduled`; nenhum agendamento é cancelado.

---

## E6 — Motor de Disponibilidade (P0)

**Objetivo:** calcular os horários oferecidos ao cliente e ao staff.

### US6.1 — Gerar slots a cada 15 minutos
**Como** cliente, **quero** ver horários disponíveis, **para** escolher o melhor.

- **CA1:** Dado jornada 09:00–18:00 e serviço de 40 min, quando consulto, então
  os inícios aparecem a cada 15 min onde houver espaço suficiente (incluindo buffer).
- **CA2:** Dado que o serviço de 90 min não cabe antes do fim da jornada, quando
  consulto, então esse início não é oferecido.
- **CA3:** Dado buffer de 10 min, quando há agendamento anterior, então o buffer
  é respeitado.

### US6.2 — Antecedência da cliente
**Como** sistema, **quero** aplicar 3 dias de antecedência ao cliente, **para**
respeitar a política do salão.

- **CA1:** Dado hoje, quando a cliente consulta, então nenhum slot com menos de
  3 dias é oferecido.
- **CA2:** Dado `origin=staff`, quando consulta, então slots de hoje/amanhã e
  encaixes são permitidos.

### US6.3 — Revalidar antes de gravar
**Como** sistema, **quero** revalidar o slot na confirmação, **para** evitar
double-booking.

- **CA1:** Dado que o slot ficou ocupado entre a listagem e a confirmação, quando
  a cliente confirma, então o sistema rejeita e pede novo horário.
- **CA2:** Dado slot ainda livre, quando confirma, então o agendamento é gravado.

---

## E7 — Agendamento Público (Cliente) (P0)

**Objetivo:** fluxo público de agendamento.

### US7.1 — Fluxo de agendamento
**Como** cliente, **quero** agendar em poucos passos, **para** reservar meu horário.

- **CA1:** Dado o catálogo, quando escolho serviço → profissional → horário →
  informo nome + WhatsApp → confirmo, então o agendamento é criado com
  `origin=client` e `status=scheduled`.
- **CA2:** Dado WhatsApp já existente, quando informo o telefone, então a cliente
  é reaproveitada (não duplica).
- **CA3:** Dado conflito no serviço, quando a cliente quer outro serviço, então
  repete o fluxo (1 serviço por agendamento).

### US7.2 — Tela de sucesso
**Como** cliente, **quero** ver a confirmação na tela, **para** ter o comprovante
do agendamento.

- **CA1:** Dado agendamento confirmado, quando a tela carrega, então mostra data,
  hora, profissional e serviço.
- **CA2:** Dado o MVP, quando a tela carrega, então **nenhuma** mensagem é enviada.

### US7.3 — Consultar histórico por telefone
**Como** cliente, **quero** ver meus agendamentos informando o telefone, **para**
acompanhar minhas reservas.

- **CA1:** Dado o telefone informado, quando existem agendamentos, então listo os
  meus (salão todo).
- **CA2:** Dado o telefone informado, quando não há agendamentos, então mostro
  estado vazio. *(risco de privacidade aceito — ver discovery §6)*

### US7.4 — Cancelar/remarcar pelo cliente
**Como** cliente, **quero** cancelar ou remarcar, **para** ajustar meu horário.

- **CA1:** Dado um agendamento com **mais de 24h** de antecedência, quando cancelo,
  então o status vira `cancelled` e a agenda é liberada.
- **CA2:** Dado um agendamento com **menos de 24h**, quando tento cancelar, então
  a ação é bloqueada e a política de taxa de 50% é **exibida** (não calculada).
- **CA3:** Dado reagendamento dentro da regra, quando confirmo, então o evento é
  atualizado e a agenda anterior liberada.

---

## E8 — Operação de Agendamentos (Staff) (P0)

**Objetivo:** operação do dia a dia pelo staff.

### US8.1 — Visão de agenda
**Como** profissional, **quero** ver minha agenda, **para** me organizar.

- **CA1:** Dado `role=partner`, quando abro a agenda, então vejo apenas os meus
  agendamentos.
- **CA2:** Dado `role=admin`, quando abro a agenda, então vejo de todas (com filtro
  por profissional).

### US8.2 — Agendar pelo staff
**Como** staff, **quero** criar agendamentos hoje/amanhã e encaixes, **para**
atender pedidos presenciais.

- **CA1:** Dado `origin=staff`, quando crio para hoje, então não há o bloqueio de
  3 dias.
- **CA2:** Dado profissional com Google, quando confirmo, então o evento é criado
  na agenda dela.

### US8.3 — Marcar concluído/no-show
**Como** profissional/admin, **quero** marcar o resultado do atendimento, **para**
alimentar as métricas.

- **CA1:** Dado um agendamento `scheduled`, quando marco, então vira `completed`
  ou `no_show`.
- **CA2:** Dado `role=admin`, quando corrijo um status já marcado, então é permitido.
- **CA3:** Dado um status `completed`, quando o faturamento é calculado, então o
  valor do serviço entra na soma.

### US8.4 — Cancelar como staff
**Como** staff, **quero** cancelar agendamentos, **para** lidar com imprevistos.

- **CA1:** Dado `role=admin`, quando cancela, então pode cancelar qualquer agendamento.
- **CA2:** Dado `role=partner`, quando cancela, então só pode cancelar os próprios.

---

## E9 — Dashboard de Métricas (P1)

**Objetivo:** visão operacional e de movimento do salão.

### US9.1 — Faturamento por período
**Como** admin, **quero** ver o faturamento por dia/semana/mês/ano, **para**
acompanhar o movimento.

- **CA1:** Dado serviços `completed`, quando o período é selecionado, então mostro
  a soma dos preços, **com quebra por profissional**.
- **CA2:** Dado agendamentos `cancelled`/`no_show`, quando somo, então **não**
  entram no faturamento.

### US9.2 — Atendimentos, ranking e no-show
**Como** admin, **quero** ver atendimentos, ranking de serviços e no-show, **para**
entender a operação.

- **CA1:** Dado o período, quando carrego, então vejo o total de atendimentos
  (`completed`).
- **CA2:** Dado o período, quando carrego, então vejo os serviços mais realizados
  em ordem decrescente.
- **CA3:** Dado o período, quando carrego, então vejo a contagem de `no_show`.

### US9.3 — Faturamento próprio da profissional
**Como** profissional, **quero** ver o meu faturamento, **para** acompanhar meu
movimento.

- **CA1:** Dado `role=partner`, quando abro o dashboard, então vejo **apenas** o
  meu faturamento e meus atendimentos.
