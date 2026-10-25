# syntax=docker/dockerfile:1
FROM node:24-alpine AS builder

WORKDIR /app

# Dependências
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# Código fonte
COPY . .

# Build de produção (gera .output/)
ENV NODE_ENV=production
RUN pnpm build

# Runtime
FROM node:24-alpine AS runner

WORKDIR /app

RUN corepack enable

# Apenas o necessário para rodar o output do Nitro
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
