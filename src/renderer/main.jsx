import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import Onboarding from './pages/Onboarding'
import Editor from './pages/Editor'
import Settings from './pages/Settings'

function App() {
  // 'loading' | 'onboarding' | 'editor' | 'settings'
  const [screen, setScreen] = useState('loading')

  useEffect(() => {
    window.api?.auth.getUser().then((user) => {
      setScreen(user ? 'editor' : 'onboarding')
    }).catch(() => setScreen('onboarding'))
  }, [])

  if (screen === 'loading') {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          border: '1.5px solid var(--border)', borderTopColor: 'var(--text-2)',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    )
  }

  if (screen === 'onboarding') {
    return <Onboarding onDone={() => setScreen('editor')} />
  }

  if (screen === 'settings') {
    return <Settings onBack={() => setScreen('editor')} />
  }

  return <Editor onSettings={() => setScreen('settings')} />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
