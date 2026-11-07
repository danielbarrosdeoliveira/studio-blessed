import { expect, type Page } from '@playwright/test'
import { addDays, todayIso } from '../helpers/date'
import { TEST_USERS } from '../tests/env'

export { addDays, todayIso }

/** Modelo single-owner: a dona do salão é a única usuária autenticada. */
export const OWNER_EMAIL = TEST_USERS.owner.email

/** Espera o Vue montar para não clicar antes da hidratação do SSR. */
export async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const browserWindow = window as Window & {
      useNuxtApp?: () => { isHydrating?: boolean }
    }

    return browserWindow.useNuxtApp?.().isHydrating === false
  })
}

/**
 * Faz login direto via cookie de sessão (bypassa OAuth Google).
 * Útil para testes E2E onde não queremos passar pelo fluxo OAuth real.
 */
export async function login(page: Page) {
  // Ler o token de sessão do arquivo de seed
  const fs = await import('node:fs/promises')
  const path = await import('node:path')
  
  const seedPath = path.resolve('.data/test-seed.json')
  let sessionToken = ''
  
  try {
    const seedData = JSON.parse(await fs.readFile(seedPath, 'utf-8'))
    sessionToken = seedData.users?.owner?.sessionToken || ''
  } catch {
    console.warn('Não foi possível ler session token do seed, tentando login via Google...')
  }

  if (sessionToken) {
    // Define o cookie de sessão diretamente
    await page.context().addCookies([{
      name: 'session_token',
      value: sessionToken,
      domain: '127.0.0.1',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax'
    }])
    
    // Navega para a página protegida para validar a sessão
    await page.goto('/painel')
    await waitForHydration(page)
    
    // Verifica se está logado
    await expect(page).toHaveURL(/\/painel/)
    return
  }

  // Fallback: tentar login via Google (pode falhar em CI sem credenciais reais)
  await page.goto('/login')
  await waitForHydration(page)
  
  // Verificar se tem botão do Google
  const googleButton = page.getByRole('button', { name: /Continuar com Google|Google/i })
  if (await googleButton.isVisible({ timeout: 5000 })) {
    console.log('Botão Google encontrado, mas login OAuth real não implementado nos testes')
    throw new Error('Login via Google OAuth não disponível nos testes E2E. Configure credenciais de teste ou use session token.')
  }
  
  throw new Error('Não foi possível fazer login: session token não encontrado e OAuth Google não disponível')
}

export async function expectToast(page: Page, title: string) {
  await expect(page.getByText(title, { exact: true })).toBeVisible()
}