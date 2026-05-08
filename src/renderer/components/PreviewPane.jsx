import { useEffect, useRef } from 'react'
import s from './PreviewPane.module.css'

export default function PreviewPane({ page, albumSlug, device = 'desktop', rebuildKey }) {
  const webviewRef = useRef(null)

  // Prevent accidental navigation — preview is read-only.
  // Inject a click interceptor after every page load so links do nothing.
  useEffect(() => {
    const wv = webviewRef.current
    if (!wv) return
    const injectBlocker = () => {
      wv.executeJavaScript(`
        document.addEventListener('click', function(e) {
          var a = e.target.closest('a');
          if (a) { e.preventDefault(); e.stopPropagation(); }
        }, true);
      `).catch(() => {})
    }
    wv.addEventListener('dom-ready', injectBlocker)
    return () => wv.removeEventListener('dom-ready', injectBlocker)
  }, [])

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
