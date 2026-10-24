import { expect, test } from '@playwright/test'
import { addDays, todayIso, waitForHydration } from './helpers'

test('cliente agenda pelo stepper e cancela em Meus agendamentos', async ({ page }) => {
  const clientName = 'Cliente Público E2E'
  const date = addDays(todayIso(), 4)

  await page.goto('/agendamento')
  await waitForHydration(page)
  await expect(page.getByRole('heading', { name: 'Agendamento', exact: true })).toBeVisible()

  const mariaCorte = page.getByTestId('service-option')
    .filter({ hasText: 'Corte feminino' })
    .filter({ hasText: 'Maria' })
    .first()

  await expect(mariaCorte).toBeVisible()
  await mariaCorte.getByRole('button', { name: 'Selecionar' }).click()
  await expect(page.getByRole('heading', { name: 'Escolha a data e o horário' })).toBeVisible()

  await page.getByLabel('Escolha a data').fill(date)

  const slot = page.getByRole('button', { name: '09:00', exact: true })
  await expect(slot).toBeVisible()
  await slot.click()
  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(page.getByRole('heading', { name: 'Seus dados' })).toBeVisible()
  await page.getByLabel('Nome', { exact: true }).fill(clientName)
  await page.getByLabel('WhatsApp').fill('(11) 99999-0001')
  await page.getByRole('button', { name: 'Confirmar agendamento' }).click()

  await expect(page.getByRole('heading', { name: 'Agendamento confirmado' })).toBeVisible()
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

test('link antigo /agendar abre o stepper no horário', async ({ page }) => {
  const response = await page.request.get('/api/public/services')
  const groups = await response.json() as Array<{
    name: string
    professionals: Array<{ id: string, serviceId: string }>
  }>
  const group = groups.find(item => item.name === 'Corte feminino')
  const professional = group?.professionals[0]

  if (!professional) {
    throw new Error('Serviço Corte feminino não encontrado no seed')
  }

  await page.goto(`/agendar?serviceId=${professional.serviceId}&professionalId=${professional.id}`)

  await expect(page).toHaveURL(/\/agendamento\?/)
  await expect(page.getByRole('heading', { name: 'Escolha a data e o horário' })).toBeVisible()
})
