# Backlog — Studio Blessed (MVP)

> Derivado de `docs/discovery.md` e `docs/spec.md`.
> Cada história tem critérios de aceite (CA) em formato Given/When/Then.
> Prioridade: **P0** (núcleo, bloqueia o MVP) · **P1** (importante) · **P2** (desejável).

## Épicos

| ID | Épico | Prioridade |
| --- | --- | --- |
| E1 | Fundação & Autenticação | P0 |
| E2 | Jornada & Horário da Dona | P0 |
| E3 | Serviços | P0 |
| E4 | Integração Google Calendar | P2 (fase final do MVP) |
| E5 | Bloqueios de Horário | P1 |
| E6 | Motor de Disponibilidade | P0 |
| E7 | Agendamento Público (Cliente) | P0 |
| E8 | Operação de Agendamentos | P0 |
| E9 | Dashboard de Métricas | P1 |

---

## E1 — Fundação & Autenticação (P0)

**Objetivo:** base do app, contas e controle de acesso por papel.

### US1.1 — Login do staff

**Como** admin (dona), **quero** entrar no sistema com Google ou e-mail/senha,
**para** acessar minha área.

- **CA1:** Dado um usuário convidado, quando autentica via provedor válido, então
  é redirecionado ao dashboard conforme seu `role`.
- **CA2:** Dado um e-mail não convidado, quando tenta autenticar, então recebe
  acesso negado (não há auto-cadastro público de staff).
- **CA3:** Dado login bem-sucedido com Google, quando autoriza os escopos de
  Calendar, então o `refreshToken` é persistido para a dona.

### US1.2 — (Semelhante ao antigo US1.2, adaptado)

### US1.3 — Roteamento por papel

**Como** sistema, **quero** proteger rotas por papel, **para** garantir isolamento.

- **CA1:** Dado `role=admin`, quando acessa qualquer recurso, então é permitido.
- **CA2:** Dado `role=partner` ou profissional, quando acessa recurso alheio, então
  recebe 403. *(Não se aplica no MVP, mas mantido para consistência de API).*

### US1.4 — Acesso da cliente sem login

**Como** cliente, **quero** agendar sem criar conta, **para** ter o menor atrito.

- **CA1:** Dado o catálogo público, quando a cliente navega, então nenhuma
  autenticação é exigida.

---

## E2 — Jornada & Horário da Dona (P0)

**Objetivo:** cadastro de jornadas e configuração de horário de trabalho da dona.

### US2.1 — Cadastro de jornada

**Como** admin (dona), **quero** definir meus horários por dia da semana com intervalos,
**para** que o sistema calcule os slots corretamente.

- **CA1:** Dada segunda 09:00–18:00 com intervalo 12:00–13:00, quando o dia é
  processado, então nenhum slot é gerado entre 12:00 e 13:00.
- **CA2:** Dado um dia sem `WorkingHours`, quando consultado, então não há disponibilidade.
- **CA3:** Dado alteração de jornada, quando salva, então os próximos cálculos de
  disponibilidade refletem a mudança.

### US2.2 — Configurar blocos

**Como** admin (dona), **quero** bloquear períodos do dia,
**para** deixá-los indisponíveis.

- **CA1:** Dado um bloco `13:00–14:00`, quando calculo disponibilidade, então
  não há slots nesse intervalo.
- **CA2:** Dado um bloqueio semanal, quando o dia da semana coincide, então o
  intervalo é bloqueado em todas as ocorrências.

---

## E3 — Serviços (P0)

**Objetivo:** catálogo de serviços pertencentes à dona, com nome único entre os serviços ativos do salão.

### US3.1 — Cadastrar serviço

**Como** admin (dona), **quero** criar serviços com nome, duração, buffer e preço,
**para** oferecê-los aos clientes.

- **CA1:** Dado nome, duração (ex.: 40/90/120 min), buffer e preço válidos, quando
  salvo, então o serviço é criado e o nome é único entre os serviços ativos do salão.
- **CA2:** Dado um combo, quando criado como serviço próprio (nome + duração
  maior), então comporta-se como qualquer serviço.
- **CA3:** Dado um nome já usado por serviço ativo — quando salvo, então a API
  responde `409`.

### US3.2 — Editar apenas os próprios serviços

**Como** admin (dona), **quero** editar os meus serviços,
**para** manter o catálogo atualizado.

