import { test, expect, type Page } from '@playwright/test'
import { readSavedPaymobConfiguration } from '../src/lib/paymob-configuration'
import { paymobTutorials } from '../src/lib/paymob-tutorials'
import { paymobExperienceEn } from '../src/locales/paymob-experience'

const base = '/doctor/clinics/7/payments'
const savedAccount = { id: 12, provider: 'Paymob', status: 'Ready', isReady: true, integrations: [{ id: 23, paymentMethod: 'Card', integrationId: 5934907, isActive: true }] }

async function setup(page: Page, options: { status?: string; issue?: string; owner?: boolean; language?: string; theme?: string } = {}) {
  await page.addInitScript(({ language, theme }) => {
    const payload = btoa(JSON.stringify({ sub: 'doctor-1', given_name: 'Dr. Salma Hassan', role: 'Doctor' }))
    localStorage.setItem('clinova.access-token', 'test.' + payload + '.test')
    localStorage.setItem('clinova.refresh-token', 'test-refresh')
    localStorage.setItem('clinova.language', language)
    localStorage.setItem('clinova.theme', theme)
  }, { language: options.language ?? 'en', theme: options.theme ?? 'light' })
  await page.route('**/hubs/**', (route) => route.abort())
  const state = {
    response: { provider: 'Paymob', status: options.status ?? 'Connected', issueCode: options.issue, message: 'RAW_PROVIDER_PRIVATE_MESSAGE', lastIssueAt: '2026-10-06T10:00:00Z' },
    accounts: (options.status === 'NotConfigured' ? [] : [{ ...savedAccount, status: options.status ?? 'Ready', isReady: !options.status || options.status === 'Ready' }]) as unknown[],
    fail: false,
    calls: [] as string[],
  }
  await page.route('**/api/**', (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    state.calls.push(request.method() + ' ' + path)
    if (path === '/api/clinics/7') return route.fulfill({ json: { id: 7, name: 'Olive Care Clinic', images: [], phoneNumbers: [] } })
    if (path === '/api/clinics/7/members') return route.fulfill({ json: [{ id: 'doctor-1', isOwner: options.owner !== false }] })
    if (path === '/api/payments/clinics/7/configuration') return state.fail ? route.fulfill({ status: 500, json: { message: 'RAW_PROVIDER_PRIVATE_MESSAGE' } }) : route.fulfill({ json: state.response })
    if (path === '/api/online-payment-accounts/clinics/7') return state.fail ? route.fulfill({ status: 500, json: { message: 'RAW_PROVIDER_PRIVATE_MESSAGE' } }) : route.fulfill({ json: state.accounts })
    return route.fulfill({ json: [] })
  })
  return state
}

test('account metadata excludes credentials and rejects invalid contracts', () => {
  const unsafe = { ...savedAccount, publicKey: 'never-cache', apiKey: 'never-cache', secretKey: 'never-cache', message: 'never-cache' }
  const parsed = readSavedPaymobConfiguration([unsafe])
  expect(parsed?.status).toBe('Ready')
  expect(parsed?.integrations).toEqual(savedAccount.integrations)
  expect(JSON.stringify(parsed)).not.toContain('never-cache')
  expect(readSavedPaymobConfiguration([])).toBeNull()
  for (const value of [[savedAccount, savedAccount], [{ ...savedAccount, isReady: false }], [{ ...savedAccount, status: 'Connected' }], [null]]) {
    expect(() => readSavedPaymobConfiguration(value)).toThrow()
  }
})
for (const [status, label, action] of [
  ['PendingVerification', 'Pending verification', 'Manage'], ['Ready', 'Ready', 'Manage'],
  ['Restricted', 'Restricted', 'Manage'], ['NeedsAttention', 'Needs attention', 'Review Settings'], ['Disabled', 'Disabled', 'Manage'],
]) {
  test('backend-driven settings state: ' + status, async ({ page }) => {
    const state = await setup(page, { status })
    await page.goto(base)
    const row = page.getByRole('region', { name: 'Paymob', exact: true })
    await expect(row.getByText(label, { exact: true })).toBeVisible()
    await expect(row.getByRole('link', { name: action, exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Disable', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Enable Online Payments', exact: true })).toHaveCount(0)
    expect(state.calls.every((call) => call.startsWith('GET '))).toBe(true)
    expect(state.calls.some((call) => call.includes('/api/payments/'))).toBe(false)
  })
}
test('empty account list offers connection', async ({ page }) => {
  await setup(page, { status: 'NotConfigured' })
  await page.goto(base)
  await expect(page.getByRole('link', { name: 'Connect Paymob', exact: true })).toBeVisible()
})

