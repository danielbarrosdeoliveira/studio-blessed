---
name: studio-blessed-testing
description: Testes e cobertura do Studio Blessed (Nuxt 4, Vitest 5, Playwright, c8). Use ao criar ou revisar testes unitários, de integração ou E2E, ao rodar o gate local de merge e ao investigar falhas de cobertura ou do banco de teste.
---

# Studio Blessed — Testes

## Quando usar

Use esta skill quando a tarefa envolver:

- criar, corrigir ou revisar testes;
- rodar o gate local de merge;
- investigar cobertura abaixo da meta;
- depurar o banco de teste, o Playwright ou o c8;
- adicionar um novo fluxo crítico ao E2E.

## Stack

- **Nuxt 4** (SSR, `app/`) — não usar padrões de Nuxt 3.
- **Vitest 5** com os projetos `unit`, `integration-api` e `integration-nuxt`.
- **Playwright + Chromium** para E2E.
- **c8** para cobertura de `server/**` e do E2E.
- **PostgreSQL** dedicado: `studio_blessed_test`.

## Convenções

| Tipo | Sufixo | Local |
| --- | --- | --- |
| Unitário | `.unit.spec.ts` | Ao lado do código |
| Integração | `.integration.spec.ts` | `tests/integration/**` |
| E2E | `.spec.ts` | `tests/e2e/**` |

Helpers compartilhados ficam em `tests/helpers/` e `tests/e2e/helpers.ts`.

## Comandos

```bash
pnpm db:up                 # PostgreSQL local
pnpm test:db:setup         # recria o banco de teste + seed
pnpm test                  # unit + integração
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm test:coverage         # unit + integração + E2E com thresholds
pnpm test:coverage:unit
pnpm test:coverage:integration
pnpm test:coverage:e2e
```

Relatórios: `coverage/unit`, `coverage/integration-api`,
`coverage/integration-nuxt`, `coverage/e2e`.

## Metas

- Unitário: **75%** de linhas, statements, funções e branches.
- Integração de API: **75%** sobre `server/**`.
- Integração de UI: **75%** sobre `AvailabilityPicker.vue` e
  `StaffAppointmentCard.vue`.
- E2E: **50%** de linhas, statements e funções no código de servidor/SSR
  executado pelos fluxos críticos. Branches são reportados, mas aprofundados em
  unit/integration.

O runner `scripts/coverage.ts` falha quando a meta não é atingida. Não reduza
thresholds para fazer um PR passar; cubra o comportamento que falta.

## Fluxos críticos E2E

- Cliente agenda pelo catálogo e cancela em “Meus agendamentos”.
- Staff/admin cria, conclui, marca no-show e corrige status.
- Partner vê somente a própria agenda, sem filtro de admin.

Ao adicionar um épico, inclua o fluxo crítico correspondente em `tests/e2e` e
atualize `docs/testing.md`.

## Armadilhas

- Sempre suba o PostgreSQL (`pnpm db:up`) antes das suítes.
- O banco de teste é resetado por `pnpm test:db:setup`; não rode suítes em
  paralelo umas com as outras.
- Sessões do Better Auth são cacheadas no spec de API para evitar `429`.
- O E2E espera a hidratação com `waitForHydration` antes de clicar.
- Em Linux sem libs do Chromium:
  `pnpm exec playwright install --with-deps chromium` (pode exigir sudo).
- A cobertura E2E usa build de produção com `nitro.sourceMap`; o c8 exige
  `--exclude-after-remap`.
- CI está desligada até existir esteira de DevOps/deploy. O gate é local:
  `pnpm lint && pnpm typecheck && pnpm build && pnpm test:coverage`.

## Referências

- `docs/testing.md` — estratégia completa.
- `scripts/coverage.ts` — runner e thresholds.
- `scripts/test-db.ts` — reset, migrations e seed.
- `vitest.config.ts` — projetos e configuração de cobertura.
- `playwright.config.ts` — E2E e modo de cobertura.
