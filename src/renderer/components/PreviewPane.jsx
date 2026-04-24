import { useEffect, useRef } from 'react'
import s from './PreviewPane.module.css'

export default function PreviewPane({ page, albumSlug, device = 'desktop', rebuildKey }) {
  const webviewRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    window.api?.preview.build().then(async (result) => {
      if (!result?.ok || cancelled) return
      const url = await window.api.preview.getUrl(page, albumSlug)
      if (url && webviewRef.current) {
        webviewRef.current.src = url
      }
    })
    return () => { cancelled = true }
  }, [page, albumSlug, rebuildKey])

  const isMobile = device === 'mobile'

  return (
    <div className={s.container}>
      <div className={isMobile ? s.mobileFrame : s.desktopFrame}>
        {/* eslint-disable-next-line react/no-unknown-property */}
        <webview
          ref={webviewRef}
          className={s.webview}
          disablewebsecurity="true"
          partition="persist:preview"
        />
      </div>
    </div>
  )
}
