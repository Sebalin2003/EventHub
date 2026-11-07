import { expect, test } from '@playwright/test'
import {
  gotoHome,
  loginWithCredentials,
  loginWithDemo,
  mainNav,
  navigatePublic,
  openEventFromExplore,
  openExplore,
  openLogin,
} from './helpers'

/**
 * Eje A - 5 escenarios críticos de punta a punta.
 * Corren contra el stack Docker real (web + API + PostgreSQL + RabbitMQ).
 */

test.describe('Eje A - escenarios críticos E2E', () => {
  test('A1. El asistente inicia sesión con credenciales reales y accede al catálogo', async ({ page }) => {
    await gotoHome(page)

    await loginWithCredentials(page, 'maria@eventhub.com.ar')

    // El JWT real queda persistido y la navegación privada aparece.
    const token = await page.evaluate(() => localStorage.getItem('eventhub-access-token'))
    expect(token).toBeTruthy()

    await expect(mainNav(page).getByRole('button', { name: 'Mis entradas', exact: true })).toBeVisible()
    await expect(page.getByText('María', { exact: true })).toBeVisible()
    await expect(page.locator('.event-card').first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Eventos destacados' })).toBeVisible()
  })

  test('A2. Un visitante explora, filtra por categoría y abre el detalle de un evento', async ({ page }) => {
    await gotoHome(page)
    await openExplore(page)

    await page.getByLabel('Categoría').selectOption('webinar')
    await expect(page.locator('.event-card').first()).toBeVisible()
    await expect(page.getByText('2 eventos', { exact: true })).toBeVisible()

    await page.getByRole('textbox', { name: 'Buscar', exact: true }).fill('E-commerce')
    await expect(page.getByText('1 evento', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: /E-commerce para Emprendimientos/ }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'E-commerce para Emprendimientos' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Entradas', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Elegir entradas' })).toBeVisible()
  })

  test('A3. El asistente completa una compra y la entrada aparece en Mis entradas', async ({ page }) => {
    await gotoHome(page)
    await loginWithCredentials(page, 'maria@eventhub.com.ar')
    await openEventFromExplore(page, 'E-commerce', 'E-commerce para Emprendimientos')

    await page.getByRole('button', { name: 'Elegir entradas' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Checkout' })).toBeVisible()

    await page.locator('.ticket-choice label').first().click()
    await expect(page.getByRole('radio').first()).toBeChecked()

    await page.getByRole('button', { name: 'Añadir una entrada' }).click()
    await expect(page.locator('.quantity-control output')).toHaveText('2')

    await page.getByRole('button', { name: 'Reservar y continuar' }).click()
    await expect(page.getByRole('heading', { name: 'Medio de pago' })).toBeVisible()
    await expect(page.getByRole('timer')).toBeVisible()

    await page.getByPlaceholder('4242 4242 4242 4242').fill('4242424242424242')
    await page.getByPlaceholder('NOMBRE APELLIDO').fill('MARIA GONZALEZ')
    await page.getByPlaceholder('MM/AA').fill('12/30')
    await page.getByPlaceholder('123').fill('123')

    await page.getByRole('button', { name: /Confirmar compra/ }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Compra confirmada' })).toBeVisible()
    await expect(page.getByText(/fue aprobada por/)).toBeVisible()
    await expect(page.locator('.ticket-preview')).toHaveCount(2)

    await page.getByRole('button', { name: 'Ver mis entradas' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Mis entradas' })).toBeVisible()
    await expect(page.locator('.ticket-row').filter({ hasText: 'E-commerce para Emprendimientos' }).first()).toBeVisible()
  })

  test('A4. El organizador crea y publica un evento desde el asistente de 5 pasos', async ({ page }) => {
    const title = `Evento E2E ${Date.now()}`

    await gotoHome(page)
    await loginWithDemo(page, 'Organizador')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    await page.getByRole('button', { name: 'Crear evento', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Crear nuevo evento' })).toBeVisible()

    // Paso 1 - Información
    await page.getByPlaceholder('Cumbre de Innovación 2026').fill(title)
    await page.getByPlaceholder('Describe el evento...').fill('Evento creado por la suite E2E de Playwright.')
    await page.locator('input[type="datetime-local"]').first().fill('2027-03-15T10:00')
    await page.locator('input[type="datetime-local"]').nth(1).fill('2027-03-15T18:00')
    await page.getByRole('button', { name: 'Siguiente →' }).click()

    // Paso 2 - Ubicación
    await page.getByPlaceholder('Centro de Convenciones...').fill('Centro de Convenciones E2E')
    await page.getByPlaceholder('Calle, número, código postal').fill('Av. Test 123')
    await page.getByPlaceholder('Madrid').fill('CABA')
    await page.getByPlaceholder('500').fill('120')
    await page.getByRole('button', { name: 'Siguiente →' }).click()

    // Paso 3 - Entradas
    await page.getByPlaceholder('General, VIP, Premium...').fill('Entrada E2E')
    await page.getByPlaceholder('0', { exact: true }).fill('15000')
    await page.getByPlaceholder('100', { exact: true }).fill('80')
    await page.getByPlaceholder('¿Qué incluye esta entrada?').fill('Acceso general al evento.')
    await page.getByRole('button', { name: 'Siguiente →' }).click()

    // Paso 4 - Configuración (valores por defecto válidos)
    await page.getByRole('button', { name: 'Siguiente →' }).click()

    // Paso 5 - Publicación
    await expect(page.getByRole('heading', { name: 'Vista previa y publicación' })).toBeVisible()
    await expect(page.getByText(title, { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Publicar evento →' }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Mis eventos' })).toBeVisible()
    await expect(page.getByText(title, { exact: false })).toBeVisible()
    await expect(page.getByText('Publicado', { exact: true }).first()).toBeVisible()
  })

  test('A5. El login rechaza credenciales inválidas sin otorgar sesión', async ({ page }) => {
    await gotoHome(page)
    await openLogin(page)
    await page.getByRole('button', { name: 'Con credenciales' }).click()
    await page.locator('input[type="email"]').fill('maria@eventhub.com.ar')
    await page.locator('input[type="password"]').fill('incorrecta')
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()

    await expect(page.getByText('Credenciales inválidas')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Iniciar sesión', exact: true })).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('eventhub-access-token'))).toBeNull()
  })

  test('A6. El staff valida una entrada y detecta el segundo uso del mismo código', async ({ page }) => {
    await gotoHome(page)
    await loginWithDemo(page, 'Staff')
    await expect(page.getByRole('heading', { name: 'Seleccionar evento' })).toBeVisible()

    await page.getByRole('button', { name: /Argentina Tech Summit 2026/ }).click()
    await expect(page.getByRole('heading', { name: 'Argentina Tech Summit 2026' })).toBeVisible()

    const scanInput = page.getByPlaceholder('TKT-xxx...')
    await scanInput.fill('TKT-001')
    await page.getByRole('button', { name: 'Validar' }).click()
    await expect(page.getByText('Entrada válida', { exact: true })).toBeVisible()
    await expect(page.getByText('María González', { exact: true }).last()).toBeVisible()

    await scanInput.fill('TKT-001')
    await page.getByRole('button', { name: 'Validar' }).click()
    await expect(page.getByText('Entrada ya utilizada', { exact: true })).toBeVisible()
  })
})
