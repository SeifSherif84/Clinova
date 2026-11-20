import { BadgeCheck, CalendarDays, CircleDollarSign, Sparkles, Undo2, UserRound, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const faqTopics = ['appointments', 'payments', 'refunds', 'account', 'platform'] as const
export type FaqTopic = (typeof faqTopics)[number]

interface FaqDef { id: string; topic: FaqTopic; q: string; a: string }

const defs: FaqDef[] = [
  { id: 'bookAppointment', topic: 'appointments', q: 'How do I book an appointment?', a: 'Find a doctor, choose one of the available time slots, and confirm your booking.' },
  { id: 'trackAppointment', topic: 'appointments', q: 'How can I track my appointment?', a: 'Open My Appointments from the top menu. Each visit shows its status and payments, and opening it shows the full details. Updates also appear under the bell icon and on the Notifications page.' },
  { id: 'cancelReschedule', topic: 'appointments', q: 'How do I cancel or reschedule an appointment?', a: 'Open the appointment from My Appointments and use the menu next to its status to cancel or reschedule. An appointment that is waiting for clinic verification can’t be cancelled until the clinic responds.' },
  { id: 'changesNotice', topic: 'appointments', q: 'Will I be told about changes to my appointment?', a: 'Yes. Updates appear under the bell icon and on the Notifications page.' },
  { id: 'whyDeposit', topic: 'payments', q: 'Why do I need to pay a deposit?', a: 'The deposit secures your time slot. After you book, the slot is held for you until the deposit is paid. If it isn’t completed in time, the reservation expires and the slot is released.' },
  { id: 'depositPartOfFee', topic: 'payments', q: 'Is the deposit part of the consultation fee?', a: 'Yes. Your appointment page shows the consultation fee, the deposit, and the remaining balance. The remaining balance is collected at the clinic during your visit.' },
  { id: 'howPayDeposit', topic: 'payments', q: 'How do I pay the deposit?', a: 'Open your appointment and follow the payment options shown there. For a transfer, send the amount to the clinic’s account, upload your receipt, and the clinic will verify it.' },
  { id: 'paymentSupport', topic: 'payments', q: 'How can I contact support about a payment issue?', a: 'Use the contact form on the Help Center page and choose the Payment category. You can follow the conversation under My Support Requests.' },
  { id: 'clinicCancels', topic: 'refunds', q: 'What happens if the clinic cancels my appointment?', a: 'When the clinic or doctor cancels an appointment, you get your full deposit back. You can follow the refund status in the Deposit refund section of your appointment.' },
  { id: 'refundEligible', topic: 'refunds', q: 'When am I eligible for a refund?', a: 'You get a full deposit refund if you cancel within the booking grace period after booking, or at least the full-refund window before your appointment. The exact durations are shown in the cancellation and refund policy on your appointment page.' },
  { id: 'trackRefund', topic: 'refunds', q: 'How can I track my refund?', a: 'Open the appointment and check the Deposit refund section. It shows the refund amount, method, and status, and updates once the refund is processed.' },
  { id: 'updateProfile', topic: 'account', q: 'How do I update my details or photo?', a: 'Open the account menu at the top right and choose My profile.' },
  { id: 'deleteAccount', topic: 'account', q: 'How do I delete my account?', a: 'Open My profile, use the more actions menu next to Edit, and choose Delete account. You will be asked to confirm.' },
  { id: 'findDoctor', topic: 'platform', q: 'How do I find a doctor?', a: 'Open Find a Doctor and search by name, specialty, governorate, or region. Open a doctor to see their clinics, reviews, and available times.' },
  { id: 'leaveReview', topic: 'platform', q: 'How do I leave a review?', a: 'After your appointment is completed, open it from My Appointments and rate your experience. Reviews with a comment are published after admin approval, and you can follow them under My Reviews.' },
]

export const popularIds = ['whyDeposit', 'depositPartOfFee', 'clinicCancels', 'refundEligible', 'trackAppointment', 'paymentSupport']

export function useFaqs() {
  const { t } = useTranslation()
  return defs.map((item) => ({
    id: item.id,
    topic: item.topic,
    q: t(`patientPortal.faqItems.${item.id}.q`, { defaultValue: item.q }),
    a: t(`patientPortal.faqItems.${item.id}.a`, { defaultValue: item.a }),
  }))
}

const topicDefs: Record<FaqTopic, { icon: LucideIcon; title: string; description: string }> = {
  appointments: { icon: CalendarDays, title: 'Appointments', description: 'Booking, changing, tracking and cancelling your visits.' },
  payments: { icon: CircleDollarSign, title: 'Payments & Deposits', description: 'Consultation deposits, payment methods and proof of transfer.' },
  refunds: { icon: Undo2, title: 'Refunds', description: 'Refund eligibility, tracking and the cancellation policy.' },
  account: { icon: UserRound, title: 'Account & Profile', description: 'Your account information and profile questions.' },
  platform: { icon: Sparkles, title: 'Using Clinova', description: 'Finding doctors, reviews and other platform features.' },
}

export function useTopics() {
  const { t } = useTranslation()
  return faqTopics.map((id) => ({
    id,
    icon: topicDefs[id].icon ?? BadgeCheck,
    title: t(`patientPortal.faqTopics.${id}.title`, { defaultValue: topicDefs[id].title }),
    description: t(`patientPortal.faqTopics.${id}.description`, { defaultValue: topicDefs[id].description }),
  }))
}