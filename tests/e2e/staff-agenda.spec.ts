import { expect, test } from '@playwright/test'
import { addDays, login, OWNER_EMAIL, todayIso, waitForHydration } from './helpers'

const clientName = 'Cliente Staff E2E'

test('dona cria, conclui e corrige um agendamento', async ({ page }) => {
  const tomorrow = addDays(todayIso(), 1)

  await login(page)
  await page.goto(`/painel?date=${tomorrow}`)
  await waitForHydration(page)
  await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible()

  await page.getByRole('button', { name: 'Novo agendamento' }).first().click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  await dialog.getByLabel('Serviço').click()
  await page.getByRole('option', { name: /Corte feminino/ }).click()

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

test('a agenda não tem filtro de profissional', async ({ page }) => {
  await login(page)
  await page.goto('/painel')
  await waitForHydration(page)

  await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible()
  await expect(page.getByText('Todas as profissionais')).toHaveCount(0)
  await expect(page.getByText('Profissionais', { exact: true })).toHaveCount(0)
})

test('a navegação lateral leva às páginas da dona', async ({ page }) => {
  await login(page)
  await page.goto('/painel')
  await waitForHydration(page)

  await page.getByRole('link', { name: 'Jornada' }).first().click()
  await expect(page).toHaveURL(/\/painel\/jornada/)
  await expect(page.getByRole('heading', { name: 'Jornada' })).toBeVisible()

  await page.getByRole('link', { name: 'Serviços' }).first().click()
  await expect(page).toHaveURL(/\/painel\/servicos/)
  await expect(page.getByRole('heading', { name: 'Serviços' })).toBeVisible()
})