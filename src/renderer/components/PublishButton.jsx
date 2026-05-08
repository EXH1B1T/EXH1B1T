import { useState, useEffect, useRef } from 'react'
import s from './PublishButton.module.css'
import Icon from './Icon'
import Spinner from './Spinner'
import Btn from './Btn'

const STEPS = [
  { key: 'loading',   label: 'Preparing files' },
  { key: 'images',    label: 'Optimizing images' },
  { key: 'uploading', label: 'Uploading to GitHub' },
  { key: 'building',  label: 'Building site' },
  { key: 'seo',       label: 'Generating sitemap' },
  { key: 'pushing',   label: 'Deploying to Pages' },
]

export default function PublishButton({ siteUrl }) {
  const [modalState, setModalState] = useState(null) // null | 'publishing' | 'success' | 'error'
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [propagateSec, setPropagateSec] = useState(0)
  const propagateTimer = useRef(null)

  const startPublish = async () => {
    setModalState('publishing')
    setProgress(0)
    setCurrentStep('loading')

    window.api?.publish.onProgress(({ step, percent }) => {
      setCurrentStep(step)
      setProgress(percent ?? 0)
    })

    const result = await window.api?.publish.start()
    window.api?.publish.offProgress()

    if (result?.ok) {
      setModalState('success')
      setPropagateSec(0)
      propagateTimer.current = setInterval(() => {
        setPropagateSec((n) => n + 1)
      }, 1000)
    } else {
      setErrorMsg(result?.error ?? 'Something went wrong.')
      setModalState('error')
    }
  }

  const close = () => {
    setModalState(null)
    setProgress(0)
    setCurrentStep('')
    clearInterval(propagateTimer.current)
    setPropagateSec(0)
  }

  useEffect(() => () => clearInterval(propagateTimer.current), [])

  const stepIdx = STEPS.findIndex((s) => s.key === currentStep)

  return (
    <>
      <button className={s.publishBtn} onClick={startPublish}>
        Publish <Icon name="arrow" size={13} color="#0a0a0a" style={{ transform: 'rotate(-90deg)' }} />
      </button>

      {modalState && (
        <div className={s.overlay} onClick={modalState !== 'publishing' ? close : undefined}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>

            {modalState === 'publishing' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
                  <div className={s.modalTitle}>Publishing</div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>
                    {Math.floor(progress)}%
                  </span>
                </div>
                <div className={s.progressBar}>
                  <div className={s.progressFill} style={{ width: `${progress}%` }} />
                </div>
                <div className={s.steps}>
                  {STEPS.map((step, i) => {
                    const done   = i < stepIdx
                    const active = i === stepIdx
                    return (
                      <div key={step.key} className={`${s.stepItem} ${done ? s.done : ''} ${active ? s.active : ''}`}>
                        {done   ? <Icon name="check" size={12} color="var(--success)" />
                         : active ? <Spinner size={11} />
                         : <div className={s.stepDot} />}
                        <span>{step.label}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {modalState === 'success' && (() => {
              const PROPAGATE_SECS = 120  // assume live after ~2 min
              const pct     = Math.min(100, Math.round((propagateSec / PROPAGATE_SECS) * 100))
              const isLive  = pct >= 100
              const minLeft = Math.max(0, Math.ceil((PROPAGATE_SECS - propagateSec) / 60))
              return (
                <div className={s.success}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
                  }}>
                    <Icon name="check" size={20} color="var(--accent)" />
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                    Published!
                  </div>

                  {/* Propagation status */}
                  <div style={{ width: '100%', marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>
                      <span>GitHub Pages propagating…</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: isLive ? 'var(--success)' : 'var(--text-3)' }}>
                        {isLive ? 'should be live' : `~${minLeft} min left`}
                      </span>
                    </div>
                    <div style={{ height: 3, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 99,
                        width: `${pct}%`,
                        background: isLive ? 'var(--success)' : 'var(--accent)',
                        transition: 'width 1s linear',
                      }} />
                    </div>
                  </div>

                  <div className={s.liveUrl}>
                    <Icon name="cloud" size={14} color="var(--text-2)" />
                    <span style={{ flex: 1 }}>{siteUrl}</span>
                    <span style={{
                      fontSize: 10.5, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: isLive ? 'var(--success)' : 'var(--text-3)',
                    }}>
                      {isLive ? 'LIVE' : 'DEPLOYING'}
                    </span>
                  </div>

                  <div className={s.message} style={{ marginTop: 10 }}>
                    If the site looks the same after a few minutes, do a hard refresh in your browser (⌘⇧R).
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    <Btn variant="primary" full onClick={() => window.open(siteUrl)}>
                      <Icon name="external" size={13} color="#0a0a0a" /> Open site
                    </Btn>
                    <Btn variant="secondary" onClick={close}>Close</Btn>
                  </div>
                </div>
              )
            })()}

            {modalState === 'error' && (
              <>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'rgba(255,77,77,.1)', border: '1px solid var(--danger)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
                }}>
                  <Icon name="close" size={20} color="var(--danger)" />
                </div>
                <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>Publish failed</div>
                <div className={s.message}>{errorMsg}</div>
                <div className={s.errorBox}>ERR · check your internet connection and try again</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn variant="primary" full onClick={startPublish}>Try again</Btn>
                  <Btn variant="secondary" onClick={close}>Close</Btn>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  )
}
