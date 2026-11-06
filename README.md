# Studio Blessed

Plataforma web responsiva (single-tenant) para gestão de agendamentos do salão
**Studio Blessed**.

## Stack

- [Nuxt 4](https://nuxt.com) (SSR, estrutura `app/`)
- [Nuxt UI 4](https://ui.nuxt.com) Dashboard + Tailwind CSS
- [Better Auth](https://www.better-auth.com) (e-mail/senha; Google OAuth na fase final)
- [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL
- **pnpm**

## Arquitetura

| Ambiente | Hospedagem | Banco | Deploy |
|----------|-----------|-------|--------|
| **Desenvolvimento** | Local | PostgreSQL via Docker Compose | `pnpm dev` |
| **Produção** | [Vercel](https://vercel.com) | [Neon](https://neon.tech) (PostgreSQL serverless) | Git push → Vercel |

O Docker é mantido **apenas para desenvolvimento local** (subir o PostgreSQL de testes). Em produção, a aplicação roda na Vercel e o banco no Neon.

## Pré-requisitos

- Node.js 24+
- pnpm 12+
- Docker + Docker Compose (apenas para desenvolvimento local)

## Setup — Desenvolvimento Local

```bash
# 1. Dependências
pnpm install

# 2. Variáveis de ambiente
cp .env.example .env
# edite BETTER_AUTH_SECRET com uma string aleatória (ex.: openssl rand -hex 32)

# 3. Banco local (PostgreSQL via Docker Compose)
pnpm db:up

# 4. Migrations
pnpm db:migrate

# 5. Servidor de desenvolvimento
pnpm dev
```

Aplicação em `http://localhost:3000`.

O Adminer está disponível em `http://localhost:8080` para gerenciamento visual do banco.

## Produção — Vercel + Neon

### 1. Criar o banco no Neon

Acesse [Neon Console](https://console.neon.tech), crie um projeto e obtenha a **connection string** (exemplo):

```
postgres://studio:senha@ep-xxx.us-east-1.aws.neon.tech/studio_blessed?sslmode=require
```

### 2. Conectar no Vercel

1. Conecte este repositório ao [Vercel](https://vercel.com)
2. Em **Settings → Environment Variables**, adicione:
   - `DATABASE_URL` = connection string do Neon
   - `BETTER_AUTH_SECRET` = `openssl rand -hex 32`
   - `BETTER_AUTH_URL` = `https://seu-dominio.vercel.app`
   - `NODE_ENV` = `production`

3. A cada push na branch `main`, a Vercel faz o build e deploy automaticamente.

### 3. Rodar migrations na produção

No Vercel, as migrations do Drizzle podem ser executadas via:

```bash
# Localmente, apontando para o Neon:
DATABASE_URL=<connection-string-neon> pnpm db:migrate

# Ou via Vercel CLI:
vercel env pull
pnpm db:migrate
```

## Scripts

| Script | Descrição |
|--------|-----------|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Build de produção |
| `pnpm preview` | Preview do build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Checagem de tipos |
| `pnpm test` | Testes unitários + integração |
| `pnpm test:e2e` | Testes E2E com Playwright |
| `pnpm test:coverage` | Cobertura completa (unit + integração + E2E) |
| `pnpm test:db:setup` | Recria o banco de teste e o seed |
| `pnpm db:up` | Sobe o PostgreSQL local (Docker Compose) |
| `pnpm db:down` | Derruba o PostgreSQL local |
| `pnpm db:generate` | Geração de migration a partir do schema Drizzle |
| `pnpm db:migrate` | Aplica migrations |
| `pnpm db:studio` | Abre o Drizzle Studio |

## Driver do Drizzle ORM (híbrido)

O projeto usa um driver híbrido em `server/utils/db.ts`. A escolha é feita pelo
**esquema da URL**, nunca por `NODE_ENV`:

- **`postgres://` / `postgresql://`** → `drizzle-orm/node-postgres` com o driver
  tradicional `pg` (Pool). Usado em desenvolvimento, self-hosting e testes.
- **`https://`** → `drizzle-orm/neon-http` com o driver HTTP/serverless
  `@neondatabase/serverless`. Usado em produção na Vercel/Neon.

Assim, um build de produção apontado para um PostgreSQL local continua
funcionando. `DB_DRIVER=neon|pg` força o driver explicitamente.

A variável `DATABASE_URL` é a referência única para ambos os ambientes.

## Testes

O projeto usa Vitest 5 (unitário e integração) e Playwright + Chromium (E2E) em
um banco PostgreSQL dedicado, `studio_blessed_test`.

```bash
pnpm db:up
pnpm test              # unitários + integração
pnpm test:e2e          # build de produção + fluxos críticos no browser
pnpm test:coverage     # cobertura completa com os thresholds do MVP
```

O E2E roda contra o **build de produção** (`.output/server`), não contra
`nuxt dev`: o otimizador de dependências do Vite dispara *full reloads* no meio
do teste e deixa a suíte instável.

Metas: **75%** para unitário e integração, **50%** para os fluxos E2E. Veja
[`docs/testing.md`](docs/testing.md) para escopos, comandos e solução de
problemas.

## Estrutura

```
app/                  # Frontend Nuxt 4
├── components/       # Componentes (dashboard, landing/, public/, inbox…)
├── composables/
├── layouts/
├── lib/auth-client.ts
└── pages/            # Landing + área da dona (/painel, /jornada, /servicos…)

server/               # Backend (Nitro)
├── api/auth/[...all].ts   # Handler do Better Auth
├── database/
│   ├── index.ts           # Re-exporta db híbrido
│   ├── schema.ts          # Schema do banco
│   └── migrations/        # Migrations geradas
├── utils/db.ts            # Driver híbrido Drizzle (node-postgres / neon-http)
└── lib/auth.ts            # Configuração do Better Auth

tests/                # Integração e E2E
scripts/              # Seed do banco de teste e runner de cobertura
docs/                 # Discovery, spec, arquitetura, backlog e testes
```

## Faseamento

- **Fase 1 (atual):** agenda **local** (PostgreSQL). Sem Google Calendar.
- **Fase final do MVP:** integração com **Google Calendar** (provider `google`),
  via OAuth individual da dona do salão.

## Documentação

- [`docs/discovery.md`](docs/discovery.md) — decisões de produto
- [`docs/spec.md`](docs/spec.md) — especificação do MVP
- [`docs/architecture.md`](docs/architecture.md) — arquitetura técnica
- [`docs/backlog.md`](docs/backlog.md) — épicos e user stories
- [`docs/testing.md`](docs/testing.md) — estratégia de testes e cobertura
- [`docs/tasks.md`](docs/tasks.md) — checklist vivo do MVP

## Criar a dona do salão

O modelo é **single-owner**: qualquer usuário autenticado é a dona do salão e
gerencia agenda, serviços e jornada. Não existem papéis ou hierarquia de acesso.

Com o banco no ar e o app rodando:

```bash
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H 'Content-Type: application/json' \
  -d '{"name":"Dona","email":"dona@studioblessed.local","password":"senha123456"}'
```

Depois é só entrar em `http://localhost:3000/login` com essas credenciais.
