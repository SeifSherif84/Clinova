import { test, expect, type Page } from '@playwright/test'

const path = '/doctor/clinics/7/payments/paymob/connect'
const secrets = ['demo-secret-not-real', 'demo-hmac-not-real', 'demo-api-not-real']

async function setup(page: Page, options: { language?: string; theme?: string; owner?: boolean; role?: string } = {}) {
  await page.addInitScript(({ language, theme, role }) => {
    const payload = btoa(JSON.stringify({ sub: 'doctor-1', given_name: 'Dr. Salma Hassan', role }))
    localStorage.setItem('clinova.access-token', 'test.' + payload + '.test')
    localStorage.setItem('clinova.refresh-token', 'test-refresh')
    localStorage.setItem('clinova.language', language)
    localStorage.setItem('clinova.theme', theme)
  }, { language: options.language ?? 'en', theme: options.theme ?? 'light', role: options.role ?? 'Doctor' })
  await page.route('**/hubs/**', (route) => route.abort())
  const calls: string[] = []
  await page.route('**/api/**', (route) => {
    const request = route.request()
    calls.push(request.method() + ' ' + new URL(request.url()).pathname)
    const url = new URL(request.url()).pathname
    return route.fulfill({ json: url === '/api/clinics/7'
      ? { id: 7, name: 'Olive Care Clinic', images: [], phoneNumbers: [] }
      : url === '/api/clinics/7/members' ? [{ id: 'doctor-1', isOwner: options.owner !== false }] : [] })
  })
  await page.goto(path)
  return calls
}

async function fillForm(page: Page) {
  await page.getByLabel('Public Key', { exact: true }).fill('demo-public-not-real')
  for (const [index, name] of ['Secret Key', 'HMAC Secret', 'ApiKey'].entries()) {
    await page.getByLabel(name, { exact: true }).fill(secrets[index])
  }
  await page.getByRole('checkbox').nth(0).check()
  await page.getByRole('checkbox').nth(1).check()
}

