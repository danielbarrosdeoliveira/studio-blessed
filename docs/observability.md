# Observabilidade — Studio Blessed

Plano de logging, métricas e monitoramento para o MVP em produção (PRD).

## Objetivo

Ter visibilidade suficiente para:

- Detectar erros em produção antes que o cliente relate
- Rastrear uma requisição end-to-end (requestId correlacionado)
- Saber quantos agendamentos estão sendo criados/cancelados por período
- Saber se o banco de dados está respondendo (health check)
- Auditar ações críticas (quem criou/modificou/cancelou um agendamento)

---

## 1. Logging estruturado (já implementado)

**Arquivo:** `server/middleware/logger.ts`

Toda requisição à API emite uma linha JSON no `stdout`:

```json
{
  "level": "info",
  "reqId": "a1b2c3d4",
  "method": "POST",
  "path": "/api/appointments",
  "statusCode": 201,
  "durationMs": 142,
  "userAgent": "Mozilla/5.0 ...",
  "ip": "10.0.0.5",
  "userId": "usr_abc123"
}
```

- **Produção:** sem campo `timestamp` (o coletor de logs já carimba). Útil para Docker/CloudWatch/Datadog.
- **Desenvolvimento:** inclui `timestamp` para facilitar leitura local.
- **Níveis:** `info` (2xx), `warn` (4xx), `error` (5xx e exceções).

### Como consumir

Se estiver rodando em Docker, os logs já saem no `docker compose logs -f app`. Em nuvem, configure o coletor para ler `stdout` e indexar como JSON.

Exemplo de filtro de erros:

```bash
docker compose logs -f app | grep '"level":"error"'
```

---

## 2. Health check

Endpoint: `GET /api/health`

Responde `200` quando a aplicação e o banco estão funcionando. Útil para load balancer e verificações de uptime.

---

## 3. Métricas de infraestrutura (OCI VM — Free Tier)

Para saber se o free tier do OCI será suficiente, monitore os recursos da instância em tempo real.

### OCI Monitoring (nativo, sem instalar agente)

O console OCI coleta automaticamente métricas da instância de compute:

- **CPU (vCPU/OCPU):** percentual de uso da vCPU alocada
- **Memória:** uso de RAM da instância
- **Rede:** bytes in/out da interface pública
- **Disco:** uso do volume de boot e block storage anexado

**Caminho no console:** Compute > Instâncias > [sua instância] > Métricas

### Script rápido na VM

Arquivo: `scripts/monitor.sh`

```bash
chmod +x scripts/monitor.sh
./scripts/monitor.sh
```

Ele exibe: load average, memória RAM, disco, status dos containers Docker, uso de CPU/memória por container, health check da aplicação (`/api/health`) e erros recentes nos logs.

### Limites do OCI Always Free (referência)

| Recurso | Limite Always Free | Recomendação para o MVP |
|---------|-------------------|-------------------------|
| Compute ARM | Até 4 instâncias, 24 GB RAM, 4 OCPUs no total | 1 VM `VM.Standard.A1.Flex` (1 OCPU, 6 GB RAM) cabe sobrando |
| Block Storage | Até 200 GB total | PostgreSQL + logs cabe facilmente |
| Egress de dados | Até 10 TB/mês | Suficiente para centenas/milhares de usuários |

### Quando avaliar upgrade ou otimização

| Métrica | Limiar de atenção | Ação |
|---------|------------------|------|
| CPU da VM | > 80% por mais de 5 min | Avaliar mais OCPUs ou otimizar queries |
| Memória da VM | > 80% por mais de 5 min | Avaliar mais RAM ou reduzir consumo do Node/Postgres |
| Disco | > 80% usado | Limpar logs antigos ou aumentar block storage |
| Erros 5xx da app | > 10 erros / 5 min | Investigar logs com `level=error` |

---

## 4. Métricas básicas da aplicação (contadores a partir dos logs)

A partir dos logs JSON, é possível derivar sem nenhuma biblioteca extra:

| Métrica | Como extrair |
|---------|--------------|
| Requisições por endpoint | `path` + `method` |
| Erros 5xx por endpoint | `level=error` + `path` |
| Tempo médio de resposta | `durationMs` por `path` |
| Agendamentos criados | `POST /api/appointments` com `statusCode=201` |
| Agendamentos cancelados | `PATCH /api/appointments/[id]` com `status= cancelled` |

Recomendação: configurar um alerta simples quando `level=error` exceder um limiar (ex.: > 10 erros/5 min).

---

## 5. Auditoria de ações críticas (próximo passo)

Para ações que alteram dados (agendamento, bloqueio, serviço, jornada), registrar no log da requisição o `userId` (já feito pelo middleware) e, opcionalmente, gravar em uma tabela `audit_log`:

| Coluna | Tipo |
|--------|------|
| id | uuid |
| userId | uuid (FK user) |
| action | text (ex.: `appointment.create`) |
| entity | text (ex.: `appointment`) |
| entityId | uuid |
| metadata | jsonb |
| createdAt | timestamptz |

Isso permite responder: "quem cancelou o agendamento X e quando?".

---

## 6. Checklist de implementação

- [x] Middleware de logging estruturado (`server/middleware/logger.ts`)
- [x] Health check endpoint (`GET /api/health`)
- [x] Métricas de infraestrutura (script `scripts/monitor.sh` + OCI Monitoring nativo)
- [ ] Tabela `audit_log` + gravação em ações críticas
- [ ] Alerta de erros 5xx (via coletor de logs da nuvem)
- [ ] Dashboard de métricas operacionais (E9 — Dashboard de Métricas)

---

## 7. Comandos úteis em produção

```bash
# Ver logs de erro da aplicação
docker compose -f docker-compose.prod.yml logs -f app | grep '"level":"error"'

# Ver requisições lentas (> 1s)
docker compose -f docker-compose.prod.yml logs app | grep '"durationMs"' | awk '{ if ($2 > 1000) print }'

# Health check
curl http://IP_PUBLICO:3000/api/health

# Monitor rápido de infra
./scripts/monitor.sh

# Ver métricas no OCI
# Console OCI > Compute > Instâncias > [sua instância] > Métricas
```

