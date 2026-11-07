import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { gotoHome, loginWithCredentials, loginWithDemo, openEventFromExplore, openLogin } from './helpers'

const WCAG_2_2_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa']

async function audit(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_2_2_AA).analyze()
  const blocking = results.violations.filter(violation => ['critical', 'serious'].includes(violation.impact ?? ''))
  const summary = {
    label,
    url: page.url(),
    blocking: blocking.map(violation => ({ id: violation.id, impact: violation.impact, nodes: violation.nodes.length })),
    all: results.violations.map(violation => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.map(node => node.target.join(' ')),
    })),
    passes: results.passes.length,
  }
  await test.info().attach(`axe-${label}.json`, { body: JSON.stringify(summary, null, 2), contentType: 'application/json' })

  expect(
    blocking,
    `Violaciones axe críticas/serias en ${label}: ${blocking.map(v => `${v.id} (${v.impact})`).join(', ')}`,
  ).toEqual([])
}

test.describe('Accesibilidad WCAG 2.2 AA (axe-core)', () => {
  test('Home pública sin violaciones críticas ni serias', async ({ page }) => {
    await gotoHome(page)
    await audit(page, 'home')
  })

  test('Explorar eventos sin violaciones críticas ni serias', async ({ page }) => {
    await gotoHome(page)
    await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('button', { name: 'Explorar' }).click()
    await expect(page.getByRole('heading', { name: 'Explorar eventos' })).toBeVisible()
    await audit(page, 'explorar')
  })

  test('Detalle de evento sin violaciones críticas ni serias', async ({ page }) => {
    await gotoHome(page)
    await openEventFromExplore(page, 'E-commerce', 'E-commerce para Emprendimientos')
    await audit(page, 'detalle')
  })

  test('Login sin violaciones críticas ni serias', async ({ page }) => {
    await gotoHome(page)
    await openLogin(page)
    await audit(page, 'login')
  })

  test('Checkout sin violaciones críticas ni serias', async ({ page }) => {
    await gotoHome(page)
    await loginWithCredentials(page, 'maria@eventhub.com.ar')
    await openEventFromExplore(page, 'E-commerce', 'E-commerce para Emprendimientos')
    await page.getByRole('button', { name: 'Elegir entradas' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Checkout' })).toBeVisible()
    await audit(page, 'checkout')
  })

  test('Portal del staff sin violaciones críticas ni serias', async ({ page }) => {
    await gotoHome(page)
    await loginWithDemo(page, 'Staff')
    await expect(page.getByRole('heading', { name: 'Seleccionar evento' })).toBeVisible()
    await audit(page, 'staff')
  })

  test('Check-in del staff sin violaciones críticas ni serias', async ({ page }) => {
    await gotoHome(page)
    await loginWithDemo(page, 'Staff')
    await page.getByRole('button', { name: /Argentina Tech Summit 2026/ }).click()
    await expect(page.getByRole('heading', { name: 'Argentina Tech Summit 2026' })).toBeVisible()
    await audit(page, 'staff-checkin')
  })

  test('Portal del administrador sin violaciones críticas ni serias', async ({ page }) => {
    await gotoHome(page)
    await loginWithDemo(page, 'Administrador')
    await expect(page.getByRole('button', { name: 'Usuarios', exact: true })).toBeVisible()
    await audit(page, 'admin')
  })

  test('Dashboard del organizador sin violaciones críticas ni serias', async ({ page }) => {
    await gotoHome(page)
    await loginWithDemo(page, 'Organizador')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await audit(page, 'organizador')
  })
})
