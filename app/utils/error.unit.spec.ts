import { describe, expect, it } from 'vitest'
import { getApiErrorMessage } from './error'

describe('getApiErrorMessage', () => {
  it('usa a mensagem devolvida pela API', () => {
    expect(getApiErrorMessage({ data: { message: 'Horário indisponível' } }, 'Falhou'))
      .toBe('Horário indisponível')
  })

  it('usa o fallback quando o erro não tem mensagem', () => {
    expect(getApiErrorMessage(new Error('boom'), 'Falhou')).toBe('Falhou')
    expect(getApiErrorMessage(null, 'Falhou')).toBe('Falhou')
  })
})
