import { Languages, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/use-theme'

const controlStyle =
  'rounded-xl border-border bg-card text-muted-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary'

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
    <div className="flex shrink-0 items-center gap-2" dir="ltr">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={`size-10 ${controlStyle}`}
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? t('common.lightTheme') : t('common.darkTheme')}
        title={theme === 'dark' ? t('common.lightTheme') : t('common.darkTheme')}
      >
        {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </Button>
      <Button
        type="button"
        variant="outline"
        size={compact ? 'icon' : 'sm'}
        className={`h-10 ${compact ? 'w-10' : 'gap-2 px-3.5'} ${controlStyle}`}
        onClick={toggleLanguage}
        aria-label={isArabic ? t('common.switchToEnglish') : t('common.switchToArabic')}
        title={isArabic ? t('common.switchToEnglish') : t('common.switchToArabic')}
      >
        <Languages className="size-5" />
        {!compact && <span className="text-xs font-bold">{isArabic ? t('common.switchEnglish') : t('common.switchArabic')}</span>}
      </Button>
    </div>
  )
}