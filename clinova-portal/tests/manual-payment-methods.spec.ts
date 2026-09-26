import { test, expect, type Page } from '@playwright/test'

type Method = { id: number; type: string; accountIdentifier: string; isActive: boolean }
const initial: Method[] = [
  { id: 1, type: 'VodafoneCash', accountIdentifier: '01012345678', isActive: true },
  { id: 2, type: 'InstaPay', accountIdentifier: 'clinic@instapay', isActive: false },
]

async function setup(page: Page, options: { owner?: boolean; empty?: boolean; language?: string; theme?: string; role?: string } = {}) {
  const state = {
    methods: options.empty ? [] as Method[] : structuredClone(initial),
    calls: [] as { path: string; verb: string; body: Record<string, unknown> | null }[],
    history: false, stale: false, failList: false, failSave: false, delay: 0,
  }
  await page.addInitScript(({ language, theme, role }) => {
    const payload = btoa(JSON.stringify({ sub: 'doctor-1', given_name: 'Dr. Salma Hassan', role }))
    localStorage.setItem('clinova.access-token', `test.${payload}.test`)
    localStorage.setItem('clinova.refresh-token', 'test-refresh')
    localStorage.setItem('clinova.language', language)
    localStorage.setItem('clinova.theme', theme)
  }, { language: options.language ?? 'en', theme: options.theme ?? 'light', role: options.role ?? 'Doctor' })
  await page.route('**/hubs/**', (route) => route.abort())
  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const verb = request.method()
    const body = request.postDataJSON()
    state.calls.push({ path, verb, body })
    const reply = (value: unknown, status = 200) => route.fulfill({ status, json: value })
    if (path === '/api/clinics/7') return reply({ id: 7, name: 'Olive Care Clinic', streetName: 'Tahrir Street', buildingNumber: '12', regionName: 'Maadi', consultationFee: 400, depositPercentage: 25, phoneNumbers: [], images: [] })
    if (path === '/api/clinics/7/members') return reply([{ id: 'doctor-1', fullName: 'Dr. Salma Hassan', isOwner: options.owner !== false }])
    if (!path.startsWith('/api/manual-payment-methods')) return reply([])
    if (path.endsWith('/management')) return state.failList ? reply({ message: 'Unable to load accounts.' }, 500) : reply(state.methods)
    if (state.delay) await new Promise((resolve) => setTimeout(resolve, state.delay))
    if (verb === 'POST') {
      if (state.failSave) return reply({ message: 'This payment method has already been added to the clinic.' }, 400)
      state.methods.push({ id: 10, type: body.type === 1 ? 'VodafoneCash' : 'InstaPay', accountIdentifier: body.accountIdentifier, isActive: true })
      return reply('Created')
    }
    const id = Number(path.split('/')[3])
    const method = state.methods.find((item) => item.id === id)!
    if (verb === 'DELETE') {
      if (state.history) return reply({ message: 'This payment method cannot be deleted because it has existing payments. Please deactivate it instead.' }, 400)
      state.methods = state.methods.filter((item) => item.id !== id)
      return reply('Deleted')
    }
    if (path.endsWith('/activate') || path.endsWith('/deactivate')) {
      method.isActive = path.endsWith('/activate')
      if (state.stale) return reply({ message: `This payment method is already ${method.isActive ? 'active' : 'inactive'}.` }, 400)
      return reply('Updated')
    }
    method.accountIdentifier = body.accountIdentifier
    return reply('Updated')
  })
  await page.goto('/doctor/clinics/7/payment-methods')
  return state
}

function account(page: Page, identifier: string) {
  return page.getByRole('listitem').filter({ has: page.getByText(identifier, { exact: true }) })
}

test('owner management lists both statuses and never calls the patient listing', async ({ page }) => {
  const state = await setup(page)
  await expect(account(page, '01012345678')).toBeVisible()
  await expect(account(page, 'clinic@instapay')).toBeVisible()
  await page.getByRole('button', { name: /^Paused/ }).click()
  await expect(account(page, '01012345678')).toHaveCount(0)
  expect(state.calls.filter((call) => call.verb === 'GET' && call.path === '/api/manual-payment-methods/clinics/7')).toEqual([])
})

