import { Languages, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/use-theme'

export default function PreferencesControls({ compact = false }: { compact?: boolean }) {
  const { i18n, t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const isArabic = i18n.resolvedLanguage === 'ar'

  async function toggleLanguage() {
    const language = isArabic ? 'en' : 'ar'
    await i18n.changeLanguage(language)
    localStorage.setItem('clinova.language', language)
  }

  return (
    <div className={`flex shrink-0 items-center ${compact ? 'gap-1 sm:gap-2' : 'gap-2'}`} dir="ltr">
      <Button
        type="button"
        variant="outline"
        size={compact ? 'icon-sm' : 'sm'}
        className="rounded-xl border-border/80 bg-card/60 text-foreground shadow-sm backdrop-blur-md hover:bg-accent"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? t('common.lightTheme') : t('common.darkTheme')}
        title={theme === 'dark' ? t('common.lightTheme') : t('common.darkTheme')}
      >
        {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
      <Button
        type="button"
        variant="outline"
        size={compact ? 'icon-sm' : 'sm'}
        className="gap-2 rounded-xl border-border/80 bg-card/60 px-3 text-foreground shadow-sm backdrop-blur-md hover:bg-accent"
        onClick={toggleLanguage}
        aria-label={isArabic ? t('common.switchToEnglish') : t('common.switchToArabic')}
        title={isArabic ? t('common.switchToEnglish') : t('common.switchToArabic')}
      >
        <Languages className="size-4" />
        {!compact && <span className="text-xs font-bold">{isArabic ? t('common.switchEnglish') : t('common.switchArabic')}</span>}
      </Button>
    </div>
  )
}
