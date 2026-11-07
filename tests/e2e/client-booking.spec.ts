import { expect, test } from '@playwright/test'
import { addDays, todayIso, waitForHydration } from './helpers'

test.describe('Fluxo Público de Agendamento (Client Booking)', () => {
  const clientName = 'Cliente E2E Teste'
  const clientPhone = '(11) 99999-8888'

  test.beforeEach(async ({ page }) => {
    await page.goto('/agendamento')
    await waitForHydration(page)
    await expect(page.getByRole('heading', { name: 'Agendamento', exact: true })).toBeVisible()
  })

  test('cliente completa agendamento: serviço → horário → dados → sucesso', async ({ page }) => {
    // Passo 1: Selecionar serviço
    const serviceCard = page.getByTestId('service-option').filter({ hasText: 'Corte feminino' }).first()
    await expect(serviceCard).toBeVisible()
    await serviceCard.getByRole('button', { name: 'Selecionar' }).click()

    // Passo 2: Escolher horário
    await expect(page.getByRole('heading', { name: 'Escolha a data e o horário' })).toBeVisible()
    const tomorrow = addDays(todayIso(), 3) // Antecedência mínima de 3 dias
    const slot = page.getByRole('button', { name: '09:00', exact: true })
    await expect(slot).toBeVisible()
    await slot.click()
    await page.getByRole('button', { name: 'Continuar' }).first().click()

    // Passo 3: Preencher dados
    await expect(page.getByRole('heading', { name: 'Seus dados' })).toBeVisible()
    await page.getByLabel('Nome', { exact: true }).fill(clientName)
    await page.getByLabel('WhatsApp').fill(clientPhone)
    await page.getByRole('button', { name: 'Confirmar agendamento' }).click()

    // Passo 4: Verificar tela de sucesso
    await expect(page.getByRole('heading', { name: 'Agendamento confirmado' })).toBeVisible()
    await expect(page.getByText(clientName)).toBeVisible()
    await expect(page.getByText('Corte feminino')).toBeVisible()

    // Verificar instruções de cancelamento
    await expect(page.getByText(/Cancelamento até \d+h antes/)).toBeVisible()

    // Verificar botões de ação
    await expect(page.getByRole('link', { name: 'Ver meus agendamentos' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Agendar outro horário' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Escolher outro serviço' })).toBeVisible()
  })

  test('cliente vê erro ao tentar agendar horário já ocupado', async ({ page }) => {
    // Primeiro agendamento
    const serviceCard = page.getByTestId('service-option').filter({ hasText: 'Corte feminino' }).first()
    await serviceCard.getByRole('button', { name: 'Selecionar' }).click()

    const slot = page.getByRole('button', { name: '09:00', exact: true })
    await slot.click()
    await page.getByRole('button', { name: 'Continuar' }).first().click()

    await page.getByLabel('Nome', { exact: true }).fill('Cliente Ocupado')
    await page.getByLabel('WhatsApp').fill('(11) 99999-7777')
    await page.getByRole('button', { name: 'Confirmar agendamento' }).click()
    await expect(page.getByRole('heading', { name: 'Agendamento confirmado' })).toBeVisible()

    // Segundo agendamento - mesmo horário
    await page.getByRole('button', { name: 'Escolher outro serviço' }).click()
    await waitForHydration(page)

    const serviceCard2 = page.getByTestId('service-option').filter({ hasText: 'Corte feminino' }).first()
    await serviceCard2.getByRole('button', { name: 'Selecionar' }).click()

    // O horário 09:00 deve estar indisponível ou não clicável
    const occupiedSlot = page.getByRole('button', { name: '09:00', exact: true })
    await expect(occupiedSlot).toHaveAttribute('aria-disabled', 'true')
  })

  test('validação de campos obrigatórios', async ({ page }) => {
    const serviceCard = page.getByTestId('service-option').filter({ hasText: 'Corte feminino' }).first()
    await serviceCard.getByRole('button', { name: 'Selecionar' }).click()

    const slot = page.getByRole('button', { name: '09:00', exact: true })
    await slot.click()
    await page.getByRole('button', { name: 'Continuar' }).first().click()

    // Tentar submeter sem preencher
    await page.getByRole('button', { name: 'Confirmar agendamento' }).click()

    // Verificar mensagens de erro
    await expect(page.getByText(/Informe um WhatsApp válido com DDD/)).toBeVisible()
  })

  test('navegação entre steps funciona corretamente', async ({ page }) => {
    // Step 0: Serviço
    await expect(page.getByRole('heading', { name: 'Agendamento' })).toBeVisible()
    const serviceCard = page.getByTestId('service-option').filter({ hasText: 'Corte feminino' }).first()
    await serviceCard.getByRole('button', { name: 'Selecionar' }).click()

    // Step 1: Horário
    await expect(page.getByRole('heading', { name: 'Escolha a data e o horário' })).toBeVisible()
    const slot = page.getByRole('button', { name: '09:00', exact: true })
    await slot.click()

    // Voltar para step 0
    await page.getByRole('button', { name: 'Voltar' }).click()
    await expect(page.getByRole('heading', { name: 'Agendamento' })).toBeVisible()

    // Avançar novamente
    await serviceCard.getByRole('button', { name: 'Selecionar' }).click()
    await slot.click()
    await page.getByRole('button', { name: 'Continuar' }).first().click()

    // Step 2: Dados
    await expect(page.getByRole('heading', { name: 'Seus dados' })).toBeVisible()

    // Voltar para step 1
    await page.getByRole('button', { name: 'Voltar' }).click()
    await expect(page.getByRole('heading', { name: 'Escolha a data e o horário' })).toBeVisible()
  })
})