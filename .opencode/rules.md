# Orquestração do Studio Blessed

## 1. Regra de Comunicação e Resposta (Modo Direto)
- Seja extremamente conciso. Proibido respostas prolixas ou documentações gigantescas.
- Mantenha qualquer arquivo de especificação (`spec.md`) abaixo de 100 linhas em formato de bullet points.

## 2. Delegação Automática por Skills
Sempre que o usuário solicitar uma das etapas abaixo, ative obrigatoriamente a skill correspondente:
- **Para planejar o produto / desenhar escopo:** Use a skill `product-manager-toolkit` ou `agile-product-owner`.
- **Para estruturar o banco de dados / migrations:** Use a skill `database-schema-designer`.
- **Para escrever código Frontend (Nuxt 4 / Nuxt UI 4):** Use a skill `senior-frontend` combinada com `zero-hallucination-coder`.
- **Para criar e rodar testes:** Use a skill do projeto `studio-blessed-testing` combinada com `tdd-guide` e `api-test-suite-builder`.

## 3. Ciclo de Tarefas
- Leia e atualize estritamente o arquivo `docs/tasks.md` seguindo o formato de checklist (`- [ ]`).
- Execute uma tarefa por vez, valide com testes e marque como concluída (`- [x]`).

## 4. Testes e Cobertura
- Gate local: `pnpm lint && pnpm typecheck && pnpm build && pnpm test:coverage`.
- Metas: unitário **75%**, integração **75%**, E2E **50%** dos fluxos críticos.
- Nomes: `.unit.spec.ts`, `.integration.spec.ts` e `.spec.ts` em `tests/e2e`.
- Banco de teste dedicado: `studio_blessed_test`; rode `pnpm db:up` antes.
- CI desligada até existir a esteira completa de DevOps/deploy; quando existir,
  os mesmos comandos bloqueiam o deploy.
- Detalhes em `docs/testing.md`.