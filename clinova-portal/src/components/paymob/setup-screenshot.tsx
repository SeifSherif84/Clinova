import { Image, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { paymobButtonClass } from './setup-section'

// Only supplied, reviewed screenshots belong here. No fabricated dashboard imagery.
export function SetupScreenshot({ section, src, source = 'Paymob' }: { section: string; src?: string; source?: 'Paymob' | 'Clinova' }) {
  const { t } = useTranslation()
  const [fullSize, setFullSize] = useState(false)
  const [failed, setFailed] = useState(false)
  const hasImage = Boolean(src) && !failed
  const title = t(source === 'Clinova' ? 'paymob.clinovaScreenshot' : 'paymob.screenshot', { section })
  const caption = t(source === 'Clinova' ? 'paymob.clinovaScreenshotCaption' : 'paymob.screenshotCaption', { section })
  const placeholder = <div className="flex min-h-40 flex-col items-center justify-center gap-3 bg-muted/40 p-5 text-center">
    <Image className="size-7 text-muted-foreground" aria-hidden="true" />
    <p className="text-sm font-bold">{title}</p>
    <p className="text-xs text-muted-foreground">{t('paymob.screenshotPending')}</p>
  </div>
  return <figure className="min-w-0">
    <Dialog onOpenChange={() => setFullSize(false)}>
      <div className="overflow-hidden rounded-xl border border-border">
        {hasImage ? <img src={src} alt={title} onError={() => setFailed(true)} className="h-auto w-full" /> : placeholder}
        <DialogTrigger render={<Button variant="ghost" className={paymobButtonClass + ' h-auto min-h-11 w-full whitespace-normal rounded-none px-3 py-2'} />} aria-label={t(hasImage ? 'paymob.zoomImageLabel' : 'paymob.zoomLabel', { section })}>
          <ZoomIn className="size-4" />{t(hasImage ? 'paymob.zoomImage' : 'paymob.zoom')}
        </DialogTrigger>
      </div>
      <figcaption className="mt-2 text-xs leading-6 text-muted-foreground">{caption}</figcaption>
      <DialogContent showCloseButton={false} className="max-h-[85svh] overflow-y-auto rounded-2xl sm:max-w-3xl motion-reduce:animate-none">
        <DialogHeader>
          <DialogTitle className="font-sans text-xl font-bold normal-case tracking-normal">{title}</DialogTitle>
          <DialogDescription>{hasImage ? caption : failed ? t('paymob.imageUnavailable') : t(source === 'Clinova' ? 'paymob.clinovaScreenshotDescription' : 'paymob.screenshotDescription')}</DialogDescription>
        </DialogHeader>
        {hasImage ? <><Button type="button" variant="outline" onClick={() => setFullSize(!fullSize)} aria-pressed={fullSize} className={paymobButtonClass}>{fullSize ? <ZoomOut /> : <ZoomIn />}{t(fullSize ? 'paymob.imageFit' : 'paymob.imageActual')}</Button><div role="region" aria-label={title} tabIndex={0} className="max-h-[55svh] overflow-auto rounded-xl focus-visible:outline-2 focus-visible:outline-ring"><img src={src} alt={title} onError={() => setFailed(true)} className={fullSize ? 'h-auto max-w-none' : 'h-auto w-full'} /></div></> : placeholder}
        <DialogClose render={<Button variant="outline" className={paymobButtonClass} />}><X className="size-4" />{t('paymob.close')}</DialogClose>
      </DialogContent>
    </Dialog>
  </figure>
}
