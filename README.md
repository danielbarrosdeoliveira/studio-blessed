# Studio Blessed

Plataforma web responsiva (single-tenant) para gestão de agendamentos do salão
**Studio Blessed**.

## Stack

- [Nuxt 4](https://nuxt.com) (SSR, estrutura `app/`)
- [Nuxt UI](https://ui.nuxt.com) Dashboard + Tailwind CSS
- [Better Auth](https://www.better-auth.com) (e-mail/senha; Google OAuth na fase final)
- [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL
- **pnpm**

## Pré-requisitos

- Node.js 24+
- pnpm 12+
- Docker + Docker Compose

## Setup

```bash
# 1. Dependências
pnpm install

# 2. Variáveis de ambiente
cp .env.example .env
# edite BETTER_AUTH_SECRET com uma string aleatória (ex.: openssl rand -hex 32)

# 3. Banco local
pnpm db:up

# 4. Migrations
pnpm db:migrate

# 5. Dev server
pnpm dev
```

Aplicação em `http://localhost:3000`.

## Scripts

| Script | Descrição |
| --- | --- |
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Build de produção |
| `pnpm preview` | Preview do build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Checagem de tipos |
| `pnpm db:up` | Sobe o PostgreSQL local (Docker) |
| `pnpm db:down` | Derruba o PostgreSQL local |
| `pnpm db:generate` | Gera migration a partir do schema Drizzle |
| `pnpm db:migrate` | Aplica migrations |
| `pnpm db:studio` | Abre o Drizzle Studio |

## Estrutura

```
app/                  # Frontend Nuxt 4
├── components/       # Componentes (dashboard, customers, inbox, settings…)
├── composables/
├── layouts/
├── lib/auth-client.ts
└── pages/

server/               # Backend (Nitro)
├── api/auth/[...all].ts   # Handler do Better Auth
├── database/
│   ├── index.ts           # Conexão Drizzle + postgres.js
│   ├── schema.ts          # Schema do banco
│   └── migrations/        # Migrations geradas
└── lib/auth.ts            # Configuração do Better Auth

docs/                 # Discovery, spec, arquitetura e backlog
```

## Faseamento

- **Fase 1 (atual):** agenda **local** (PostgreSQL). Sem Google Calendar.
- **Fase final do MVP:** integração com **Google Calendar** (provider `google`),
  via OAuth individual por profissional.

## Documentação

- [`docs/discovery.md`](docs/discovery.md) — decisões de produto
- [`docs/spec.md`](docs/spec.md) — especificação do MVP
- [`docs/architecture.md`](docs/architecture.md) — arquitetura técnica
- [`docs/backlog.md`](docs/backlog.md) — épicos e user stories

## Criar o primeiro admin

Com o banco no ar e o app rodando:

```bash
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H 'Content-Type: application/json' \
  -d '{"name":"Admin","email":"admin@studioblessed.local","password":"senha123456"}'
```

Depois promova o usuário:

```bash
docker exec studio-blessed-db psql -U studio -d studio_blessed \
  -c "update \"user\" set role='admin' where email='admin@studioblessed.local';"
```
