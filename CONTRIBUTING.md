# Contributing — Studio Blessed

## Fluxo de trabalho

**Nunca commitar direto na `main`.** Toda mudança entra por branch + Pull Request.

```
main
 └── feat/<epico>-<slug>      ← nova funcionalidade
 └── fix/<slug>               ← correção de bug
 └── chore/<slug>             ← setup, tooling, dependências
 └── docs/<slug>              ← documentação
 └── refactor/<slug>          ← refatoração sem mudança de comportamento
```

### Passo a passo

1. Atualize a `main`:
   ```bash
   git checkout main && git pull
   ```
2. Crie a branch:
   ```bash
   git checkout -b feat/e2-jornada-profissional
   ```
3. Desenvolva em commits pequenos e atômicos.
4. Rode as validações locais (gate de merge enquanto a CI não existe):
   ```bash
   pnpm db:up
   pnpm lint
   pnpm typecheck
   pnpm build
   pnpm test:coverage   # unit + integração + E2E com thresholds
   ```
5. Faça push e abra o PR:
   ```bash
   git push -u origin feat/e2-jornada-profissional
   ```
6. Abra o PR para `main` e preencha o template.
7. Após os checks locais verdes e a revisão, faça **merge commit**
   (`Create a merge commit`). Não use squash nem rebase: o histórico de commits e
   branches deve ser preservado (grafo não linear).

## Convenção de commits

[Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<escopo>): <descrição no imperativo>
```

Tipos: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`.

Exemplos:

- `feat(auth): add login page and role middleware`
- `feat(services): add CRUD for professional services`
- `fix(availability): respect service buffer between appointments`
- `chore(deps): bump nuxt to 4.6.3`

## Escopo por épico

Cada épico do [`docs/backlog.md`](../docs/backlog.md) vira **uma branch** (ou mais,
se o épico for grande). Exemplos:

| Épico | Branch sugerida |
| --- | --- |
| E1 — Fundação & Autenticação | `feat/e1-fundacao` |
| E2 — Profissionais & Jornada | `feat/e2-profissionais-jornada` |
| E3 — Serviços | `feat/e3-servicos` |
| E5 — Bloqueios | `feat/e5-bloqueios` |
| E6 — Motor de Disponibilidade | `feat/e6-disponibilidade` |
| E7 — Agendamento Público | `feat/e7-agendamento-publico` |
| E8 — Operação de Agendamentos | `feat/e8-operacao-agendamentos` |
| E9 — Dashboard de Métricas | `feat/e9-metricas` |

## Definition of Done (DoD)

Um PR só está pronto quando:

- [ ] `pnpm lint` passa
- [ ] `pnpm typecheck` passa
- [ ] `pnpm build` passa
- [ ] `pnpm test:coverage` passa com as metas: unit **75%**, integração **75%** e E2E **50%**
- [ ] Fluxos críticos cobertos por E2E (agendamento público, operação do staff e escopo da partner)
- [ ] Critérios de aceite da(s) user story(s) implementados
- [ ] Sem segredos/credenciais no código (`.env` fora do git)
- [ ] Docs atualizados, se a decisão mudou o comportamento
- [ ] PR revisado

## Testes

- Unitário: sufixo `.unit.spec.ts`, ao lado do código.
- Integração: sufixo `.integration.spec.ts`, em `tests/integration/**`.
- E2E: `.spec.ts`, em `tests/e2e/**`.
- Banco de teste dedicado: `studio_blessed_test` (não use o banco de desenvolvimento).
- Estratégia completa, comandos e metas: [`docs/testing.md`](docs/testing.md).

## Banco de dados

- Alterou `server/database/schema.ts`? Rode `pnpm db:generate` e commite a migration.
- Nunca edite migrations já aplicadas em `main`.

## Configuração recomendada no GitHub

- **Branch protection** na `main`:
  - exigir PR antes do merge;
  - bloquear force-push e deleção.
- **CI desligada por decisão do MVP** até existir a esteira completa de
  DevOps/deploy. O gate atual é local (`lint`, `typecheck`, `build` e
  `test:coverage`). Quando a esteira existir, os mesmos comandos devem ser
  obrigatórios e bloquear o deploy.
- **Merge commit** como método padrão (histórico não linear, preservando os nós de
  commits e branches). Squash e rebase desabilitados.
