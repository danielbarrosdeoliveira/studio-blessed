import { expect, test } from '@playwright/test'
import { addDays, todayIso, waitForHydration } from './helpers'

test('cliente agenda pelo stepper e cancela em Meus agendamentos', async ({ page }) => {
  const clientName = 'Cliente Público E2E'

  await page.goto('/agendamento')
  await waitForHydration(page)
  await expect(page.getByRole('heading', { name: 'Agendamento', exact: true })).toBeVisible()

  const corte = page.getByTestId('service-option').filter({ hasText: 'Corte feminino' }).first()

  await expect(corte).toBeVisible()
  await corte.getByRole('button', { name: 'Selecionar' }).click()
  await expect(page.getByRole('heading', { name: 'Escolha a data e o horário' })).toBeVisible()

  const slot = page.getByRole('button', { name: '09:00', exact: true })
  await expect(slot).toBeVisible()
  await slot.click()
  await page.getByRole('button', { name: 'Continuar' }).first().click()

  await expect(page.getByRole('heading', { name: 'Seus dados' })).toBeVisible()
  await page.getByLabel('Nome', { exact: true }).fill(clientName)
  await page.getByLabel('WhatsApp').fill('(11) 99999-0001')
  await page.getByRole('button', { name: 'Confirmar agendamento' }).click()

  await expect(page.getByRole('heading', { name: 'Agendamento confirmado' })).toBeVisible()
  await page.getByRole('link', { name: 'Ver meus agendamentos' }).click()
  await expect(page).toHaveURL(/\/meus-agendamentos/)

  const card = page
    .getByTestId('public-appointment')
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

test('link com serviceId abre o stepper no horário', async ({ page }) => {
  const response = await page.request.get('/api/public/services')
  const services = (await response.json()) as Array<{ id: string; name: string }>
  const corte = services.find((item) => item.name === 'Corte feminino')

  if (!corte) {
    throw new Error('Serviço Corte feminino não encontrado no seed')
  }

  await page.goto(`/agendamento?serviceId=${corte.id}`)

  await expect(page.getByRole('heading', { name: 'Escolha a data e o horário' })).toBeVisible()
})

test('o catálogo público não exibe profissionais', async ({ page }) => {
  await page.goto('/agendamento')
  await waitForHydration(page)

  await expect(page.getByText('Profissional responsável')).toHaveCount(0)
  await expect(page.getByTestId('service-option').first()).toBeVisible()
  expect(addDays(todayIso(), 3)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
})