test('create validates a wallet, normalizes Arabic digits, and prevents duplicate submits', async ({ page }) => {
  const state = await setup(page, { empty: true })
  await page.getByRole('button', { name: 'Add payment method', exact: true }).click()
  const input = page.getByLabel('Wallet phone number')
  await input.fill('123')
  await page.getByRole('button', { name: 'Add & activate', exact: true }).click()
  await expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(state.calls.filter((call) => call.verb === 'POST')).toHaveLength(0)
  await input.fill('٠١٠ ١٢٣٤ ٥٦٧٨')
  state.delay = 600
  await page.getByRole('button', { name: 'Add & activate', exact: true }).dblclick()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(account(page, '01012345678')).toBeVisible()
  expect(state.calls.filter((call) => call.verb === 'POST').map((call) => call.body)).toEqual([{ type: 1, accountIdentifier: '01012345678' }])
})

test('InstaPay uses numeric create type and edit updates only the identifier', async ({ page }) => {
  const state = await setup(page)
  await page.getByRole('button', { name: 'Add payment method', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: /InstaPay/ }).click()
  await page.getByLabel('InstaPay account identifier').fill(' reception@instapay ')
  await page.getByRole('button', { name: 'Add & activate', exact: true }).click()
  await account(page, 'reception@instapay').getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByLabel('InstaPay account identifier').fill('billing@instapay')
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(account(page, 'billing@instapay')).toBeVisible()
  expect(state.calls.find((call) => call.verb === 'POST')?.body).toEqual({ type: 2, accountIdentifier: 'reception@instapay' })
  expect(state.calls.find((call) => call.verb === 'PATCH')?.body).toEqual({ accountIdentifier: 'billing@instapay' })
})

