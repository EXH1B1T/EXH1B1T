import s from './Toggle.module.css'

export default function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`${s.toggle} ${checked ? s.on : ''} ${disabled ? s.disabled : ''}`}
      onClick={() => onChange?.(!checked)}
    />
  )
}
