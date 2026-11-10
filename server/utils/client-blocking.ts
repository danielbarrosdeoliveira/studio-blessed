import { eq } from 'drizzle-orm'
import { db } from '../database'
import { client } from '../database/schema'

/**
 * Mensagem neutra exibida à cliente bloqueada no fluxo público.
 * Não revela o bloqueio nem o motivo, para não constranger a cliente:
 * a dona decidiu não atender mais, e o motivo é dela.
 */
export const BLOCKED_CLIENT_PUBLIC_MESSAGE =
  'Não foi possível concluir este agendamento. Fale com o salão pelo WhatsApp para mais informações.'

/** Mensagem para a dona quando tenta agendar para uma cliente bloqueada. */
export const BLOCKED_CLIENT_STAFF_MESSAGE =
  'Esta cliente está bloqueada. Desbloqueie-a na página de Clientes para agendar.'

/** Uma cliente bloqueada por telefone não cria novos agendamentos. */
export async function isClientBlockedByPhone(phone: string): Promise<boolean> {
  const [row] = await db
    .select({ blocked: client.blocked })
    .from(client)
    .where(eq(client.phone, phone))
    .limit(1)

  return row?.blocked ?? false
}