test('guided page enables account save only after credentials and consent', async ({ page }) => {
  const calls = await setup(page)
  await expect(page.getByRole('heading', { name: 'Connect Paymob', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Skip to Step 2.' }).click()
  await expect(page.locator('#paymob-credentials-title')).toBeFocused()
  await expect(page.getByRole('button', { name: 'Connect Paymob Account', exact: true })).toBeDisabled()
  await fillForm(page)
  await expect(page.getByRole('button', { name: 'Connect Paymob Account', exact: true })).toBeEnabled()
  await expect(page.getByLabel('Card Integration ID', { exact: true })).toHaveCount(0)
  expect(calls.every((call) => call.startsWith('GET '))).toBe(true)
  const storage = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))
  for (const secret of secrets) expect(storage).not.toContain(secret)
  await page.reload()
  await expect(page.getByLabel('ApiKey', { exact: true })).toHaveValue('')
})

test('secret visibility is independent; help and lightboxes work by keyboard', async ({ page }) => {
  await setup(page)
  for (const label of ['Secret Key', 'HMAC Secret', 'ApiKey']) await expect(page.getByLabel(label, { exact: true })).toHaveAttribute('type', 'password')
  await page.getByRole('button', { name: 'Show ApiKey', exact: true }).click()
  await expect(page.getByLabel('ApiKey', { exact: true })).toHaveAttribute('type', 'text')
  await expect(page.getByLabel('Secret Key', { exact: true })).toHaveAttribute('type', 'password')
  await page.getByRole('button', { name: 'Hide ApiKey', exact: true }).click()
  const help = page.getByRole('button', { name: 'Help with HMAC Secret', exact: true })
  await help.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('Why does Clinova need it?', { exact: true })).toBeVisible()
  await expect(page.getByText(/When a patient completes a payment, Paymob sends/)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(help).toBeFocused()
  await page.getByRole('button', { name: 'Where do I find these?', exact: true }).click()
  const guide = page.getByRole('dialog', { name: 'Get your integration credentials', exact: true })
  const zoom = guide.getByRole('button', { name: 'Zoom API Keys screenshot', exact: true })
  await zoom.click()
  const screenshot = page.getByRole('dialog', { name: 'Paymob Dashboard Screenshot — API Keys', exact: true })
  await expect(screenshot).toBeVisible()
  await expect(screenshot.getByRole('img')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(zoom).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Where do I find these?', exact: true })).toBeFocused()
})

for (const width of [360, 768, 1440]) {
  test('responsive layout at ' + width, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    await setup(page)
    await expect(page.getByLabel('ApiKey', { exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    for (const name of ['Public Key', 'Secret Key', 'HMAC Secret', 'ApiKey']) {
      const box = await page.getByLabel(name, { exact: true }).boundingBox()
      expect(box!.width).toBeGreaterThan(200)
      expect(box!.x + box!.width).toBeLessThanOrEqual(width)
    }
    await page.screenshot({ path: testInfo.outputPath('connect-paymob.png'), fullPage: true })
  })
}

test('Arabic dark mode remains usable on mobile', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await setup(page, { language: 'ar', theme: 'dark' })
  await expect(page.getByRole('heading', { name: 'ربط Paymob', exact: true })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.getByLabel('Secret Key', { exact: true })).toHaveAttribute('dir', 'ltr')
  await page.getByRole('button', { name: 'مساعدة بشأن ApiKey', exact: true }).click()
  await expect(page.getByText('لماذا تحتاجه Clinova؟', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.keyboard.press('Escape')
  await page.screenshot({ path: testInfo.outputPath('connect-paymob-ar-dark.png'), fullPage: true })
})

test('non-owner and patient cannot access the connection form', async ({ page }) => {
  await setup(page, { owner: false })
  await expect(page.getByText('Only the clinic owner can connect Paymob for this clinic.')).toBeVisible()
  await expect(page.getByLabel('ApiKey', { exact: true })).toHaveCount(0)
  await setup(page, { role: 'Patient' })
  await expect(page).toHaveURL(/\/dashboard/)
})

test('anonymous route preserves the intended destination', async ({ page }) => {
  await page.goto(path)
  await expect(page).toHaveURL(/\/login\?redirect=/)
  expect(new URL(page.url()).searchParams.get('redirect')).toBe(path)
})

test('save UI waits for a result, clears values, and never renders provider errors', async ({ page }) => {
  // Isolated fixture holds the save response to exercise pending and failure states.
  await page.goto('/tests/fixtures/paymob-form.html')
  const submit = page.getByRole('button', { name: 'Connect Paymob Account', exact: true })
  await expect(submit).toBeDisabled()
  await fillForm(page)
  await submit.click()
  await expect(page.getByRole('button', { name: 'Saving your Paymob configuration securely...' })).toBeDisabled()
  for (const name of ['Secret Key', 'HMAC Secret', 'ApiKey']) await expect(page.getByLabel(name, { exact: true })).toHaveValue('')
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('save-result', { detail: 'error' })))
  await expect(page.getByText('Your Paymob configuration could not be saved. Please re-enter your credentials and try again.', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('RAW_PROVIDER_ERROR_SECRET')).toHaveCount(0)
  await fillForm(page)
  await submit.click()
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('save-result', { detail: 'success' })))
  await expect(page.getByRole('status').getByText('Paymob configuration saved successfully', { exact: true })).toBeVisible()
  await expect(page.getByLabel('ApiKey', { exact: true })).toHaveCount(0)
  await expect(page.getByText(/credentials verified|connection verified/i)).toHaveCount(0)
})

test('connection requires both consents', async ({ page }) => {
  await page.goto('/tests/fixtures/paymob-form.html')
  await fillForm(page)
  const submit = page.getByRole('button', { name: 'Connect Paymob Account', exact: true })
  await page.getByRole('checkbox').nth(1).uncheck()
  await expect(submit).toBeDisabled()
  await page.getByRole('checkbox').nth(1).check()
  await expect(submit).toBeEnabled()
})

test('quick start and in-place guidance preserve entries without persisting them', async ({ page }) => {
  await setup(page)
  await page.getByRole('button', { name: 'I have my credentials', exact: true }).click()
  await expect(page.locator('#paymob-connect-title')).toBeFocused()
  await page.getByLabel('ApiKey', { exact: true }).fill('guide-open-demo-value')
  const help = page.getByRole('button', { name: 'Where do I find these?', exact: true })
  await help.click()
  const dialog = page.getByRole('dialog', { name: 'Get your integration credentials', exact: true })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('Public Key', { exact: true }).first()).toBeVisible()
  await dialog.getByRole('button', { name: 'Return to form', exact: true }).click()
  await expect(help).toBeFocused()
  await expect(page.getByLabel('ApiKey', { exact: true })).toHaveValue('guide-open-demo-value')
  await expect(page.getByRole('status').filter({ hasText: '1 of 4 fields filled' })).toBeVisible()
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain('guide-open-demo-value')
  expect(page.url()).not.toContain('guide-open-demo-value')
})

test('editing one field keeps other validation errors and explains the next step', async ({ page }) => {
  await page.goto('/tests/fixtures/paymob-form.html')
  const secret = page.getByLabel('Secret Key', { exact: true })
  const hmac = page.getByLabel('HMAC Secret', { exact: true })
  await secret.focus()
  await hmac.focus()
  await page.getByLabel('ApiKey', { exact: true }).focus()
  await expect(secret).toHaveAttribute('aria-invalid', 'true')
  await expect(hmac).toHaveAttribute('aria-invalid', 'true')
  await secret.fill('demo-secret-value')
  await expect(hmac).toHaveAttribute('aria-invalid', 'true')
  await fillForm(page)
  await page.getByRole('checkbox').nth(1).uncheck()
  await expect(page.getByText('All fields are filled. Confirm both statements below to continue.', { exact: true })).toBeVisible()
  await page.getByRole('checkbox').nth(1).check()
  await expect(page.getByText('Ready to save your configuration.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'How your credentials are protected', exact: true }).click()
  await expect(page.getByRole('dialog').getByText('Sensitive credentials are encrypted before being stored.', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByLabel('Secret Key', { exact: true })).toHaveValue(secrets[0])
})

test('Arabic mobile guide keeps its close control accessible and preserves form entries', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await setup(page, { language: 'ar', theme: 'dark' })
  await page.getByLabel('ApiKey', { exact: true }).fill('guide-ar-demo')
  const help = page.getByRole('button', { name: 'أين أجد هذه البيانات؟', exact: true })
  await help.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const close = dialog.getByRole('button', { name: 'العودة إلى النموذج', exact: true })
  const box = await close.boundingBox()
  expect(box!.y + box!.height).toBeLessThanOrEqual(740)
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('guide-ar-mobile.png') })
  await close.click()
  await expect(help).toBeFocused()
  await expect(page.getByLabel('ApiKey', { exact: true })).toHaveValue('guide-ar-demo')
})
