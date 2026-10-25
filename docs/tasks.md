# Tasks — Studio Blessed

> Checklist vivo do MVP. Execute uma tarefa por vez, valide com testes e marque
> como concluída. O backlog detalhado fica em `docs/backlog.md`.

## Qualidade e testes

- [x] Configurar Vitest 5 com os projetos `unit`, `integration-api` e `integration-nuxt`
- [x] Criar banco de teste dedicado `studio_blessed_test` com reset, migrations e seed
- [x] Escrever testes unitários da lógica pura de `app/utils/**` e `server/utils/**`
- [x] Escrever testes de integração das rotas de API
- [x] Escrever testes de integração dos componentes de agenda e disponibilidade
- [x] Automatizar os fluxos críticos com Playwright + Chromium
- [x] Criar runner de cobertura com metas de 75% (unit/integração) e 50% (E2E)
- [x] Medir cobertura E2E com build de produção, c8 e source maps do Nitro
- [x] Documentar a estratégia em `docs/testing.md`
- [x] Criar a skill de projeto `studio-blessed-testing`
- [x] Revisar a documentação e padronizar Nuxt 4 / Nuxt UI 4
- [x] Rodar a validação final: `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test:coverage`
- [x] Commitar, abrir PR em inglês e fazer merge commit

## Regras de negócio

- [x] Nome de serviço único entre os serviços ativos e uma profissional responsável por serviço

## Experiência pública

- [x] Criar o fluxo público `/agendamento` com `UStepper` e redirecionar `/agendar`

## Próximos épicos

- [x] E5 — Bloqueios de horário
- [ ] E9 — Dashboard de métricas
- [ ] E4 — Integração Google Calendar (fase final do MVP)

## Dívidas conhecidas

- [ ] E1 — Fluxo de convite de profissional
- [ ] E1 — Desabilitar auto-cadastro público de staff
- [ ] E9 — Remover páginas de template sem uso (`/inbox`, `/customers`, `/settings/*`)
- [ ] E9 — Substituir o dashboard de demonstração da rota `/`

## Observabilidade (produção / PRD)

- [x] Middleware de logging estruturado (`server/middleware/logger.ts`)
- [ ] Health check endpoint (`GET /api/health`)
- [ ] Tabela `audit_log` para ações críticas (agendamento, bloqueio, serviço, jornada)
- [ ] Alerta de erros 5xx via coletor de logs da nuvem
- [ ] Dashboard de métricas operacionais (E9 — Dashboard de Métricas)

