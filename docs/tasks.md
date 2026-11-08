# Tasks — Studio Blessed

> Checklist vivo do MVP. Execute uma tarefa por vez, valide o build e marque
> como concluída. O backlog detalhado fica em `docs/backlog.md`.

## Regras de negócio

- [x] Nome de serviço único entre os serviços ativos do salão (todos pertencem à dona única)

## Experiência pública

- [x] Criar o fluxo público `/agendamento` com `UStepper` e redirecionar `/agendar`

## Próximos épicos

- [ ] E9 — Dashboard de métricas
- [ ] E4 — Integração Google Calendar (fase final do MVP)

## Dívidas conhecidas

- [ ] E1 — Restringir o cadastro público de contas (apenas a dona do salão entra)
- [ ] E9 — Remover páginas de template sem uso (`/inbox`, `/customers`, `/settings/*`)
- [ ] E9 — Substituir o dashboard de demonstração da rota `/`

## Observabilidade (produção / PRD)

- [x] Middleware de logging estruturado (`server/middleware/logger.ts`)
- [ ] Health check endpoint (`GET /api/health`)
- [ ] Tabela `audit_log` para ações críticas (agendamento, bloqueio, serviço, jornada)
- [ ] Alerta de erros 5xx via coletor de logs da nuvem
- [ ] Dashboard de métricas operacionais (E9 — Dashboard de Métricas)
