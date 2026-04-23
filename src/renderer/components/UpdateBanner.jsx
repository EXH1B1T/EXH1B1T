import { useState, useEffect } from 'react'
import s from './UpdateBanner.module.css'

export default function UpdateBanner() {
  const [state, setState] = useState(null) // null | 'downloading' | 'ready'
  const [progress, setProgress] = useState(0)
  const [version, setVersion] = useState('')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    window.api?.updater.onProgress((p) => {
      setState('downloading')
      setProgress(p.percent ?? 0)
      setVersion(p.version ?? '')
    })
    window.api?.updater.onReady((info) => {
      setState('ready')
      setVersion(info.version ?? '')
    })
  }, [])

  if (!state || dismissed) return null

  return (
    <div className={`${s.banner} ${state === 'downloading' ? s.downloading : s.ready}`}>
      <div className={s.message}>
        {state === 'downloading' && (
          <>กำลังโหลดอัพเดท <span className={s.version}>v{version}</span>...</>
        )}
        {state === 'ready' && (
          <><strong>อัพเดทพร้อมแล้ว</strong> — v{version}</>
        )}
      </div>

      {state === 'downloading' && (
        <div className={s.progressBar}>
          <div className={s.progressFill} style={{ width: `${progress}%` }} />
        </div>
      )}

      {state === 'ready' && (
        <>
          <button className={s.restartBtn} onClick={() => window.api?.updater.install()}>
            รีสตาร์ท
          </button>
          <button className={s.laterBtn} onClick={() => setDismissed(true)}>
            ทีหลัง
          </button>
        </>
      )}
    </div>
  )
}
