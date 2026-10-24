# Testes — Studio Blessed

> Estratégia de testes do MVP. Os comandos locais descritos aqui são o gate de
> merge enquanto a esteira de DevOps/deploy não existir. Quando ela existir, os
> mesmos comandos passam a bloquear o deploy.

## Stack de testes

| Camada | Ferramenta | Escopo |
| --- | --- | --- |
| Unitário | Vitest 5 (`unit`) | Lógica pura de `app/utils/**` e `server/utils/**` |
| Integração de API | Vitest 5 (`integration-api`) + Nuxt server real | Rotas HTTP em `server/api/**` e utilitários de servidor |
| Integração de UI | Vitest 5 (`integration-nuxt`) + `@nuxt/test-utils` | Componentes Vue em ambiente Nuxt/happy-dom |
| E2E | Playwright + Chromium | Fluxos críticos no browser + SSR/API do Nuxt 4 |

O projeto usa **Nuxt 4** (SSR, estrutura `app/`), **Vue 3** e **Nuxt UI 4**.
Não há suporte a Nuxt 3 nesta base.

## Banco de dados de teste

- Banco dedicado: `studio_blessed_test`.
- URL padrão: `postgres://studio:studio@localhost:5432/studio_blessed_test`.
- `pnpm test:db:setup` derruba os schemas `public` e `drizzle`, aplica as
  migrations e recria os dados de seed.
- O seed grava IDs em `.data/test-seed.json` (ignorado pelo git).
- Usuários: `admin@studioblessed.test`, `maria@studioblessed.test`,
  `ana@studioblessed.test`; senha `senha123456`.
- O banco de desenvolvimento (`studio_blessed`) não é tocado pelos testes.

Subir o PostgreSQL antes de qualquer suíte:

```bash
pnpm db:up
```

## Comandos

| Comando | O que executa |
| --- | --- |
| `pnpm test` | Unitários + integração (API e UI) |
| `pnpm test:unit` | Somente unitários |
| `pnpm test:unit:watch` | Unitários em watch |
| `pnpm test:integration` | Reset do banco + integração de API + UI |
| `pnpm test:e2e` | Playwright nos fluxos críticos (Chromium) |
| `pnpm test:e2e:ui` | Playwright em modo UI |
| `pnpm test:db:setup` | Recria o banco de teste e o seed |
| `pnpm test:all` | `pnpm test` + `pnpm test:e2e` |
| `pnpm test:coverage` | Cobertura completa: unit + integração + E2E |
| `pnpm test:coverage:unit` | Cobertura unitária |
| `pnpm test:coverage:integration` | Cobertura de API + UI |
| `pnpm test:coverage:integration-api` | Cobertura de `server/**` via c8 |
| `pnpm test:coverage:integration-nuxt` | Cobertura dos componentes de UI |
| `pnpm test:coverage:e2e` | Build de produção + E2E + cobertura SSR/API |

Os relatórios HTML ficam em `coverage/unit`, `coverage/integration-api`,
`coverage/integration-nuxt` e `coverage/e2e`. Esses diretórios, `.coverage/`,
`test-results/` e `playwright-report/` são ignorados pelo git.

## Convenções de arquivos

| Sufixo | Camada | Exemplo |
| --- | --- | --- |
| `.unit.spec.ts` | Unitário | `server/utils/time.unit.spec.ts` |
| `.integration.spec.ts` | Integração | `tests/integration/api/api.integration.spec.ts` |
| `.spec.ts` em `tests/e2e` | E2E | `tests/e2e/public-booking.spec.ts` |

Os testes unitários ficam ao lado do código testado. Os testes de integração e
E2E ficam em `tests/`, com helpers compartilhados em `tests/helpers/`.

## Metas de cobertura

| Suíte | Escopo medido | Meta |
| --- | --- | --- |
| Unitário | Arquivos puros de `app/utils/**` e `server/utils/**` | 75% linhas, statements, funções e branches |
| Integração de API | `server/**` | 75% linhas, statements, funções e branches |
| Integração de UI | `AvailabilityPicker.vue` e `StaffAppointmentCard.vue` | 75% linhas, statements, funções e branches |
| E2E | Código de servidor/SSR executado pelos fluxos críticos | 50% linhas, statements e funções |

