import type { UseQueryResult } from '@tanstack/react-query'
import { CalendarCheck2, CircleCheckBig, Stethoscope } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatEgp, percentOf } from '@/lib/analytics'
import type { DoctorPerformance } from '@/types/analytics'
import { AnalyticsSection, QueryBoundary } from './analytics-section'

// Titles such as "Dr." are skipped so initials come from the actual name.
const TITLE_PREFIX = /^(dr\.?|د\.?|دكتور|دكتورة)$/i
const RING_RADIUS = 21
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

/** Avatar with a progress ring that shows the collected share at a glance. */
function ShareRing({ initials, share, active }: { initials: string; share: number; active: boolean }) {
  const clamped = Math.min(100, Math.max(0, share))
  return (
    <div className="relative grid size-14 shrink-0 place-items-center" aria-hidden="true">
      <svg viewBox="0 0 48 48" className="absolute inset-0 size-full -rotate-90 rtl:scale-x-[-1]">
        <circle cx="24" cy="24" r={RING_RADIUS} fill="none" strokeWidth="3.5" className="stroke-muted" />
        {active && (
          <circle
            cx="24"
            cy="24"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - clamped / 100)}
          />
        )}
      </svg>
      <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">{initials}</span>
    </div>
  )
}

function AmountTile({ dot, label, value, tone }: { dot: string; label: string; value: string; tone: string }) {
  return (
    <div className="grid min-w-0 gap-1 rounded-xl bg-muted/40 px-3.5 py-3 transition-colors duration-200 group-hover:bg-muted/60">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <span className={`size-2 shrink-0 rounded-full ${dot}`} />
        <span className="truncate">{label}</span>
      </span>
      <strong className={`break-words text-lg font-bold leading-tight tabular-nums ${tone}`}>{value}</strong>
    </div>
  )
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-[13px] font-semibold text-muted-foreground">
      <span className="[&>svg]:size-4 [&>svg]:text-primary">{icon}</span>
      {label}
      <b className="text-foreground tabular-nums">{value}</b>
    </span>
  )
}

export function DoctorsSection({
  query,
  language,
  open,
  onToggle,
}: {
  query: UseQueryResult<DoctorPerformance, Error>
  language?: string
  open: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  const money = (value: number) => formatEgp(value, language)

  return (
    <AnalyticsSection
  icon={<Stethoscope />}
  title={t('analytics.doctors.title')}
  description={t('analytics.doctors.description')}
  busy={query.isFetching}
  collapsible
  open={open}
  onToggle={onToggle}
  panelId="analytics-panel-doctors"
>
      <QueryBoundary query={query}>
        {(data) => {
          if (data.doctors.length === 0) {
            return (
              <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
                <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary [&>svg]:size-6">
                  <Stethoscope />
                </span>
                <p className="max-w-sm text-sm font-semibold text-muted-foreground">{t('analytics.doctors.empty')}</p>
              </div>
            )
          }

          // Bars are scaled to the biggest doctor so rows can be compared at a glance.
          const maxTotal = Math.max(0, ...data.doctors.map((doctor) => doctor.collectedAmount + doctor.expectedAmount))

          return (
              <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {data.doctors.map((doctor) => {
                  const total = doctor.collectedAmount + doctor.expectedAmount
                  const share = percentOf(doctor.collectedAmount, total)
                  const width = maxTotal > 0 ? (total / maxTotal) * 100 : 0
                  const initials = doctor.doctorName.split(' ').filter((part) => part && !TITLE_PREFIX.test(part)).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
                  return (
                    <li
                      key={doctor.doctorId}
                      className="group flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md focus-within:border-primary/40 sm:p-5 motion-safe:hover:-translate-y-0.5"
                    >
                      <div className="flex min-w-0 items-center gap-3.5">
                        <ShareRing initials={initials} share={share} active={total > 0} />
                        <div className="grid min-w-0 flex-1 gap-1.5">
                          <strong className="truncate text-base font-bold" title={doctor.doctorName}>{doctor.doctorName}</strong>
                          <div className="flex flex-nowrap gap-1.5">
                            <StatPill icon={<CalendarCheck2 />} label={`${t('analytics.doctors.confirmed')}:`} value={doctor.confirmedAppointments} />
                            <StatPill icon={<CircleCheckBig />} label={`${t('analytics.doctors.completed')}:`} value={doctor.completedAppointments} />
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        {/* Label row always reserves its height so the bar stays on the same line in every card. */}
                        <span className="min-h-4 text-xs font-bold leading-4 text-muted-foreground">
                          {total > 0 ? t('analytics.doctors.collectedShare', { percent: share }) : null}
                        </span>
                        <div className="h-2.5 rounded-full bg-muted/60" aria-hidden="true">
                          {total > 0 && (
                            <div className="flex h-full overflow-hidden rounded-full transition-all duration-500 motion-reduce:transition-none" style={{ width: `${width}%` }}>
                              <span className="h-full bg-primary" style={{ width: `${share}%` }} />
                              <span className="h-full flex-1 bg-warm/40" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-auto grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                        <AmountTile dot="bg-primary" label={t('analytics.doctors.collected')} value={money(doctor.collectedAmount)} tone="text-primary" />
                        <AmountTile dot="bg-warm" label={t('analytics.doctors.expected')} value={money(doctor.expectedAmount)} tone="text-warm" />
                      </div>
                    </li>
                  )
                })}
              </ul>
          )
        }}
      </QueryBoundary>
    </AnalyticsSection>
  )
}