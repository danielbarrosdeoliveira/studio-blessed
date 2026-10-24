import { expect, test } from '@playwright/test'
import { addDays, ADMIN_EMAIL, login, todayIso, waitForHydration } from './helpers'

test('admin cria, lista e remove um bloqueio semanal', async ({ page }) => {
  const date = addDays(todayIso(), 20)

  await login(page, ADMIN_EMAIL)
  await page.goto('/profissionais')
  await waitForHydration(page)

  const row = page.getByRole('row').filter({ hasText: 'Maria' }).first()
  await expect(row).toBeVisible()
  await row.getByRole('link', { name: 'Jornada' }).click()

  await expect(page.getByRole('heading', { name: 'Maria', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Novo bloqueio' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  await dialog.getByLabel('Data do bloqueio').fill(date)
  await dialog.getByLabel('Início').fill('12:00')
  await dialog.getByLabel('Fim').fill('13:00')
  await dialog.getByLabel('Motivo').fill('Almoço E2E')
  await dialog.getByRole('switch', { name: 'Repetir toda semana' }).click()
  await dialog.getByRole('button', { name: 'Salvar bloqueio' }).click()

  const block = page.getByTestId('time-block').filter({ hasText: 'Almoço E2E' })
  await expect(block).toBeVisible()
  await expect(block.getByText('Semanal', { exact: true })).toBeVisible()

  await block.getByRole('button', { name: 'Remover bloqueio' }).click()
  await expect(block).toHaveCount(0)
})
