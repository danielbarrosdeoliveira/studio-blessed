import { defineEventHandler, getMethod, getRequestURL, getHeader } from 'h3'
import { auth } from '../lib/auth'

const isProd = process.env.NODE_ENV === 'production'

function log(level: string, fields: Record<string, unknown>) {
  const entry = {
    ...(isProd ? {} : { timestamp: new Date().toISOString() }),
    level,
    ...fields
  }
  // Log estruturado em JSON: funciona com Docker logs, CloudWatch, Datadog, etc.
  console.log(JSON.stringify(entry))
}

function reqId() {
  return crypto.randomUUID().slice(0, 8)
}

/**
 * Middleware de logging estruturado para a API.
 *
 * Emite um objeto JSON por requisição com: nível, requestId, método, caminho,
 * statusCode, duração, userAgent, ip e (quando disponível) userId.
 * Erros não tratados são capturados e emitidos com nível `error` + stack.
 */
export default defineEventHandler(async (event) => {
  const start = Date.now()
  const id = reqId()
  const path = getRequestURL(event).pathname
  const method = getMethod(event) ?? 'UNKNOWN'
  const userAgent = getHeader(event, 'user-agent') ?? '-'
  const ip = event.node.req.socket?.remoteAddress ?? '-'

  // Contexto compartilhado com o handler (preenchido pelo auth se disponível)
  event.context.logId = id
  event.context.userId = undefined

  // Tenta extrair o user da sessão do Better Auth sem bloquear a requisição
  try {
    const session = await auth.api.getSession({ headers: event.headers })
    if (session?.user) {
      event.context.userId = session.user.id
    }
  } catch {
    // Sessão inválida/ausente — segue sem userId
  }

  const res = event.node.res

  // Captura o status code quando o Nitro escrever a resposta
  let statusCode = 200
  const originalWriteHead = res.writeHead.bind(res)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(res as any).writeHead = ((code: number, ...args: any[]) => {
    statusCode = code
    return originalWriteHead(code, ...args)
  }) as typeof res.writeHead

  // Log de conclusão quando a resposta é finalizada
  res.on('finish', () => {
    const durationMs = Date.now() - start
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'

    log(level, {
      reqId: id,
      method,
      path,
      statusCode,
      durationMs,
      userAgent,
      ip,
      userId: event.context.userId
    })
  })

  // Log de erro não tratado (quando o handler lança e o Nitro fecha com 5xx)
  res.on('error', (err: Error) => {
    const durationMs = Date.now() - start

    log('error', {
      reqId: id,
      method,
      path,
      statusCode: 500,
      durationMs,
      userAgent,
      ip,
      userId: event.context.userId,
      error: err.message,
      stack: err.stack
    })
  })
})
