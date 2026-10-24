/**
 * Normaliza o WhatsApp para apenas dígitos, sem o DDI brasileiro.
 * Retorna `null` quando não parece um telefone válido (10 ou 11 dígitos).
 */
export function normalizePhone(value: string): string | null {
  let digits = value.replace(/\D/g, '')

  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    digits = digits.slice(2)
  }

  return digits.length === 10 || digits.length === 11 ? digits : null
}
