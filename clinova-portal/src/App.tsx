import { RouterProvider } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/use-auth'
import { router } from '@/router'
import './App.css'

export default function App() {
  const auth = useAuth()
  const { i18n, t } = useTranslation()

  useEffect(() => {
    const language = i18n.resolvedLanguage === 'ar' ? 'ar' : 'en'
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    document.title = t('common.appTitle')
  }, [i18n.resolvedLanguage, t])

  return <RouterProvider router={router} context={{ auth }} />
}
