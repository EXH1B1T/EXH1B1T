import s from './DnsStatus.module.css'

const LABELS = {
  idle:      '',
  waiting:   'Waiting for DNS — may take up to 24 hours.',
  verifying: 'Verifying DNS...',
  active:    'DNS verified — domain is live.',
}

export default function DnsStatus({ status }) {
  if (!status || status === 'idle') return null
  return (
    <div className={s.row}>
      <div className={s.dot} data-status={status} />
      <span className={s.label}>{LABELS[status]}</span>
    </div>
  )
}
