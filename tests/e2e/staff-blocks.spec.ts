import { expect, test } from '@playwright/test'
import { addDays, login, OWNER_EMAIL, todayIso, waitForHydration } from './helpers'

test('dona cria, lista e remove um bloqueio semanal', async ({ page }) => {
  const date = addDays(todayIso(), 20)

  await login(page, OWNER_EMAIL)

  const startsAt = new Date(`${date}T12:00:00-03:00`).toISOString()
  const endsAt = new Date(`${date}T13:00:00-03:00`).toISOString()

  const created = await page.request.post('/api/time-blocks', {
    data: {
      startsAt,
      endsAt,
      reason: 'Almoço E2E',
      recurrence: 'weekly'
    }
  })

  expect(created.ok()).toBe(true)

  await page.goto('/jornada')
  await waitForHydration(page)

  await expect(page.getByRole('heading', { name: 'Jornada' })).toBeVisible()

  const block = page.getByTestId('time-block').filter({ hasText: 'Almoço E2E' })
  await expect(block).toBeVisible()
  await expect(block.getByText('Semanal', { exact: true })).toBeVisible()

  await block.getByRole('button', { name: 'Remover bloqueio' }).click()
  await expect(block).toHaveCount(0)
})

test('a jornada exibe os dias de atendimento da dona', async ({ page }) => {
  await login(page, OWNER_EMAIL)
  await page.goto('/jornada')
  await waitForHydration(page)

  await expect(page.getByRole('heading', { name: 'Jornada' })).toBeVisible()
  await expect(page.getByText('Segunda-feira').first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Novo bloqueio' })).toBeVisible()
})
