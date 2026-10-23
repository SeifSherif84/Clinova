import { ApiError } from '@/lib/api'
import type { HeldReservation } from '@/types/guest-reservation'

const storageKey = 'clinova.guest-reservation'
export const egyptianPhonePattern = /^01[0125]\d{8}$/

// The backend checks "today" and "past" in Egypt time, so the calendar does too.
export function egyptToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

export function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// One request per visible month, starting no earlier than today (the API allows at most 31 days).
export function monthRange(month: Date) {
  const today = egyptToday()
  const first = toIsoDate(new Date(month.getFullYear(), month.getMonth(), 1))
  const last = toIsoDate(new Date(month.getFullYear(), month.getMonth() + 1, 0))
  const from = first < today ? today : first
  return from <= last ? { from, to: last } : null
}

export function formatMoney(value: number, language?: string) {
  return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 }).format(value)
}

// Mirrors the backend: deposit = fee x deposit % / 100, rounded to 2 decimals.
export function depositAmount(fee: number, percentage: number) {
  return Math.round(fee * percentage) / 100
}

// The secretary has no clinic yet; pages show a dedicated state instead of a generic error.
export function isNotAssignedError(error: unknown) {
  return error instanceof ApiError && error.status === 400 && /not (assigned|associated) (to|with) any clinic/i.test(error.message)
}

export function readHeldReservation(): HeldReservation | null {
  try {
    const value = sessionStorage.getItem(storageKey)
    return value ? (JSON.parse(value) as HeldReservation) : null
  } catch {
    return null
  }
}

export function storeHeldReservation(reservation: HeldReservation | null) {
  try {
    if (reservation) sessionStorage.setItem(storageKey, JSON.stringify(reservation))
    else sessionStorage.removeItem(storageKey)
  } catch {
    // Storage can be unavailable (private mode); the flow still works without it.
  }
}