test('generic failure and stale issue codes never invent a configuration issue', async ({ page }) => {
  const state = await setup(page, { status: 'Ready', issue: 'HmacVerificationFailed' })
  await page.goto(base)
  await expect(page.getByText('Ready', { exact: true })).toBeVisible()
  await expect(page.getByText(paymobExperienceEn.issues.HmacVerificationFailed.title)).toHaveCount(0)
  state.fail = true
  await page.getByRole('button', { name: 'Refresh settings' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Payment settings could not be loaded.' })).toBeVisible()
  await expect(page.getByText('Needs attention', { exact: true })).toHaveCount(0)
  await expect(page.getByText('RAW_PROVIDER_PRIVATE_MESSAGE')).toHaveCount(0)
})

test('settings, guide, setup, help and all nine tutorials preserve clinic context', async ({ page }) => {
  test.setTimeout(120000)
  await setup(page)
  await page.goto(base)
  await page.getByRole('link', { name: 'Setup Guide', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Get your integration credentials', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Zoom API Keys screenshot' })).toBeVisible()
  await page.getByRole('link', { name: 'Back to Connect Paymob' }).first().click()
  await expect(page).toHaveURL(base + '/paymob/connect#paymob-connect')
  await expect(page.locator('#paymob-connect-title')).toBeFocused()
  await page.getByRole('link', { name: 'Need help?', exact: true }).click()
  for (const topic of paymobTutorials) {
    const title = paymobExperienceEn.tutorials[topic].title
    await page.getByRole('button', { name: title, exact: true }).click()
    const panel = page.getByRole('region', { name: title, exact: true })
    await expect(panel).toBeVisible()
    await expect(panel.locator('ol > li')).toHaveCount(paymobExperienceEn.tutorials[topic].steps.length)
    await panel.getByRole('button', { name: /(?:Zoom .* screenshot|Expand .* screenshot placeholder)/ }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    // Deep links remain supported alongside the in-place FAQ.
    await page.goto(base + '/paymob/help/' + topic)
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'All Paymob guides', exact: true }).click()
  }
})

test('manage masks saved secrets and explicit replacement never prefills them', async ({ page }) => {
  const state = await setup(page)
  await page.goto(base + '/paymob/manage')
  for (const label of ['Secret Key', 'HMAC Secret', 'ApiKey']) {
    await expect(page.getByLabel(label, { exact: true })).toHaveValue('••••••••••••••••••')
    await expect(page.getByLabel(label, { exact: true })).toHaveAttribute('readonly', '')
    await expect(page.getByRole('button', { name: 'Show ' + label, exact: true })).toHaveCount(0)
  }
  await expect(page.getByLabel('Public Key', { exact: true })).toHaveValue('pk_••••••••••••')
  await expect(page.getByLabel('Card Integration ID', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Replace ApiKey', exact: true }).click()
  await expect(page.getByLabel('ApiKey', { exact: true })).toHaveValue('')
  await page.getByLabel('ApiKey', { exact: true }).fill('local-test-api-value')
  await page.getByRole('button', { name: 'Keep existing ApiKey', exact: true }).click()
  await page.getByRole('button', { name: 'Replace ApiKey', exact: true }).click()
  await expect(page.getByLabel('ApiKey', { exact: true })).toHaveValue('')
  await expect(page.getByRole('button', { name: 'Update credentials', exact: true })).toBeDisabled()
  expect(state.calls.every((call) => call.startsWith('GET '))).toBe(true)
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain('local-test-api-value')
})

test('partial update submits only selected fields and clears submitted values', async ({ page }) => {
  await page.goto('/tests/fixtures/paymob-form.html?mode=update')
  await page.evaluate(() => {
    window.addEventListener('submitted-fields', (event) => document.body.dataset.submitted = JSON.stringify((event as CustomEvent).detail), { once: true })
  })
  await page.getByRole('button', { name: 'Replace ApiKey', exact: true }).click()
  await page.getByLabel('ApiKey', { exact: true }).fill('test-new-api-only')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Update credentials', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Saving your Paymob configuration securely...' })).toBeDisabled()
  expect(await page.locator('body').getAttribute('data-submitted')).toBe(JSON.stringify({ names: ['apiKey'], correctApiKey: true }))
  expect(await page.locator('input').evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value))).not.toContain('test-new-api-only')
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('save-result', { detail: 'success' })))
  await expect(page.getByRole('status').getByText('Paymob configuration updated successfully', { exact: true })).toBeVisible()
  await expect(page.getByLabel('ApiKey', { exact: true })).toHaveCount(0)
})

