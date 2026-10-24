import { sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex
} from 'drizzle-orm/pg-core'

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID())

const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).notNull().defaultNow()

const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()

/* -------------------------------------------------------------------------- */
/*  Better Auth — tabelas core                                                */
/* -------------------------------------------------------------------------- */

export const user = pgTable('user', {
  id: id(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  /**
   * `admin` | `partner`
   * Não é aceito como input no cadastro (ver `server/lib/auth.ts`).
   */
  role: text('role').notNull().default('partner'),
  /** `internal` | `google` — na Fase 1 sempre `internal`. */
  agendaProvider: text('agenda_provider').notNull().default('internal'),
  createdAt: createdAt(),
  updatedAt: updatedAt()
})

export const session = pgTable('session', {
  id: id(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' })
}, t => [index('session_user_idx').on(t.userId)])

export const account = pgTable('account', {
  id: id(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: createdAt(),
  updatedAt: updatedAt()
}, t => [index('account_user_idx').on(t.userId)])

export const verification = pgTable('verification', {
  id: id(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt()
}, t => [index('verification_identifier_idx').on(t.identifier)])

/* -------------------------------------------------------------------------- */
/*  Domínio                                                                    */
/* -------------------------------------------------------------------------- */

export const appointmentStatus = pgEnum('appointment_status', [
  'scheduled',
  'completed',
  'cancelled',
  'no_show'
])

export const appointmentOrigin = pgEnum('appointment_origin', [
  'client',
  'staff'
])

/** Cliente do salão — única por telefone. */
export const client = pgTable('client', {
  id: id(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt()
}, t => [uniqueIndex('client_phone_unique').on(t.phone)])

/** Serviço pertence a uma profissional (`user.id`). */
export const service = pgTable('service', {
  id: id(),
  professionalId: text('professional_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  durationMin: integer('duration_min').notNull(),
  bufferMin: integer('buffer_min').notNull().default(0),
  priceCents: integer('price_cents').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt()
}, t => [
  index('service_professional_idx').on(t.professionalId),
  index('service_name_idx').on(t.name),
  uniqueIndex('service_active_name_unique')
    .on(sql`lower(btrim(${t.name}))`)
    .where(sql`${t.active}`)
])

/** Jornada: `weekday` 0 = domingo … 6 = sábado. Minutos desde 00:00. */
export const workingHours = pgTable('working_hours', {
  id: id(),
  professionalId: text('professional_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  weekday: integer('weekday').notNull(),
  startMinute: integer('start_minute').notNull(),
  endMinute: integer('end_minute').notNull(),
  createdAt: createdAt()
}, t => [index('working_hours_professional_idx').on(t.professionalId, t.weekday)])

/** Bloqueio pontual ou recorrente (ex.: `weekly`). */
export const timeBlock = pgTable('time_block', {
  id: id(),
  professionalId: text('professional_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  reason: text('reason'),
  recurrence: text('recurrence'),
  createdAt: createdAt()
}, t => [index('time_block_professional_idx').on(t.professionalId, t.startsAt)])

export const appointment = pgTable('appointment', {
  id: id(),
  clientId: text('client_id')
    .notNull()
    .references(() => client.id, { onDelete: 'restrict' }),
  professionalId: text('professional_id')
    .notNull()
    .references(() => user.id, { onDelete: 'restrict' }),
  serviceId: text('service_id')
    .notNull()
    .references(() => service.id, { onDelete: 'restrict' }),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  status: appointmentStatus('status').notNull().default('scheduled'),
  origin: appointmentOrigin('origin').notNull().default('client'),
  notes: text('notes'),
  createdAt: createdAt(),
  updatedAt: updatedAt()
}, t => [
  index('appointment_professional_starts_idx').on(t.professionalId, t.startsAt),
  index('appointment_client_idx').on(t.clientId)
])

/* -------------------------------------------------------------------------- */
/*  Tipos                                                                      */
/* -------------------------------------------------------------------------- */

export type User = typeof user.$inferSelect
export type Client = typeof client.$inferSelect
export type Service = typeof service.$inferSelect
export type WorkingHours = typeof workingHours.$inferSelect
export type TimeBlock = typeof timeBlock.$inferSelect
export type Appointment = typeof appointment.$inferSelect