O runner de cobertura está em `scripts/coverage.ts` e falha com exit code
diferente de zero quando a meta não é atingida. O `vitest.config.ts` também
declara os thresholds de 75% para as suítes Vitest.

### Medição de referência

Execução local em 2026-10-24, com os fluxos atuais:

| Suíte | Testes | Linhas | Branches |
| --- | ---: | ---: | ---: |
| Unitário | 43 | 95,55% | 94,82% |
| Integração de API | 14 | 96,71% | 80,00% |
| Integração de UI | 16 | 93,13% | 92,20% |
| E2E (SSR/API) | 3 | 90,29% | 44,15% |

A cobertura E2E mede os módulos de servidor/SSR carregados durante os fluxos.
Os asserts do Playwright validam o comportamento no browser; a instrumentação
do bundle cliente é uma evolução futura, não um requisito para o gate atual.

## Caminhos críticos cobertos por E2E

| Fluxo | Spec | O que valida |
| --- | --- | --- |
| Cliente agenda e cancela | `tests/e2e/public-booking.spec.ts` | Catálogo, escolha de serviço/data/horário, nome + WhatsApp, confirmação, “Meus agendamentos” e cancelamento |
| Staff cria, conclui e corrige | `tests/e2e/staff-agenda.spec.ts` | Login de admin, criação de agendamento para amanhã, conclusão, no-show e correção de status |
| Escopo da profissional | `tests/e2e/staff-agenda.spec.ts` | Partner vê apenas a própria agenda, sem filtro de admin, e enxerga o agendamento concluído |

Fluxos que ainda entram no E2E conforme os épicos forem concluídos:

- Bloqueios de horário (E5).
- Remarcação pública com a regra de 24h em interface.
- Dashboard de métricas (E9).
- Login com Google (E4, fase final).

## Como o E2E mede cobertura

1. `scripts/coverage.ts e2e` cria `.coverage/e2e/server` e executa o build de
   produção com `NUXT_E2E_COVERAGE=true`, que habilita `nitro.sourceMap`.
2. O Playwright sobe `node .output/server/index.mjs` com `NODE_V8_COVERAGE`
   apontando para `.coverage/e2e/server`.
3. Ao final, o web server recebe `SIGTERM` para descarregar a cobertura.
4. O c8 remapeia o bundle para `app/**` e `server/**` com
   `--exclude-after-remap` e aplica a meta de 50%.

O Playwright roda com **1 worker**, Chromium e reset do banco no início. O helper
`tests/e2e/helpers.ts` espera a hidratação do Nuxt (`window.useNuxtApp`) antes de
interagir, evitando cliques antes do Vue montar.

## Isolamento e armadilhas conhecidas

- A suíte de integração de API sobe o Nuxt na porta `3101`; o E2E usa `3100`.
- As sessões do Better Auth são cacheadas no spec de API para evitar `429` por
  rate limit de login.
- `nitro.sourceMap` é habilitado somente no build de cobertura E2E.
- O banco de teste é resetado no início de cada execução; não rode as suítes em
  paralelo umas com as outras.
- Em Linux sem as bibliotecas do Chromium, instale as dependências do
  Playwright: `pnpm exec playwright install --with-deps chromium` (pode exigir
  sudo). Para apenas baixar o browser: `pnpm exec playwright install chromium`.

## Gate de merge e deploy

Enquanto não existe esteira completa de DevOps/deploy, **a CI fica desligada** e
o gate é local:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test:coverage
```

Quando a esteira existir, os mesmos comandos devem rodar nela e impedir o deploy
quando qualquer meta de cobertura falhar. Nenhum deploy deve ocorrer sem a
cobertura correta de unit, integração e E2E.

O fluxo de merge continua: branch + PR para `main`, **merge commit** (sem squash
ou rebase) e branches preservadas.
