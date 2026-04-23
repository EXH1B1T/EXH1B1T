import { useState, useEffect, useRef } from 'react'
import s from './Onboarding.module.css'
import Logo from '../components/Logo'
import Btn from '../components/Btn'
import Icon from '../components/Icon'
import Spinner from '../components/Spinner'


export default function Onboarding({ onDone }) {
  const [step, setStep]       = useState('login')
  const [codeData, setCodeData] = useState(null) // { user_code, verification_uri }
  const [error, setError]     = useState('')
  const timerRef              = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  // ── Step: login ──
  const handleLogin = async () => {
    setError('')

    // Step 1: get device code immediately and show it.
    const codeResult = await window.api?.auth.requestDeviceCode()
    if (!codeResult?.ok) {
      setError(codeResult?.error ?? 'Could not connect to GitHub.')
      return
    }
    setCodeData({ user_code: codeResult.user_code, verification_uri: codeResult.verification_uri })
    setStep('code')

    // Step 2: poll in background until user approves.
    const pollResult = await window.api?.auth.pollToken()
    if (!pollResult?.ok) {
      setError(pollResult?.error ?? 'Login failed.')
      setStep('login')
      return
    }

    await handleCheckRepo()
  }

  const handleCheckRepo = async () => {
    setStep('checking')
    const repo = await window.api?.github.checkRepo()
    if (!repo?.ok) { setError('Failed to check GitHub.'); setStep('login'); return }

    if (!repo.repoExists) {
      await window.api.github.setupRepo()
      setStep('done')
      timerRef.current = setTimeout(onDone, 1000)
    } else if (repo.hasData) {
      setStep('restore')
    } else {
      setStep('conflict')
    }
  }

  const handleRestore = async () => {
    await window.api?.github.restoreFromRepo()
    setStep('done')
    timerRef.current = setTimeout(onDone, 1000)
  }

  const handleFresh = async () => {
    await window.api?.github.setupRepo()
    setStep('done')
    timerRef.current = setTimeout(onDone, 1000)
  }

  const handleOverwrite = async () => {
    await window.api?.github.setupRepo()
    setStep('done')
    timerRef.current = setTimeout(onDone, 1000)
  }

  return (
    <div className={s.container}>
      <div className={s.titlebar} />

      <div className={s.card}>
        <div style={{ width: 420, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className={s.logo}>
            <Logo size={38} />
          </div>
          <div className={s.subtitle}>Your portfolio. Free forever.</div>

          <div style={{ width: '100%', minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {step === 'login'    && <LoginState onLogin={handleLogin} error={error} />}
            {step === 'code'     && <CodeState code={codeData?.user_code} uri={codeData?.verification_uri} />}
            {step === 'checking' && <CheckingState />}
            {step === 'restore'  && <RestoreState onKeep={handleRestore} onReset={handleFresh} />}
            {step === 'conflict' && <ConflictState onCancel={() => setStep('login')} onOverwrite={handleOverwrite} />}
            {step === 'done'     && <DoneState />}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-states ────────────────────────────────────────────────────────────────

function LoginState({ onLogin, error }) {
  return (
    <>
      <Btn variant="primary" onClick={onLogin} full size="lg">
        <Icon name="github" size={15} color="#0a0a0a" /> Login with GitHub
      </Btn>
      <div className={s.hint}>
        No GitHub account?{' '}
        <a href="https://github.com/join" target="_blank" rel="noreferrer"
          style={{ color: 'var(--text-2)', textDecoration: 'underline', textDecorationColor: 'var(--border-2)' }}>
          Sign up free
        </a>
      </div>
      {error && <div className={s.error}>{error}</div>}
      <div style={{
        marginTop: 26, padding: '14px 16px',
        background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6, width: '100%',
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{
            width: 20, height: 20, borderRadius: 4, background: 'var(--bg-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
          }}>
            <Icon name="cloud" size={12} color="var(--text-2)" />
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 3 }}>Hosted on GitHub Pages</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.55 }}>
              Your site is hosted free at username.github.io — no monthly fees.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function CodeState({ code, uri }) {
  return (
    <>
      <div style={{ fontSize: 12, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>
        Enter this code on github.com/login/device
      </div>
      <div className={s.code}>{code ?? '----'}</div>
      <div className={s.spinner}>
        <Spinner size={12} /> Waiting for confirmation...
      </div>
      {uri && (
        <a href={uri} target="_blank" rel="noreferrer"
          style={{ fontSize: 11.5, color: 'var(--text-3)', textDecoration: 'underline', marginTop: 8 }}>
          Open GitHub page
        </a>
      )}
    </>
  )
}

function CheckingState() {
  const lines = [
    { label: 'Authenticated', done: true },
    { label: 'Fetching user profile', done: true },
    { label: 'Scanning for existing repo', done: false, active: true },
  ]
  return (
    <div style={{
      width: '100%', padding: '20px 24px',
      background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8,
    }}>
      <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
        Setting up your portfolio
      </div>
      {lines.map((l, i) => (
        <div key={i} className={s.waiting}>
          {l.done
            ? <Icon name="check" size={14} color="var(--success)" />
            : l.active ? <Spinner size={12} />
            : <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid var(--border-2)' }} />}
          <span style={{ color: l.done || l.active ? 'var(--text)' : 'var(--text-3)' }}>{l.label}</span>
        </div>
      ))}
    </div>
  )
}

function RestoreState({ onKeep, onReset }) {
  return (
    <div style={{ width: '100%' }}>
      <div className={s.title}>Found your existing site</div>
      <div className={s.desc}>
        Would you like to restore your albums and settings from GitHub?
      </div>
      <div className={s.btnGroup}>
        <Btn variant="primary" onClick={onKeep} full>
          <Icon name="check" size={14} color="#0a0a0a" /> Restore from cloud
        </Btn>
        <Btn variant="secondary" onClick={onReset} full>Start fresh (delete everything)</Btn>
      </div>
    </div>
  )
}

function ConflictState({ onCancel, onOverwrite }) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontSize: 15, color: 'var(--danger)', fontWeight: 500, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 6, height: 6, background: 'var(--danger)', borderRadius: '50%' }} />
        This repo is already in use
      </div>
      <div className={s.desc}>
        A site not built with <Logo size={11} /> already exists here. Overwriting will delete all existing files.
      </div>
      <div className={s.btnGroup}>
        <Btn variant="danger" onClick={onOverwrite} full>Overwrite and start fresh</Btn>
        <Btn variant="ghost" onClick={onCancel} full>Cancel</Btn>
      </div>
    </div>
  )
}

function DoneState() {
  return (
    <>
      <div className={s.checkmark}>
        <Icon name="check" size={24} color="var(--accent)" />
      </div>
      <div className={s.title}>Ready</div>
      <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 2 }}>Opening editor...</div>
    </>
  )
}