test('all sensitive-field errors are accessible without submitting', async ({ page }) => {
  await page.goto('/tests/fixtures/paymob-form.html')
  for (const name of ['Secret Key', 'HMAC Secret', 'ApiKey']) {
    const field = page.getByLabel(name, { exact: true })
    await field.focus()
    await page.keyboard.press('Tab')
    await expect(field).toHaveAttribute('aria-invalid', 'true')
    const errorId = (await field.getAttribute('aria-describedby'))!.split(' ').find((id) => id.endsWith('-error'))!
    await expect(page.locator('#' + errorId)).toHaveText('Enter ' + name + '.')
  }
})

for (const width of [360, 768, 1440]) {
  test('all new page layouts at ' + width, async ({ page }, testInfo) => {
    test.setTimeout(60000)
    await page.setViewportSize({ width, height: 950 })
    await setup(page, { status: 'NeedsAttention', issue: 'HmacVerificationFailed', language: width === 360 ? 'ar' : 'en', theme: width === 360 ? 'dark' : 'light' })
    for (const route of ['', '/paymob/guide', '/paymob/manage', '/paymob/help', '/paymob/help/hmac-secret']) {
      await page.goto(base + route)
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 })
      if (route === '/paymob/manage') await expect(page.getByLabel('ApiKey', { exact: true })).toBeVisible()
      else if (!route) await expect(page.getByRole('region', { name: 'Paymob', exact: true })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.screenshot({ path: testInfo.outputPath((route.replaceAll('/', '-') || 'settings') + '.png'), fullPage: true })
    }
  })
}

test('read-only metadata endpoints are never fetched for non-owners', async ({ page }) => {
  const state = await setup(page, { owner: false })
  for (const route of ['', '/paymob/manage', '/paymob/guide', '/paymob/help']) {
    await page.goto(base + route)
    await expect(page.getByText('Only the clinic owner can connect Paymob for this clinic.')).toBeVisible()
  }
  expect(state.calls.some((call) => /online-payment-accounts|payments\/clinics/.test(call))).toBe(false)
})

test('supplied screenshot supports full-size viewing and keyboard close', async ({ page }) => {
  await page.goto('/tests/fixtures/paymob-form.html?mode=image')
  const zoom = page.getByRole('button', { name: 'Zoom Supplied image test screenshot', exact: true })
  await zoom.click()
  await page.getByRole('button', { name: 'View full size', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Fit image', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('Escape')
  await expect(zoom).toBeFocused()
})

test('manage guide keeps a replacement in place and cancellation discards it', async ({ page }) => {
  await setup(page)
  await page.goto(base + '/paymob/manage')
  await page.getByRole('button', { name: 'Replace ApiKey', exact: true }).click()
  const input = page.getByLabel('ApiKey', { exact: true })
  await expect(input).toBeFocused()
  await input.fill('manage-guide-demo')
  await page.getByRole('button', { name: 'Where do I find these?', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Get your integration credentials', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(input).toHaveValue('manage-guide-demo')
  await page.getByRole('button', { name: 'Keep existing ApiKey', exact: true }).click()
  await page.getByRole('button', { name: 'Replace ApiKey', exact: true }).click()
  await expect(input).toHaveValue('')
})
