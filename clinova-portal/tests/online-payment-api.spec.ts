import { test, expect, type Page } from '@playwright/test'
const base = '/doctor/clinics/7/payments'
type Account = { id: number; provider: string; status: string; isReady: boolean; integrations: { id: number; paymentMethod: string; integrationId: number; isActive: boolean }[] }
const account = (): Account => ({ id: 12, provider: 'Paymob', status: 'Ready', isReady: true, integrations: [] })
async function setup(page: Page, accounts: Account[] = []) {
  await page.addInitScript(() => {
    localStorage.setItem('clinova.access-token', 'test.' + btoa(JSON.stringify({ sub: 'doctor-1', role: 'Doctor' })) + '.test')
    localStorage.setItem('clinova.refresh-token', 'test-refresh')
    localStorage.setItem('clinova.language', 'en')
  })
  await page.route('**/hubs/**', route => route.abort())
  const state = { accounts, failSave: 0, failRead: false, writes: [] as { path: string; method: string; body: Record<string, unknown>; authorization: string | undefined }[], reads: 0 }
  await page.route('**/api/**', async route => {
    const req = route.request(), path = new URL(req.url()).pathname
    if (path === '/api/clinics/7') return route.fulfill({ json: { id: 7, name: 'Test clinic', images: [], phoneNumbers: [] } })
    if (path === '/api/clinics/7/members') return route.fulfill({ json: [{ id: 'doctor-1', isOwner: true }] })
    if (path === '/api/online-payment-accounts/clinics/7' && req.method() === 'GET') {
      state.reads++
      return route.fulfill({ status: state.failRead ? 500 : 200, json: state.failRead ? { message: 'PRIVATE_PROVIDER_ERROR' } : state.accounts })
    }
    if (req.method() === 'POST' || req.method() === 'PATCH') {
      const body = req.postDataJSON()
      state.writes.push({ path, method: req.method(), body, authorization: req.headers().authorization })
      if (state.failSave) return route.fulfill({ status: state.failSave, json: { message: 'PRIVATE_PROVIDER_ERROR' } })
      if (path === '/api/online-payment-accounts/clinics/7') state.accounts = [{ ...account(), status: 'PendingVerification', isReady: false }]
      else if (path === '/api/online-payment-accounts/12/clinics/7') { state.accounts[0].status = 'PendingVerification'; state.accounts[0].isReady = false }
      else if (path === '/api/integrations/online-payment-accounts/12/clinics/7') state.accounts[0].integrations.push({ id: state.accounts[0].integrations.length + 1, paymentMethod: body.paymentMethod === 1 ? 'Card' : 'Wallet', integrationId: body.integrationId, isActive: true })
      else return route.fulfill({ status: 404, json: {} })
      return route.fulfill({ json: 'Saved' })
    }
    return route.fulfill({ json: [] })
  })
  return state
}
async function fillCredentials(page: Page) {
  for (const name of ['Public Key', 'Secret Key', 'HMAC Secret', 'ApiKey']) await page.getByLabel(name, { exact: true }).fill('  test-' + name + '  ')
  for (const checkbox of await page.getByRole('checkbox').all()) await checkbox.check()
}
test('create sends four credentials, lists saved account, then separately adds Card and Wallet', async ({ page }) => {
  const state = await setup(page)
  await page.goto(base + '/paymob/connect')
  await fillCredentials(page)
  await page.getByRole('button', { name: 'Connect Paymob Account', exact: true }).click()
  await expect(page.getByText('Pending verification', { exact: true })).toBeVisible()
  expect(state.writes).toHaveLength(1)
  expect(state.writes[0]).toMatchObject({ path: '/api/online-payment-accounts/clinics/7', method: 'POST', body: { publicKey: 'test-Public Key', secretKey: 'test-Secret Key', hmacSecret: 'test-HMAC Secret', apiKey: 'test-ApiKey' } })
  expect(state.writes[0].authorization).toMatch(/^Bearer /)
  await expect(page.getByLabel('ApiKey', { exact: true })).toHaveCount(0)
  await page.getByLabel('Integration ID', { exact: true }).fill('123456')
  await page.getByRole('button', { name: 'Add payment integration' }).click()
  await expect(page.getByText('123456', { exact: true })).toBeVisible()
  expect(state.writes[1]).toMatchObject({ path: '/api/integrations/online-payment-accounts/12/clinics/7', body: { paymentMethod: 1, integrationId: 123456 } })
  await expect(page.getByRole('combobox').locator('[data-slot=select-value]')).toHaveText('Wallet')
  await page.getByLabel('Integration ID', { exact: true }).fill('987654')
  await page.getByRole('button', { name: 'Add payment integration' }).click()
  await expect(page.getByText('987654', { exact: true })).toBeVisible()
  expect(state.writes[2].body).toEqual({ paymentMethod: 2, integrationId: 987654 })
  await expect(page.getByRole('button', { name: 'Add payment integration' })).toHaveCount(0)
  await expect(page.getByText('Pending verification', { exact: true })).toBeVisible()
  const storage = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))
  expect(storage).not.toContain('test-Secret Key')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Connect Paymob Account', exact: true })).toHaveCount(0)
  await expect(page.getByText('123456', { exact: true })).toBeVisible()
})
test('PATCH sends only the selected replacement and re-fetches verification status', async ({ page }) => {
  const state = await setup(page, [account()])
  await page.goto(base + '/paymob/manage')
  await expect(page.getByRole('button', { name: 'Update credentials', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Replace ApiKey', exact: true }).click()
  await page.getByLabel('ApiKey', { exact: true }).fill('   ')
  await page.getByRole('checkbox').check()
  await expect(page.getByRole('button', { name: 'Update credentials', exact: true })).toBeDisabled()
  await page.getByLabel('ApiKey', { exact: true }).fill(' new-api-key ')
  await page.getByRole('button', { name: 'Update credentials', exact: true }).click()
  await expect(page.getByRole('status').getByText('Paymob configuration updated successfully', { exact: true })).toBeVisible()
  expect(state.writes).toHaveLength(1)
  expect(state.writes[0]).toMatchObject({ method: 'PATCH', path: '/api/online-payment-accounts/12/clinics/7', body: { apiKey: 'new-api-key' } })
  await page.getByRole('link', { name: 'Back to Online Payments', exact: true }).last().click()
  await expect(page.getByText('Pending verification', { exact: true })).toBeVisible()
  state.accounts[0].status = 'Ready'; state.accounts[0].isReady = true
  await page.getByRole('button', { name: 'Refresh settings', exact: true }).click()
  await expect(page.getByText('Ready', { exact: true })).toBeVisible()
})
test('pending verification polls the account list', async ({ page }) => {
  const state = await setup(page, [{ ...account(), status: 'PendingVerification', isReady: false }])
  await page.clock.install()
  await page.goto(base)
  await expect(page.getByText('Pending verification', { exact: true })).toBeVisible()
  state.accounts[0].status = 'Ready'; state.accounts[0].isReady = true
  await page.clock.fastForward(16000)
  await expect(page.getByText('Ready', { exact: true })).toBeVisible()
  expect(state.reads).toBeGreaterThan(1)
})
test('integration validation blocks invalid integers and supports selecting Wallet first', async ({ page }) => {
  const state = await setup(page, [account()])
  await page.goto(base)
  const input = page.getByLabel('Integration ID', { exact: true })
  for (const value of ['0', '-1', '1.5', '2147483648', '1e3']) {
    await input.fill(value)
    await page.getByRole('button', { name: 'Add payment integration' }).click()
    await expect(input).toHaveAttribute('aria-invalid', 'true')
  }
  expect(state.writes).toHaveLength(0)
  await page.getByRole('combobox').click()
  await page.getByRole('option', { name: 'Wallet', exact: true }).click()
  await input.fill('2147483647')
  await page.getByRole('button', { name: 'Add payment integration' }).click()
  await expect(page.getByText('2147483647', { exact: true })).toBeVisible()
  expect(state.writes[0].body).toEqual({ paymentMethod: 2, integrationId: 2147483647 })
})
test('disabled accounts cannot add integrations; inactive methods cannot be duplicated', async ({ page }) => {
  const existing = account()
  existing.status = 'Disabled'; existing.isReady = false
  existing.integrations = [{ id: 1, paymentMethod: 'Card', integrationId: 99, isActive: false }]
  const state = await setup(page, [existing])
  await page.goto(base)
  await expect(page.getByText('Inactive', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add payment integration' })).toHaveCount(0)
  state.accounts[0].status = 'Ready'; state.accounts[0].isReady = true
  await page.getByRole('button', { name: 'Refresh settings', exact: true }).click()
  await expect(page.getByRole('combobox').locator('[data-slot=select-value]')).toHaveText('Wallet')
  await page.getByRole('combobox').click()
  await expect(page.getByRole('option', { name: 'Card', exact: true })).toHaveCount(0)
})
test('integration failure retains the saved account and reconciles duplicate state', async ({ page }) => {
  const state = await setup(page, [account()])
  await page.goto(base)
  await page.getByLabel('Integration ID', { exact: true }).fill('99')
  state.failSave = 400
  state.accounts[0].integrations = [{ id: 1, paymentMethod: 'Card', integrationId: 99, isActive: true }]
  await page.getByRole('button', { name: 'Add payment integration' }).click()
  await expect(page.getByRole('alert')).toContainText('The integration could not be added')
  await expect(page.getByText('99', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Integration ID', { exact: true })).toHaveValue('')
  await expect(page.getByRole('combobox').locator('[data-slot=select-value]')).toHaveText('Wallet')
  await expect(page.getByText('PRIVATE_PROVIDER_ERROR')).toHaveCount(0)
  expect(state.writes).toHaveLength(1)
})
for (const status of [400, 403, 404, 500]) {
  test('credential failure ' + status + ' clears secrets without claiming success', async ({ page }) => {
    const state = await setup(page)
    state.failSave = status
    await page.goto(base + '/paymob/connect')
    await fillCredentials(page)
    await page.getByRole('button', { name: 'Connect Paymob Account', exact: true }).click()
    await expect(page.getByText('Your Paymob configuration could not be saved. Please re-enter your credentials and try again.', { exact: true }).first()).toBeVisible()
    await expect(page.getByLabel('ApiKey', { exact: true })).toHaveValue('')
    await expect(page.getByText('PRIVATE_PROVIDER_ERROR')).toHaveCount(0)
    expect(state.writes).toHaveLength(1)
  })
}
test('failed account loading offers retry and does not offer duplicate creation', async ({ page }) => {
  const state = await setup(page, [account()]); state.failRead = true
  await page.goto(base + '/paymob/connect')
  await expect(page.getByRole('alert')).toContainText('Payment settings could not be loaded')
  await expect(page.getByLabel('ApiKey', { exact: true })).toHaveCount(0)
  state.failRead = false
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page.getByText('Ready', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Connect Paymob Account', exact: true })).toHaveCount(0)
})
