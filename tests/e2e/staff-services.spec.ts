import { expect, test } from '@playwright/test'
import { expectToast, login, waitForHydration } from './helpers'

test('dona cadastra, edita e desativa um serviço', async ({ page }) => {
  await login(page)
  await page.goto('/painel/servicos')
  await waitForHydration(page)

  await expect(page.getByRole('heading', { name: 'Serviços' })).toBeVisible()

  await page.getByRole('button', { name: 'Novo serviço' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  await dialog.getByLabel('Nome').fill('Hydrating E2E')
  await dialog.getByLabel('Duração (min)').fill('45')
  await dialog.getByLabel('Buffer (min)').fill('5')
  await dialog.getByLabel('Preço (R$)').fill('175')
  await dialog.getByRole('button', { name: 'Criar serviço' }).click()

  await expectToast(page, 'Serviço criado')

  const row = page.getByRole('row').filter({ hasText: 'Hydrating E2E' }).first()
  await expect(row).toBeVisible()
  await expect(row.getByText('45 min')).toBeVisible()
  await expect(row.getByText('R$ 175,00')).toBeVisible()

  // Edita o preço do serviço.
  await row.getByRole('button', { name: 'Editar' }).click()
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('Preço (R$)').fill('199')
  await dialog.getByRole('button', { name: 'Salvar' }).click()

  await expectToast(page, 'Serviço atualizado')
  await expect(page.getByRole('row').filter({ hasText: 'R$ 199,00' }).first()).toBeVisible()

  // Desativa o serviço.
  await row.getByRole('button', { name: 'Desativar' }).click()
  await expect(
    page.getByRole('row').filter({ hasText: 'Hydrating E2E' }).first().getByText('Inativo')
  ).toBeVisible()
})

test('o nome do serviço é único entre os serviços ativos', async ({ page }) => {
  await login(page)
  await page.goto('/painel/servicos')
  await waitForHydration(page)

  await page.getByRole('button', { name: 'Novo serviço' }).click()

  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Nome').fill('corte feminino')
  await dialog.getByLabel('Duração (min)').fill('30')
  await dialog.getByLabel('Preço (R$)').fill('100')
  await dialog.getByRole('button', { name: 'Criar serviço' }).click()

  await expectToast(page, 'Não foi possível salvar')
})