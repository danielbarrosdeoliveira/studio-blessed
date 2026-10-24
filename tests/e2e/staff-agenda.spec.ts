import { expect, test } from '@playwright/test'
import { addDays, ADMIN_EMAIL, login, MARIA_EMAIL, todayIso, waitForHydration } from './helpers'

const clientName = 'Cliente Staff E2E'

test('staff cria, conclui e corrige um agendamento', async ({ page }) => {
  const tomorrow = addDays(todayIso(), 1)

  await login(page, ADMIN_EMAIL)
  await page.goto('/agenda')
  await waitForHydration(page)
  await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible()

  await page.getByRole('button', { name: 'Novo agendamento' }).first().click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  await dialog.getByLabel('Profissional').click()
  await page.getByRole('option', { name: 'Maria', exact: true }).click()

  await expect(dialog.getByLabel('Serviço')).toBeEnabled()
  await dialog.getByLabel('Serviço').click()
  await page.getByRole('option', { name: /Corte feminino/ }).click()

  await dialog.getByLabel('Escolha a data').fill(tomorrow)

  const slot = dialog.getByRole('button', { name: '09:00', exact: true })
  await expect(slot).toBeVisible()
  await slot.click()

  await dialog.getByLabel('Nome da cliente').fill(clientName)
  await dialog.getByLabel('WhatsApp').fill('(11) 99999-0002')
  await dialog.getByRole('button', { name: 'Confirmar agendamento' }).click()

  const card = page.getByTestId('staff-appointment').filter({ hasText: clientName })
  await expect(card).toBeVisible()
  await expect(card.getByText('Agendado')).toBeVisible()

  await card.getByRole('button', { name: 'Concluir' }).click()
  await expect(card.getByText('Concluído')).toBeVisible()

  await card.getByRole('button', { name: 'Corrigir para no-show' }).click()
  await expect(card.getByText('Não compareceu')).toBeVisible()

  await card.getByRole('button', { name: 'Corrigir para concluído' }).click()
  await expect(card.getByText('Concluído')).toBeVisible()
})

test('partner vê a própria agenda sem o filtro de admin', async ({ page }) => {
  const tomorrow = addDays(todayIso(), 1)

  await login(page, MARIA_EMAIL)
  await page.goto('/agenda')
  await waitForHydration(page)
  await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible()

  await expect(page.getByText('Todas as profissionais')).toHaveCount(0)

  await page.getByLabel('Dia da agenda').fill(tomorrow)

  const card = page.getByTestId('staff-appointment').filter({ hasText: clientName })
  await expect(card).toBeVisible()
  await expect(card.getByText('Concluído')).toBeVisible()
})