- **CA1:** Dado `role=admin`, quando edita qualquer serviço, então é permitido.

### US3.3 — Catálogo com profissional responsável

**Como** cliente, **quero** ver cada serviço uma vez com a informação de que pertence à dona do salão,
**para** escolher o serviço e saber quem o executa.

- **CA1:** Dado um serviço ativo, quando a cliente vê o catálogo, então aparece
  **uma única** entrada do serviço.
- **CA2:** Dado o serviço escolhido, quando avança, então vê a duração e o preço.
- **Nota:** Não há mais "profissional responsável" como campo separado — o serviço
  pertence à dona do salão por definição do modelo single-owner.

---

## E4 — Integração Google Calendar (P0)

**Objetivo:** ler `busy` e escrever/cancelar eventos na agenda da dona (fase final do MVP).

### US4.1 — Bloquear slots por eventos externos

**Como** admin, **quero** que eventos fora do sistema contem como ocupados,
**para** não vender horário indisponível.

- **CA1:** Dado um evento criado direto no Google da dona, quando calculo
  disponibilidade, então o intervalo do evento não aparece como slot.

### US4.2 — Criar evento ao confirmar agendamento

**Como** sistema, **quero** gravar o agendamento na agenda da dona,
**para** manter a fonte da verdade.

- **CA1:** Dado um agendamento confirmado, quando a dona usa Google, então
  um evento é criado no `primary` com título `Cliente — Serviço`.

### US4.3 — Cancelar/remarcar reflete na agenda

**Como** sistema, **quero** atualizar a agenda ao cancelar/remarcar,
**para** evitar bloqueio fantasma.

- **CA1:** Dado cancelamento, quando a dona usa Google, então o evento é removido.
- **CA2:** Dado reagendamento, quando a dona usa Google, então o evento é movido
  para o novo horário.

---

## E5 — Bloqueios de Horário (P1)

**Objetivo:** registrar folgas, almoços e compromissos da dona.

### US5.1 — Criar bloqueio

**Como** admin (dona), **quero** bloquear um período,
**para** deixá-lo indisponível.

- **CA1:** Dado um bloqueio `13:00–14:00`, quando calculo disponibilidade, então
  não há slots nesse intervalo.

### US5.2 — Bloqueio recorrente

**Como** admin (dona), **quero** bloqueios recorrentes (ex.: semanal),
**para** não recriar o almoço todos os dias.

- **CA1:** Dado um bloqueio semanal, quando o dia da semana coincide, então o
  intervalo é bloqueado em todas as ocorrências.

### US5.3 — Bloqueio sobre agendamento

**Como** admin (dona), **quero** ser avisada ao tentar bloquear sobre um
agendamento existente, **para** não perder o compromisso.

- **CA1:** Dado conflito com agendamento `scheduled`, quando tento salvar o bloqueio,
  então a API responde `409` com a lista de conflitos e a UI pede confirmação explícita.
- **CA2:** Dado que confirmo, quando salvo, então o bloqueio é criado e o agendamento permanece `scheduled`; nenhum agendamento é cancelado.

---

## E6 — Motor de Disponibilidade (P0)

**Objetivo:** calcular os horários oferecidos ao cliente e ao staff.

### US6.1 — Gerar slots a cada 15 minutos

**Como** cliente, **quero** ver horários disponíveis, **para** escolher o melhor.

- **CA1:** Dada jornada 09:00–18:00 e serviço de 40 min, quando consulto, então
  os inícios aparecem a cada 15 min onde houver espaço suficiente (incluindo buffer).
- **CA2:** Dado que o serviço de 90 min não cabe antes do fim da jornada, quando
  consulto, então esse início não é oferecido.
- **CA3:** Dado buffer de 10 min, quando há agendamento anterior, então o buffer
  é respeitado.

### US6.2 — Antecedência da cliente

**Como** sistema, **quero** aplicar 3 dias de antecedência ao cliente,
**para** respeitar a política do salão.

- **CA1:** Dado hoje, quando a cliente consulta, então nenhum slot com menos de
  3 dias é oferecido.

### US6.3 — Revalidar antes de gravar

**Como** sistema, **quero** revalidar o slot na confirmação,
**para** evitar double-booking.

- **CA1:** Dado que o slot ficou ocupado entre a listagem e a confirmação, quando
  a cliente confirma, então o sistema rejeita e pede novo horário.
