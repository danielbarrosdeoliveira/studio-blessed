import { describe, expect, it } from 'vitest'
import { formatPhone, normalizePhoneDigits } from './phone'

describe('telefone do app', () => {
  it('normaliza WhatsApp com e sem DDI', () => {
    expect(normalizePhoneDigits('(11) 98888-7777')).toBe('11988887777')
    expect(normalizePhoneDigits('+55 (11) 98888-7777')).toBe('11988887777')
    expect(normalizePhoneDigits('11988887777')).toBe('11988887777')
  })

  it('rejeita números incompletos', () => {
    expect(normalizePhoneDigits('123')).toBeNull()
    expect(normalizePhoneDigits('119888877771234')).toBeNull()
  })

  it('formata celular e telefone fixo', () => {
    expect(formatPhone('11988887777')).toBe('(11) 98888-7777')
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444')
    expect(formatPhone('123')).toBe('123')
  })
})
