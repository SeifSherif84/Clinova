import { useState } from 'react'

const initials = (name: string) => name.replace(/^dr\.?\s+/i, '').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

// Falls back to initials when the doctor has no profile picture or it fails to load.
export default function DoctorAvatar({ name, picture, className = 'size-11' }: { name: string; picture: string | null; className?: string }) {
  const [failed, setFailed] = useState(false)
  return <span className={`${className} grid shrink-0 place-items-center overflow-hidden rounded-xl bg-primary/10 text-sm font-bold text-primary`}>
    {picture && !failed
      ? <img className="size-full object-cover object-top" src={picture} alt="" onError={() => setFailed(true)} />
      : initials(name)}
  </span>
}
