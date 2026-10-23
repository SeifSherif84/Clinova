import { test, expect, type Page } from '@playwright/test'

const now = new Date('2026-10-23T08:00:00Z')
const clinic = {
  id: 12, name: 'Al Noor Clinic', streetName: 'El Tahrir St', buildingNumber: '15B', landmark: 'Next to the metro station',
  googleMapsUrl: 'https://maps.google.com/?q=clinic', consultationFee: 500, depositPercentage: 30, regionId: 4, regionName: 'Dokki',
  phoneNumbers: [{ id: 1, phoneNumber: '01000000000' }], images: [],
}
const members = [
  { id: 'doc-1', fullName: 'Dr. Ahmed Hassan', profilePicture: null, medicalSpecialty: 'Cardiology', isOwner: true },
  { id: 'doc-2', fullName: 'Dr. Mona Adel', profilePicture: null, medicalSpecialty: 'Dermatology', isOwner: false },
]
const checkout = {
  appointmentId: 4021, guestPatientName: 'Ahmed Ali', guestPatientPhone: '01012345678', bookingType: 'Advance',
  consultationFee: 500, paymentAmount: 150, remainingAmount: 350, reservationExpiresAt: new Date(now.getTime() + 30 * 60_000).toISOString(),
}

// The booking flows load several pages on the dev server; give them room beyond the 30s default.
test.setTimeout(60_000)

interface Call { method: string; path: string; body: unknown }

async function setup(page: Page, options: { language?: string; theme?: string; notAssigned?: boolean; invalidReservation?: boolean } = {}) {
  await page.clock.install({ time: now })
  await page.addInitScript(({ language, theme }) => {
    const payload = btoa(JSON.stringify({ sub: 'secretary-1', given_name: 'Nour Samir', role: 'Secretary' }))
    localStorage.setItem('clinova.access-token', 'test.' + payload + '.test')
    localStorage.setItem('clinova.refresh-token', 'test-refresh')
    localStorage.setItem('clinova.language', language)
    localStorage.setItem('clinova.theme', theme)
  }, { language: options.language ?? 'en', theme: options.theme ?? 'light' })
  await page.route('**/hubs/**', (route) => route.abort())
  const calls: Call[] = []
  await page.route('**/api/**', (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname
    calls.push({ method: request.method(), path: path + url.search, body: request.postDataJSON() })
    if (options.notAssigned && path.startsWith('/api/clinics/')) return route.fulfill({ status: 400, json: { statusCode: 400, title: 'Bad Request', message: 'You are not assigned to any clinic.' } })
    if (path === '/api/clinics/my-clinic/details') return route.fulfill({ json: clinic })
    if (path === '/api/clinics/members/management') return route.fulfill({ json: members })
    if (path === '/api/lookups/guest-reservation-booking-types') return route.fulfill({ json: [{ id: 1, name: 'Advance' }, { id: 2, name: 'WalkIn' }] })
    if (path === '/api/lookups/guest-reservation-payment-methods') return route.fulfill({ json: [{ id: 1, name: 'Cash' }, { id: 2, name: 'ManualTransfer' }] })
    if (path.endsWith('/available-days')) return route.fulfill({ json: [{ dayName: 'Tuesday', date: '2026-10-27' }, { dayName: 'Thursday', date: '2026-10-29' }] })
    if (path.endsWith('/available-slots')) return route.fulfill({ json: [{ id: 152, startTime: '09:00:00', endTime: '09:30:00' }, { id: 153, startTime: '09:30:00', endTime: '10:00:00' }] })
    // Model-validation failures use the backend's ValidationErrorResponse shape.
    if (path === '/api/appointments/slots/152/guest-reservations' && options.invalidReservation) return route.fulfill({ status: 400, json: { statusCode: 400, errorMessage: 'One Or More Validation Errors Occurred !', errors: [{ field: 'GuestPatientPhone', errors: ['Invalid Egyptian phone number.'] }] } })
    if (path === '/api/appointments/slots/152/guest-reservations') return route.fulfill({ json: checkout })
    if (path === '/api/manual-payment-methods/guest-checkout') return route.fulfill({ json: [{ id: 7, type: 'InstaPay', accountIdentifier: 'alnoor@instapay' }, { id: 8, type: 'VodafoneCash', accountIdentifier: '01011112222' }] })
    if (path.endsWith('/guest-checkout/confirm-payment')) return route.fulfill({ contentType: 'text/plain', body: 'Guest reservation payment confirmed successfully.' })
    if (path.endsWith('/guest-checkout/Cancel-payment')) return route.fulfill({ contentType: 'text/plain', body: 'Guest reservation cancelled successfully.' })
    return route.fulfill({ json: [] })
  })
  return calls
}

