import { useTranslation } from 'react-i18next'

export default function MedicalIllustration() {
  const { t } = useTranslation()

  return (
    <svg className="relative z-10 w-full max-w-xl overflow-visible" viewBox="0 0 620 540" role="img" aria-label={t('illustration.label')}>
      <defs>
        <linearGradient id="orb" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="var(--primary)" />
          <stop offset="1" stopColor="var(--ring)" />
        </linearGradient>
        <linearGradient id="card" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="var(--card)" stopOpacity=".96" />
          <stop offset="1" stopColor="var(--background)" stopOpacity=".98" />
        </linearGradient>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="22" stdDeviation="22" floodColor="var(--foreground)" floodOpacity=".16" />
        </filter>
      </defs>

      <path d="M91 353c-45-86-20-205 59-270 82-67 204-58 281 11 87 78 91 221 22 309-79 102-293 70-362-50Z" fill="url(#orb)" opacity=".2" />
      <circle cx="469" cy="120" r="52" fill="none" stroke="var(--warm)" strokeWidth="2" opacity=".6" />
      <circle cx="469" cy="120" r="35" fill="var(--warm)" opacity=".12" />
      <path d="M71 163c39-19 79-16 113 8" fill="none" stroke="var(--primary)" strokeLinecap="round" strokeWidth="2" strokeDasharray="5 12" opacity=".72" />

      <g filter="url(#shadow)">
        <rect x="111" y="99" width="370" height="322" rx="38" fill="url(#card)" stroke="var(--primary)" strokeOpacity=".25" />
        <rect x="141" y="132" width="179" height="19" rx="9.5" fill="var(--primary)" opacity=".16" />
        <rect x="141" y="164" width="114" height="10" rx="5" fill="var(--foreground)" opacity=".16" />

        <circle cx="396" cy="158" r="38" fill="var(--secondary)" />
        <path d="M390 141h12v11h11v12h-11v11h-12v-11h-11v-12h11v-11Z" fill="var(--primary)" />

        <rect x="141" y="216" width="310" height="76" rx="19" fill="var(--secondary)" />
        <circle cx="176" cy="254" r="18" fill="var(--warm)" opacity=".92" />
        <path d="M168 254h16m-8-8v16" stroke="var(--warm-foreground)" strokeLinecap="round" strokeWidth="3" />
        <rect x="209" y="239" width="114" height="10" rx="5" fill="var(--foreground)" opacity=".75" />
        <rect x="209" y="258" width="72" height="8" rx="4" fill="var(--foreground)" opacity=".24" />
        <path d="m407 245 8 8-8 8" fill="none" stroke="var(--primary)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />

        <path d="M141 339h50l14-29 22 64 25-79 22 44h29l13-17 17 17h118" fill="none" stroke="var(--primary)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
      </g>

      <g className="animate-[bounce_5s_ease-in-out_infinite]">
        <rect x="64" y="290" width="94" height="94" rx="28" fill="var(--warm)" />
        <path d="M103 311h16v22h22v16h-22v22h-16v-22H81v-16h22v-22Z" fill="var(--warm-foreground)" />
      </g>
      <g className="animate-[bounce_5s_ease-in-out_-2.5s_infinite]">
        <rect x="422" y="362" width="116" height="76" rx="24" fill="var(--card)" stroke="var(--border)" />
        <circle cx="451" cy="400" r="12" fill="var(--primary)" />
        <path d="m446 400 4 4 7-9" fill="none" stroke="var(--primary-foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        <rect x="472" y="389" width="43" height="8" rx="4" fill="var(--foreground)" opacity=".72" />
        <rect x="472" y="404" width="28" height="6" rx="3" fill="var(--foreground)" opacity=".28" />
      </g>
    </svg>
  )
}