test('duplicate validation and server errors retain the form input', async ({ page }) => {
  const state = await setup(page)
  await page.getByRole('button', { name: 'Add payment method', exact: true }).click()
  await page.getByLabel('Wallet phone number').fill('01012345678')
  await page.getByRole('button', { name: 'Add & activate', exact: true }).click()
  await expect(page.getByLabel('Wallet phone number')).toHaveAttribute('aria-invalid', 'true')
  expect(state.calls.filter((call) => call.verb === 'POST')).toHaveLength(0)
  state.failSave = true
  await page.getByLabel('Wallet phone number').fill('01112345678')
  await page.getByRole('button', { name: 'Add & activate', exact: true }).click()
  await expect(page.getByText('This payment method has already been added to the clinic.', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Wallet phone number')).toHaveValue('01112345678')
})

test('activate and deactivate use current status and reconcile already-inactive errors', async ({ page }) => {
  const state = await setup(page)
  await account(page, 'clinic@instapay').getByRole('button', { name: 'Activate', exact: true }).click()
  await expect(account(page, 'clinic@instapay').getByRole('button', { name: 'Deactivate', exact: true })).toBeEnabled()
  state.stale = true
  await account(page, 'clinic@instapay').getByRole('button', { name: 'Deactivate', exact: true }).click()
  await expect(account(page, 'clinic@instapay').getByRole('button', { name: 'Activate', exact: true })).toBeEnabled()
  expect(state.calls.filter((call) => call.verb === 'PATCH').map((call) => call.path)).toEqual(['/api/manual-payment-methods/2/clinics/7/activate', '/api/manual-payment-methods/2/clinics/7/deactivate'])
})

test('delete can be cancelled; history fallback requires explicit deactivation', async ({ page }) => {
  const state = await setup(page)
  state.history = true
  await account(page, '01012345678').getByRole('button', { name: 'Delete', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Keep account' }).click()
  expect(state.calls.filter((call) => call.verb === 'DELETE')).toHaveLength(0)
  await account(page, '01012345678').getByRole('button', { name: 'Delete', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Keep the history. Pause the account.' })).toBeVisible()
  expect(state.calls.filter((call) => call.verb === 'PATCH')).toHaveLength(0)
  await page.getByRole('alertdialog').getByRole('button', { name: 'Deactivate', exact: true }).click()
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(account(page, '01012345678').getByRole('button', { name: 'Activate', exact: true })).toBeEnabled()
})

test('unused accounts can be permanently deleted', async ({ page }) => {
  const state = await setup(page)
  await account(page, 'clinic@instapay').getByRole('button', { name: 'Delete', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(account(page, 'clinic@instapay')).toHaveCount(0)
  expect(state.calls.filter((call) => call.verb === 'DELETE')).toHaveLength(1)
})

test('non-owners cannot load management data', async ({ page }) => {
  const state = await setup(page, { owner: false })
  await expect(page.getByText('Only the clinic owner can manage payment methods.')).toBeVisible()
  expect(state.calls.filter((call) => call.path.includes('manual-payment-methods'))).toHaveLength(0)
})

test('patient role cannot open the owner workspace', async ({ page }) => {
  const state = await setup(page, { role: 'Patient' })
  await expect(page).toHaveURL(/\/dashboard$/)
  expect(state.calls.filter((call) => call.path.includes('manual-payment-methods'))).toHaveLength(0)
})

test('failed refresh disables mutations and supports recovery', async ({ page }) => {
  const state = await setup(page)
  await expect(account(page, 'clinic@instapay')).toBeVisible()
  state.failList = true
  await page.getByRole('button', { name: 'Refresh accounts' }).click()
  await expect(page.getByText('The list could not be refreshed. Refresh it before making more changes.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add payment method', exact: true })).toBeDisabled()
  state.failList = false
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(account(page, 'clinic@instapay')).toBeVisible()
})

for (const mode of [{ language: 'en', theme: 'light', width: 1440 }, { language: 'ar', theme: 'dark', width: 390 }, { language: 'en', theme: 'light', width: 360 }]) {
  test(`responsive layout and logos: ${mode.language} ${mode.theme} ${mode.width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: mode.width, height: 1000 })
    await setup(page, mode)
    await expect(account(page, '01012345678')).toBeVisible()
    const logos = page.locator('img[src*="payment-providers"]')
    await expect(logos).toHaveCount(4)
    for (const logo of await logos.all()) await expect.poll(() => logo.evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('workspace.png'), fullPage: true })
    await page.getByRole('button', { name: mode.language === 'ar' ? 'إضافة طريقة دفع' : 'Add payment method', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    const bounds = await dialog.boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(mode.width)
    await page.screenshot({ path: testInfo.outputPath('editor.png'), fullPage: true })
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
  })
}

test('unchanged edits do not call the API and reselecting a provider preserves input', async ({ page }) => {
  const state = await setup(page)
  await account(page, '01012345678').getByRole('button', { name: 'Edit', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Save changes', exact: true })).toBeDisabled()
  await page.getByLabel('Wallet phone number').fill('010 1234 5678')
  await expect(page.getByRole('button', { name: 'Save changes', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await page.getByRole('button', { name: 'Add payment method', exact: true }).click()
  await page.getByLabel('Wallet phone number').fill('01112345678')
  await page.getByRole('dialog').getByRole('button', { name: /Vodafone Cash/ }).click()
  await expect(page.getByLabel('Wallet phone number')).toHaveValue('01112345678')
  expect(state.calls.filter((call) => call.verb === 'PATCH')).toHaveLength(0)
})

test('already paused accounts with history offer close instead of a redundant deactivation', async ({ page }) => {
  const state = await setup(page)
  state.history = true
  await account(page, 'clinic@instapay').getByRole('button', { name: 'Delete', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page.getByText('This account has payment history and cannot be deleted. It is already paused and hidden from patients.')).toBeVisible()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  expect(state.calls.filter((call) => call.verb === 'PATCH')).toHaveLength(0)
})