- **CA2:** Dado slot ainda livre, quando confirma, então o agendamento é gravado.

---

## E7 — Agendamento Público (Cliente) (P0)

**Objetivo:** fluxo público de agendamento.

### US7.1 — Fluxo de agendamento

**Como** cliente, **quero** agendar em poucos passos, **para** reservar meu horário.

- **CA1:** Dado o fluxo público em `/agendamento`, quando avanço pelo stepper
  escolhendo serviço → data/horário → nome + WhatsApp → confirmação, então o
  agendamento é criado com `origin=client` e `status=scheduled`.
- **CA2:** Dado WhatsApp já existente, quando informo o telefone, então a cliente
  é reaproveitada (não duplica).
- **CA3:** Dado conflito no serviço, quando a cliente quer outro serviço, então
  repete o fluxo (1 serviço por agendamento).
- **CA4:** Dado um link antigo `/agendar`, quando acesso, então sou redirecionada
  para `/agendamento`, preservando serviço quando informado.

### US7.2 — Tela de sucesso

**Como** cliente, **quero** ver a confirmação na tela, **para** ter o comprovante
do agendamento.

- **CA1:** Dado agendamento confirmado, quando a tela carrega, então mostra data,
  hora, serviço e a informação de que foi realizado pela dona do salão.
- **CA2:** Dado o MVP, quando a tela carrega, então **nenhuma** mensagem é enviada.

### US7.3 — Consultar histórico por telefone

**Como** cliente, **quero** ver meus agendamentos informando o telefone,
**para** acompanhar minhas reservas.

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

**Objetivo:** operação do dia a dia pela dona (antigamente staff).

### US8.1 — Visão de agenda

**Como** dona (admin), **quero** ver minha agenda, **para** me organizar.

- **CA1:** Dado `role=admin`, quando abro a agenda, então vejo todos os agendamentos.
- **CA2:** Filtros por data e status (opcional).

### US8.2 — Agendar pela dona

**Como** dona (admin), **quero** criar agendamentos hoje/amanhã e encaixes,
**para** atender pedidos presenciais.

- **CA1:** Dado `origin=staff`, quando crio para hoje, então não há o bloqueio de
  3 dias.

### US8.3 — Marcar concluído/no-show

**Como** dona (admin), **quero** marcar o resultado do atendimento,
**para** alimentar as métricas.

- **CA1:** Dado um agendamento `scheduled`, quando marco, então vira `completed`
  ou `no_show`.
- **CA2:** Dado `role=admin`, quando corrijo um status já marcado, então é permitido.
- **CA3:** Dado um status `completed`, quando o faturamento é calculado, então o
  valor do serviço entra na soma.

### US8.4 — Cancelar como dona

**Como** dona (admin), **quero** cancelar agendamentos,
**para** lidar com imprevistos.

- **CA1:** Dado `role=admin`, quando cancela, então pode cancelar qualquer agendamento.

---

## E9 — Dashboard de Métricas (P1)

**Objetivo:** visão operacional e de movimento do salão.

### US9.1 — Faturamento por período

**Como** admin (dona), **quero** ver o faturamento por dia/semana/mês/ano,
**para** acompanhar o movimento.

- **CA1:** Dado serviços `completed`, quando o período é selecionado, então mostro
  a soma dos preços, **sem quebra por profissional** (não há profissionais, o faturamento
  é total do movimento do salão).
- **CA2:** Dado agendamentos `cancelled`/`no_show`, quando somo, então **não**
  entram no faturamento.

### US9.2 — Atendimentos, ranking e no-show

**Como** admin (dona), **quero** ver atendimentos, ranking de serviços e no-show,
**para** entender a operação.

- **CA1:** Dado o período, quando carrego, então vejo o total de atendimentos
  (`completed`).
- **CA2:** Dado o período, quando carrego, então vejo os serviços mais realizados
  em ordem decrescente.
- **CA3:** Dado o período, quando carrego, então vejo a contagem de `no_show`.

### US9.3 — Faturamento próprio (consolidado)

**Como** dona (admin), **quero** ver o faturamento consolidado do salão,
**para** acompanhar o movimento total.

- **CA1:** Dado `role=admin`, quando abro o dashboard, então vejo **apenas** o
  faturamento total (soma de todos os serviços concluídos), sem separação por
  profissional (não há profissionais no modelo).

---