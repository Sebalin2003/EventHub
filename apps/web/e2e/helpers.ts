import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Helpers compartidos por los escenarios E2E.
 * El idioma se fija en español porque los textos visibles son parte del contrato de UI.
 */
export async function gotoHome(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('eventhub-language', 'es')
  })
  await page.goto('/')
  await expect(page.locator('.public-header')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Descubre eventos')
}

export function mainNav(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Navegación principal' })
}

export async function openLogin(page: Page) {
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Iniciar sesión', exact: true })).toBeVisible()
}

export async function loginWithDemo(page: Page, role: 'Asistente' | 'Organizador' | 'Staff' | 'Administrador') {
  await openLogin(page)
  await page.getByRole('button', { name: new RegExp(role) }).first().click()
  await page.getByRole('button', { name: new RegExp(`Entrar como ${role}`) }).click()
}

export async function loginWithCredentials(page: Page, email: string, password = 'password') {
  await openLogin(page)
  await page.getByRole('button', { name: 'Con credenciales' }).click()
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  const loginResponse = page.waitForResponse(
    response => response.url().includes('/api/auth/login') && response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
  const response = await loginResponse
  expect(response.status(), 'el login debe autenticarse contra la API real').toBeLessThan(400)
}

/** Navegación pública: usa la barra de escritorio o el selector mobile según el viewport. */
export async function navigatePublic(page: Page, key: 'home' | 'explore') {
  const label = key === 'home' ? 'Inicio' : 'Explorar'
  const desktopButton = mainNav(page).getByRole('button', { name: label, exact: true })
  if (await desktopButton.isVisible()) await desktopButton.click()
  else await page.locator('select[aria-label="Navegación principal"]').selectOption(key)
}

export async function openExplore(page: Page) {
  await navigatePublic(page, 'explore')
  await expect(page.getByRole('heading', { name: 'Explorar eventos' })).toBeVisible()
}

export async function openEventFromExplore(page: Page, query: string, title: string) {
  await openExplore(page)
  await page.getByRole('textbox', { name: 'Buscar', exact: true }).fill(query)
  const card = page.getByRole('button', { name: new RegExp(title) })
  await expect(card).toBeVisible()
  await card.click()
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
}

/** Verifica que la página no genere scroll horizontal (desborde de layout). */
export async function expectNoHorizontalOverflow(page: Page, label: string) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(
    metrics.scrollWidth,
    `${label} desborda horizontalmente: ${metrics.scrollWidth}px > ${metrics.clientWidth}px`,
  ).toBeLessThanOrEqual(metrics.clientWidth + 1)
}
