import { test, expect, type Page } from '@playwright/test'

async function setup(page: Page, login: { status: number; json: unknown }) {
  await page.route('**/hubs/**', (route) => route.abort())
  await page.route('**/api/**', (route) => new URL(route.request().url()).pathname === '/api/auth/login'
    ? route.fulfill(login)
    : route.fulfill({ json: [] }))
  await page.goto('/login')
  await page.getByLabel('Email').fill('nour@example.com')
  await page.locator('#password').fill('Secret123!')
  await page.getByRole('button', { name: /Sign in/i }).click()
}

test('a single sign-in click reaches the dashboard', async ({ page }) => {
  const payload = Buffer.from(JSON.stringify({ sub: 'u1', given_name: 'Nour Samir', role: 'Secretary' })).toString('base64url')
  await setup(page, { status: 200, json: { accessToken: `h.${payload}.s`, refreshToken: 'r' } })
  await expect(page).toHaveURL(/\/dashboard$/)
})

test('a rejected sign-in stays on the login page and shows the reason', async ({ page }) => {
  await setup(page, { status: 401, json: { statusCode: 401, title: 'Unauthorized', message: 'Invalid email or password.' } })
  await expect(page.getByText('Invalid email or password.')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('button', { name: /Sign in/i })).toBeEnabled()
})
