import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const initials = (name: string) => name.replace(/^dr\.?\s+/i, '').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

// Falls back to initials when the doctor has no profile picture or it fails to load.
export default function DoctorAvatar({ name, picture, className = 'size-11' }: { name: string; picture: string | null; className?: string }) {
  return <Avatar className={`${className} rounded-xl after:rounded-xl`}>
    {picture && <AvatarImage className="rounded-xl" src={picture} alt="" />}
    <AvatarFallback className="rounded-xl">{initials(name)}</AvatarFallback>
  </Avatar>
}
