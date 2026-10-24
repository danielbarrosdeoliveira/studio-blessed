import { expect, type Page } from '@playwright/test'
import { addDays, todayIso } from '../helpers/date'

export { addDays, todayIso }

export const ADMIN_EMAIL = 'admin@studioblessed.test'
export const MARIA_EMAIL = 'maria@studioblessed.test'
export const E2E_PASSWORD = 'senha123456'

/** Espera o Vue montar para não clicar antes da hidratação do SSR. */
export async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const browserWindow = window as Window & {
      useNuxtApp?: () => { isHydrating?: boolean }
    }

    return browserWindow.useNuxtApp?.().isHydrating === false
  })
}

export async function login(page: Page, email: string) {
  await page.goto('/login')
  await waitForHydration(page)
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(E2E_PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL(url => url.pathname === '/')
}

export async function expectToast(page: Page, title: string) {
  await expect(page.getByText(title, { exact: true })).toBeVisible()
}
