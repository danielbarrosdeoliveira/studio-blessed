import { describe, expect, it } from 'vitest'
import { appointmentStatusMeta } from './appointment'

describe('appointmentStatusMeta', () => {
  it('mapeia todos os status para rótulo e cor', () => {
    expect(appointmentStatusMeta.scheduled).toEqual({ label: 'Agendado', color: 'primary' })
    expect(appointmentStatusMeta.completed).toEqual({ label: 'Concluído', color: 'success' })
    expect(appointmentStatusMeta.cancelled).toEqual({ label: 'Cancelado', color: 'neutral' })
    expect(appointmentStatusMeta.no_show).toEqual({ label: 'Não compareceu', color: 'warning' })
  })
})
