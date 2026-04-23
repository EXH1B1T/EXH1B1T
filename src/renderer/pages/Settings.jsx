import { useState, useEffect, useCallback, useRef } from 'react'
import s from './Settings.module.css'
import Icon from '../components/Icon'
import Field from '../components/Field'
import DnsStatus from '../components/DnsStatus'
import ThemePicker from '../components/ThemePicker'
import Logo from '../components/Logo'

const TABS = [
  { key: 'site',      label: 'Site Info' },
  { key: 'theme',     label: 'Theme' },
  { key: 'domain',    label: 'Domain' },
  { key: 'analytics', label: 'Analytics' },
]

const DNS_IPS = ['185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153']

export default function Settings({ onBack }) {
  const [tab, setTab]       = useState('site')
  const [site, setSite]     = useState(null)
  const [user, setUser]     = useState(null)
  const [saving, setSaving] = useState(false)
  const saveTimer           = useRef(null)

  useEffect(() => {
    Promise.all([
      window.api?.site.get(),
      window.api?.auth.getUser(),
    ]).then(([si, u]) => { setSite(si); setUser(u) })
    return () => clearTimeout(saveTimer.current)
  }, [])

  const patch = useCallback((update) => {
    setSite((prev) => {
      const next = { ...prev, ...update }
      setSaving(true)
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        await window.api?.site.save(next)
        setSaving(false)
      }, 600)
      return next
    })
  }, [])

  return (
    <div className={s.container}>
      <div className={s.header}>
        <button className={s.backBtn} onClick={onBack}>
          <Icon name="back" size={14} />
        </button>
        <div className={s.title}>Settings</div>
        <div className={s.saving}>{saving ? 'Saving...' : 'Auto-saved'}</div>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Tab rail */}
        <div className={s.tabs}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              className={`${s.tab} ${tab === key ? s.activeTab : ''}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={s.content}>
          {tab === 'site'      && <SiteTab site={site} patch={patch} />}
          {tab === 'theme'     && <ThemePicker />}
          {tab === 'domain'    && <DomainTab site={site} user={user} patch={patch} />}
          {tab === 'analytics' && <AnalyticsTab site={site} patch={patch} />}
        </div>
      </div>
    </div>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

function Section({ title, desc, children }) {
  return (
    <div className={s.section}>
      <div className={s.sectionTitle}>{title}</div>
      {desc && <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16, lineHeight: 1.55 }}>{desc}</div>}
      {!desc && <div style={{ height: 12 }} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  )
}

function SiteTab({ site, patch }) {
  if (!site) return null
  return (
    <>
      <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 28, letterSpacing: -0.3 }}>Site Info</div>
      <Section title="Website" desc="Basic info shown in the browser tab and search results">
        <Field label="Title">
          <input defaultValue={site.title ?? ''} onChange={(e) => patch({ title: e.target.value })} />
        </Field>
        <Field label="Description" hint="Appears in meta tags and social share previews">
          <textarea rows={2} defaultValue={site.description ?? ''} onChange={(e) => patch({ description: e.target.value })} />
        </Field>
        <Field label="Language">
          <select className={s.select} defaultValue={site.lang ?? 'en'} onChange={(e) => patch({ lang: e.target.value })}>
            <option value="en">English</option>
            <option value="th">Thai</option>
            <option value="ja">日本語</option>
          </select>
        </Field>
      </Section>

      <Section title="Owner" desc="Personal info shown on the About page">
        <Field label="Name">
          <input defaultValue={site.owner?.name ?? ''} onChange={(e) => patch({ owner: { ...site.owner, name: e.target.value } })} />
        </Field>
        <Field label="Bio">
          <textarea rows={3} defaultValue={site.owner?.bio ?? ''} onChange={(e) => patch({ owner: { ...site.owner, bio: e.target.value } })} />
        </Field>
      </Section>

      <Section title="Social" desc="Shown as links on your site">
        <Field label="Instagram">
          <input defaultValue={site.social?.instagram ?? ''} placeholder="@username" onChange={(e) => patch({ social: { ...site.social, instagram: e.target.value } })} />
        </Field>
        <Field label="Facebook">
          <input defaultValue={site.social?.facebook ?? ''} placeholder="username" onChange={(e) => patch({ social: { ...site.social, facebook: e.target.value } })} />
        </Field>
        <Field label="Email">
          <input defaultValue={site.social?.email ?? ''} placeholder="hello@example.com" onChange={(e) => patch({ social: { ...site.social, email: e.target.value } })} />
        </Field>
      </Section>
    </>
  )
}

function DomainTab({ site, user, patch }) {
  const [custom, setCustom]   = useState(site?.customDomain ?? '')
  const [dnsStatus, setDns]   = useState('idle')
  const [copied, setCopied]   = useState(false)

  const handleCustom = (val) => {
    setCustom(val)
    patch({ customDomain: val || null })
    setDns(val ? 'waiting' : 'idle')
    if (val) {
      window.api?.github.checkDns(val).then((r) => setDns(r?.status ?? 'waiting'))
    }
  }

  const copy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  const currentUrl = user ? `${user.login}.github.io` : ''

  return (
    <>
      <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 28, letterSpacing: -0.3 }}>Domain</div>

      <Section title="Current URL" desc="The default URL GitHub Pages gives you — ready to use">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6 }}>
          <Icon name="cloud" size={14} color="var(--text-2)" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, flex: 1 }}>{currentUrl}</span>
          <button className={s.copyBtn} onClick={() => window.open(`https://${currentUrl}`)}>
            <Icon name="external" size={12} /> Open
          </button>
        </div>
      </Section>

      <Section title="Custom Domain" desc="Use your own domain, e.g. yourname.photo — configure DNS as shown below">
        <Field label="Domain">
          <input value={custom} onChange={(e) => handleCustom(e.target.value)} placeholder="yourname.photo" />
        </Field>
        <DnsStatus status={dnsStatus} />
      </Section>

      <Section title="DNS Setup" desc="Add these A records at your DNS provider (Cloudflare, Namecheap, etc.)">
        <div className={s.dnsGuide}>
          {DNS_IPS.map((ip, i) => (
            <div key={ip} className={s.ipRow}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', width: 40, fontFamily: 'var(--font-mono)' }}>A</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, flex: 1 }}>{ip}</div>
              <button className={s.copyBtn} onClick={() => copy(ip)}>
                {copied
                  ? <><Icon name="check" size={11} color="var(--success)" /> Copied</>
                  : <><Icon name="copy" size={11} /> Copy</>}
              </button>
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}

function AnalyticsTab({ site, patch }) {
  return (
    <>
      <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 28, letterSpacing: -0.3 }}>Analytics</div>

      <Section title="Google Analytics" desc="Add your Measurement ID to start collecting visitor data">
        <Field label="Measurement ID" hint="Find it at analytics.google.com — starts with G-">
          <input
            style={{ fontFamily: 'var(--font-mono)' }}
            defaultValue={site?.seo?.googleAnalyticsId ?? ''}
            placeholder="G-XXXXXXXXXX"
            onChange={(e) => patch({ seo: { ...site?.seo, googleAnalyticsId: e.target.value } })}
          />
        </Field>
      </Section>

      <Section title="Favicon" desc="The icon shown in the browser tab — PNG 512×512 recommended">
        <Field label="Favicon URL">
          <input
            style={{ fontFamily: 'var(--font-mono)' }}
            defaultValue={site?.seo?.faviconUrl ?? ''}
            placeholder="https://..."
            onChange={(e) => patch({ seo: { ...site?.seo, faviconUrl: e.target.value } })}
          />
        </Field>
      </Section>

      <div style={{
        padding: '14px 16px', background: 'var(--bg-2)', border: '1px solid var(--border)',
        borderRadius: 6, maxWidth: 640, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6,
        display: 'flex', gap: 10,
      }}>
        <div style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>NOTE</div>
        <div><Logo size={11} /> never stores any data about your site or visitors. Everything goes straight to Google Analytics.</div>
      </div>
    </>
  )
}
