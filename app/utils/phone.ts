/** Normaliza o WhatsApp para apenas dígitos, sem o DDI brasileiro. */
export function normalizePhoneDigits(value: string): string | null {
  let digits = value.replace(/\D/g, '')

  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    digits = digits.slice(2)
  }

  return digits.length === 10 || digits.length === 11 ? digits : null
}

/** Ex.: `(11) 99999-9999`. */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '')

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return value
}
