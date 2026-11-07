import { expect, test } from '@playwright/test'
import { login, OWNER_EMAIL, waitForHydration } from './helpers'

test.describe('Autenticação Admin e Proteção de Rotas', () => {
  test.describe('Proteção de rotas /painel/*', () => {
    test('acesso direto a /painel sem login redireciona para /login', async ({ page }) => {
      await page.goto('/painel')
      await waitForHydration(page)

      // Deve redirecionar para login com parâmetro redirect
      await expect(page).toHaveURL(/\/login/)
      await expect(page).toHaveURL(/redirect=%2Fpainel/)
      await expect(page.getByRole('heading', { name: 'Studio Blessed' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Continuar com Google' })).toBeVisible()
    })

    test('acesso direto a /painel/metricas sem login redireciona para /login', async ({ page }) => {
      await page.goto('/painel/metricas')
      await waitForHydration(page)

      await expect(page).toHaveURL(/\/login/)
      await expect(page).toHaveURL(/redirect=%2Fpainel%2Fmetricas/)
    })

    test('acesso direto a /painel/servicos sem login redireciona para /login', async ({ page }) => {
      await page.goto('/painel/servicos')
      await waitForHydration(page)

      await expect(page).toHaveURL(/\/login/)
      await expect(page).toHaveURL(/redirect=%2Fpainel%2Fservicos/)
    })

    test('acesso direto a /painel/configuracoes sem login redireciona para /login', async ({ page }) => {
      await page.goto('/painel/configuracoes')
      await waitForHydration(page)

      await expect(page).toHaveURL(/\/login/)
      await expect(page).toHaveURL(/redirect=%2Fpainel%2Fconfiguracoes/)
    })

    test('acesso direto a /painel/jornada sem login redireciona para /login', async ({ page }) => {
      await page.goto('/painel/jornada')
      await waitForHydration(page)

      await expect(page).toHaveURL(/\/login/)
    })

    test('acesso direto a /painel/clientes sem login redireciona para /login', async ({ page }) => {
      await page.goto('/painel/clientes')
      await waitForHydration(page)

      await expect(page).toHaveURL(/\/login/)
    })

    test('acesso direto a /painel/inbox sem login redireciona para /login', async ({ page }) => {
      await page.goto('/painel/inbox')
      await waitForHydration(page)

      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe('Fluxo de Autenticação Admin', () => {
    test('login com credenciais válidas redireciona para /painel/metricas', async ({ page }) => {
      await login(page, OWNER_EMAIL)

      // Deve redirecionar para /painel/metricas (configurado no callbackURL)
      await expect(page).toHaveURL(/\/painel\/metricas/)
      await expect(page.getByRole('heading', { name: 'Métricas' })).toBeVisible()
    })

    test('após login, navegação para /painel funciona', async ({ page }) => {
      await login(page, OWNER_EMAIL)
      await page.goto('/painel')
      await waitForHydration(page)

      await expect(page).toHaveURL(/\/painel/)
      await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible()
    })

    test('sidebar navega corretamente entre páginas protegidas', async ({ page }) => {
      await login(page, OWNER_EMAIL)
      await page.goto('/painel')
      await waitForHydration(page)

      // Navegar para Jornada
      await page.getByRole('link', { name: 'Jornada' }).first().click()
      await expect(page).toHaveURL(/\/painel\/jornada/)
      await expect(page.getByRole('heading', { name: 'Jornada' })).toBeVisible()

      // Navegar para Serviços
      await page.getByRole('link', { name: 'Serviços' }).first().click()
      await expect(page).toHaveURL(/\/painel\/servicos/)
      await expect(page.getByRole('heading', { name: 'Serviços' })).toBeVisible()

      // Navegar para Clientes
      await page.getByRole('link', { name: 'Clientes' }).first().click()
      await expect(page).toHaveURL(/\/painel\/clientes/)
      await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible()

      // Navegar para Configurações
      await page.getByRole('link', { name: 'Configurações' }).first().click()
      await expect(page).toHaveURL(/\/painel\/configuracoes/)
      await expect(page.getByRole('heading', { name: 'Configurações' })).toBeVisible()

      // Navegar para Inbox
      await page.getByRole('link', { name: 'Inbox' }).first().click()
      await expect(page).toHaveURL(/\/painel\/inbox/)
      await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible()

      // Voltar para Métricas (home)
      await page.getByRole('link', { name: 'Métricas' }).first().click()
      await expect(page).toHaveURL(/\/painel\/metricas/)
      await expect(page.getByRole('heading', { name: 'Métricas' })).toBeVisible()
    })

    test('logout funciona e redireciona para /login', async ({ page }) => {
      await login(page, OWNER_EMAIL)
      await page.goto('/painel')
      await waitForHydration(page)

      // Clicar no menu do usuário e sair
      await page.getByRole('button', { name: /Usuário|Dona|Owner/i }).first().click()
      await page.getByRole('menuitem', { name: 'Sair' }).click()

      // Deve redirecionar para login
      await expect(page).toHaveURL(/\/login/)
      await expect(page.getByRole('button', { name: 'Continuar com Google' })).toBeVisible()
    })

    test('sessão persiste após recarregar página', async ({ page }) => {
      await login(page, OWNER_EMAIL)
      await page.goto('/painel/metricas')
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Métricas' })).toBeVisible()

      // Recarregar página
      await page.reload()
      await waitForHydration(page)

      // Deve permanecer logado
      await expect(page).toHaveURL(/\/painel\/metricas/)
      await expect(page.getByRole('heading', { name: 'Métricas' })).toBeVisible()
    })
  })

  test.describe('Rotas Públicas permanecem acessíveis', () => {
    test('/ (landing) acessível sem login', async ({ page }) => {
      await page.goto('/')
      await waitForHydration(page)

      await expect(page).toHaveURL(/\/$/)
      await expect(page.getByRole('heading', { name: /Studio Blessed/i })).toBeVisible()
    })

    test('/login acessível sem login', async ({ page }) => {
      await page.goto('/login')
      await waitForHydration(page)

      await expect(page).toHaveURL(/\/login/)
      await expect(page.getByRole('button', { name: 'Continuar com Google' })).toBeVisible()
    })

    test('/agendamento acessível sem login', async ({ page }) => {
      await page.goto('/agendamento')
      await waitForHydration(page)

      await expect(page).toHaveURL(/\/agendamento/)
      await expect(page.getByRole('heading', { name: 'Agendamento' })).toBeVisible()
    })

    test('/meus-agendamentos acessível sem login', async ({ page }) => {
      await page.goto('/meus-agendamentos')
      await waitForHydration(page)

      await expect(page).toHaveURL(/\/meus-agendamentos/)
      await expect(page.getByRole('heading', { name: 'Meus agendamentos' })).toBeVisible()
    })
  })

  test.describe('Comportamento do redirect após login', () => {
    test('acessar /painel/jornada sem login → login → redireciona para /painel/jornada', async ({ page }) => {
      // Tentar acessar página protegida
      await page.goto('/painel/jornada')
      await waitForHydration(page)

      // Deve estar na página de login com redirect
      await expect(page).toHaveURL(/\/login/)
      await expect(page).toHaveURL(/redirect=%2Fpainel%2Fjornada/)

      // Fazer login
      await login(page, OWNER_EMAIL)

      // Deve redirecionar para a página original
      await expect(page).toHaveURL(/\/painel\/jornada/)
      await expect(page.getByRole('heading', { name: 'Jornada' })).toBeVisible()
    })

    test('acessar /painel/configuracoes sem login → login → redireciona para /painel/configuracoes', async ({ page }) => {
      await page.goto('/painel/configuracoes')
      await waitForHydration(page)

      await expect(page).toHaveURL(/\/login/)
      await expect(page).toHaveURL(/redirect=%2Fpainel%2Fconfiguracoes/)

      await login(page, OWNER_EMAIL)

      await expect(page).toHaveURL(/\/painel\/configuracoes/)
      await expect(page.getByRole('heading', { name: 'Configurações' })).toBeVisible()
    })
  })
})