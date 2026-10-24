import { describe, expect, it } from 'vitest'
import { normalizePhone } from './phone'

describe('normalizePhone', () => {
  it('mantém celular e fixo com DDD', () => {
    expect(normalizePhone('11988887777')).toBe('11988887777')
    expect(normalizePhone('1133334444')).toBe('1133334444')
  })

  it('remove máscara', () => {
    expect(normalizePhone('(11) 98888-7777')).toBe('11988887777')
  })

  it('remove o DDI brasileiro', () => {
    expect(normalizePhone('+55 (11) 98888-7777')).toBe('11988887777')
    expect(normalizePhone('5511988887777')).toBe('11988887777')
  })

  it('rejeita números fora do padrão', () => {
    expect(normalizePhone('123')).toBeNull()
    expect(normalizePhone('119888877771234')).toBeNull()
    expect(normalizePhone('')).toBeNull()
  })
})