async function reserve(page: Page) {
  await page.goto('/secretary/guest-booking')
  await page.getByRole('radio', { name: /Dr. Ahmed Hassan/ }).click()
  await page.getByRole('button', { name: /October 27/ }).click()
  // Time pills hide the radio itself, so click the visible pill like a user would.
  await page.getByText('09:00 – 09:30', { exact: true }).click()
  await expect(page.getByRole('radio', { name: '09:00 – 09:30' })).toBeChecked()
  await page.getByLabel('Guest name').fill('Ahmed Ali')
  await page.getByLabel('Mobile number').fill('01012345678')
  await page.getByRole('button', { name: 'Reserve slot' }).click()
  await expect(page.getByText('Hold expires in')).toBeVisible()
}

test('clinic page shows clinic details and doctors with the owner badge', async ({ page }) => {
  const calls = await setup(page)
  await page.goto('/secretary/clinic')
  await expect(page.getByRole('heading', { name: 'Al Noor Clinic' })).toBeVisible()
  await expect(page.getByText('30% · EGP 150.00')).toBeVisible()
  await expect(page.getByText('Dr. Mona Adel')).toBeVisible()
  await expect(page.getByText('Owner', { exact: true })).toHaveCount(1)
  expect(calls.map((call) => call.path)).toContain('/api/clinics/members/management')
})

test('secretary without a clinic sees the not-assigned state', async ({ page }) => {
  await setup(page, { notAssigned: true })
  await page.goto('/secretary/clinic')
  await expect(page.getByRole('heading', { name: 'You’re not assigned to a clinic yet' })).toBeVisible()
  await page.goto('/secretary/guest-booking')
  await expect(page.getByRole('button', { name: 'View invitations' })).toBeVisible()
})

test('backend validation errors show their field message', async ({ page }) => {
  await setup(page, { invalidReservation: true })
  await page.goto('/secretary/guest-booking')
  await page.getByRole('radio', { name: /Dr. Ahmed Hassan/ }).click()
  await page.getByRole('button', { name: /October 27/ }).click()
  await page.getByText('09:00 – 09:30', { exact: true }).click()
  await page.getByLabel('Guest name').fill('Ahmed Ali')
  await page.getByLabel('Mobile number').fill('01012345678')
  await page.getByRole('button', { name: 'Reserve slot' }).click()
  await expect(page.getByText('Invalid Egyptian phone number.')).toBeVisible()
})

test('guest details are validated before reserving', async ({ page }) => {
  const calls = await setup(page)
  await page.goto('/secretary/guest-booking')
  await page.getByRole('radio', { name: /Dr. Ahmed Hassan/ }).click()
  await page.getByLabel('Mobile number').fill('0123')
  await page.getByRole('button', { name: 'Reserve slot' }).click()
  await expect(page.getByText('Enter a valid 11-digit Egyptian mobile number.')).toBeVisible()
  await expect(page.getByText('Enter a name between 2 and 100 characters.')).toBeVisible()
  expect(calls.some((call) => call.method === 'POST')).toBe(false)
})

test('reserve then confirm a manual transfer payment', async ({ page }) => {
  const calls = await setup(page)
  await reserve(page)
  const created = calls.find((call) => call.method === 'POST' && call.path.endsWith('/guest-reservations'))
  expect(created?.body).toEqual({ bookingType: 1, guestPatientName: 'Ahmed Ali', guestPatientPhone: '01012345678' })
  expect(calls.find((call) => call.path.includes('/available-days'))?.path).toContain('from=2026-10-23&to=2026-10-31')
  await expect(page.getByText(/^(2\d|30):\d\d$/)).toBeVisible()

  await page.getByRole('button', { name: 'Confirm payment' }).click()
  await expect(page.getByText('Choose how the guest paid.')).toBeVisible()
  await page.getByRole('radio', { name: /Manual transfer/ }).click()
  await expect(page.getByText('Vodafone Cash', { exact: true })).toBeVisible()
  await page.getByRole('radio', { name: /alnoor@instapay/ }).click()
  await page.getByRole('button', { name: 'Confirm payment' }).click()
  await expect(page.getByRole('heading', { name: 'Booking confirmed' })).toBeVisible()
  expect(calls.find((call) => call.path.endsWith('/confirm-payment'))?.body).toEqual({ guestReservationPaymentMethod: 2, clinicManualPaymentMethodId: 7 })
})

test('a held reservation survives a reload and can be cancelled', async ({ page }) => {
  const calls = await setup(page)
  await reserve(page)
  await page.reload()
  await expect(page.getByText('Hold expires in')).toBeVisible()
  await page.getByRole('button', { name: 'Cancel reservation' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel reservation' }).click()
  await expect(page.getByRole('button', { name: 'Reserve slot' })).toBeVisible()
  expect(calls.some((call) => call.method === 'DELETE' && call.path === '/api/appointments/4021/guest-checkout/Cancel-payment')).toBe(true)
})

test('an expired hold disables payment and offers a new booking', async ({ page }) => {
  await setup(page)
  await reserve(page)
  await page.clock.fastForward('31:00')
  await expect(page.getByText('This reservation expired')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirm payment' })).toHaveCount(0)
})
