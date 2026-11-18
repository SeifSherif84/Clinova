import { statusTone, toneClass } from '@/lib/patient-appointments'

// The label is already translated by the caller; the raw backend status only picks the tone.
export default function PatientStatusPill({ status, label, large = false }: { status: string | null | undefined; label: string; large?: boolean }) {
  return <span className={`inline-flex shrink-0 items-center rounded-full border font-bold whitespace-nowrap ${large ? 'px-3.5 py-1.5 text-[13px]' : 'px-2.5 py-1 text-xs'} ${toneClass[statusTone(status)]}`}>
    {label}
  </span>
}