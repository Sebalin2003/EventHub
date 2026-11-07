import { expect, test } from '@playwright/test'
import {
  expectNoHorizontalOverflow,
  gotoHome,
  loginWithDemo,
  mainNav,
  navigatePublic,
  openLogin,
} from './helpers'

const VIEWPORTS = [
  { width: 360, height: 800, label: '360 px (mobile)' },
  { width: 768, height: 1024, label: '768 px (tablet)' },
  { width: 1280, height: 800, label: '1280 px (desktop)' },
]

for (const viewport of VIEWPORTS) {
  test(`Responsive sin desborde horizontal a ${viewport.label}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })

    // Público: home, explorar, detalle y login.
    await gotoHome(page)
    await expectNoHorizontalOverflow(page, `home @ ${viewport.width}`)

    await navigatePublic(page, 'explore')
    await expect(page.getByRole('heading', { name: 'Explorar eventos' })).toBeVisible()
    await expectNoHorizontalOverflow(page, `explorar @ ${viewport.width}`)

    await page.locator('.event-card__body').first().click()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoHorizontalOverflow(page, `detalle @ ${viewport.width}`)

    await page.locator('.brand').click()
    await openLogin(page)
    await expectNoHorizontalOverflow(page, `login @ ${viewport.width}`)
    await page.getByRole('button', { name: 'Explorar sin cuenta →' }).click()

    // Portal del organizador: sidebar + contenido deben reacomodarse sin desborde.
    await loginWithDemo(page, 'Organizador')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expectNoHorizontalOverflow(page, `organizador @ ${viewport.width}`)

    await page.getByRole('button', { name: 'Eventos', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Mis eventos' })).toBeVisible()
    await expectNoHorizontalOverflow(page, `organizador/eventos @ ${viewport.width}`)
  })
}
