import { expect, test } from '@playwright/test'
import { addDays, todayIso, waitForHydration } from './helpers'

test('cliente agenda pelo catálogo e cancela em Meus agendamentos', async ({ page }) => {
  const clientName = 'Cliente Público E2E'
  const date = addDays(todayIso(), 4)

  await page.goto('/catalogo')
  await waitForHydration(page)
  await expect(page.getByRole('heading', { name: 'Catálogo' })).toBeVisible()

  const mariaCorte = page.locator('li')
    .filter({ hasText: 'Maria' })
    .filter({ hasText: '40 min' })
    .first()

  await mariaCorte.getByRole('link', { name: 'Agendar' }).click()
  await expect(page.getByRole('heading', { name: 'Agendar Corte feminino' })).toBeVisible()

  await page.getByLabel('Escolha a data').fill(date)

  const slot = page.getByRole('button', { name: '09:00', exact: true })
  await expect(slot).toBeVisible()
  await slot.click()

  await page.getByLabel('Nome', { exact: true }).fill(clientName)
  await page.getByLabel('WhatsApp').fill('(11) 99999-0001')
  await page.getByRole('button', { name: 'Confirmar agendamento' }).click()

  await expect(page.getByText('Agendamento confirmado')).toBeVisible()
  await page.getByRole('link', { name: 'Ver meus agendamentos' }).click()
  await expect(page).toHaveURL(/\/meus-agendamentos/)

  const card = page.getByTestId('public-appointment')
    .filter({ hasText: 'Corte feminino' })
    .filter({ hasText: '09:00' })
    .first()
  await expect(card).toBeVisible()
  await expect(card.getByText('Agendado')).toBeVisible()

  await card.getByRole('button', { name: 'Cancelar' }).click()
  await page.getByRole('button', { name: 'Confirmar cancelamento' }).click()

  await expect(card.getByText('Cancelado')).toBeVisible()
  await expect(page.getByText('Histórico')).toBeVisible()
})
