import { createPortal } from 'react-dom'
import { useEffect } from 'react'
import { X, Briefcase, Rocket, Star, Heart, Zap, Globe, Palette, ShoppingBag } from 'lucide-react'
import { initials } from '../lib/constants'

// Modal centrado en desktop, bottom-sheet en móvil
export function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm anim-fade" onClick={onClose} />
      <div
        className={`relative surface w-full sm:w-auto sm:min-w-[400px] ${wide ? 'sm:max-w-3xl' : 'sm:max-w-md'} max-h-[92dvh] overflow-y-auto rounded-t-ios sm:rounded-ios shadow-2xl anim-sheet sm:anim-pop`}
        role="dialog" aria-modal="true"
      >
        <div className="sticky top-0 surface z-10 flex items-center justify-between px-5 pt-4 pb-3 border-b hairline">
          <div className="sm:hidden absolute left-1/2 -translate-x-1/2 top-2 h-1 w-9 rounded-full surface-2" />
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="p-1.5 rounded-full surface-2 text-2 hover:opacity-80">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Avatar({ profile, size = 28 }) {
  const s = { width: size, height: size, fontSize: size * 0.38 }
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt={profile.full_name || ''} referrerPolicy="no-referrer"
      className="rounded-full object-cover shrink-0" style={s} />
  }
  return (
    <div className="rounded-full bg-brand text-white flex items-center justify-center font-semibold shrink-0" style={s}>
      {initials(profile?.full_name || profile?.email)}
    </div>
  )
}

export function Brand({ logoHeight = 18, className = '' }) {
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className="font-display font-semibold text-brand dark:text-white leading-none">Tuesday</span>
      <span className="text-[11px] text-2 leading-none">by</span>
      <img src="/atria-lab-logo.svg" alt="Atria Lab" className="logo-invert-dark inline-block"
        style={{ height: logoHeight, width: 'auto' }} />
    </span>
  )
}

export function OptionPill({ option, onClick, small = false, asButton = true }) {
  const cls = `inline-flex items-center justify-center rounded-full font-medium text-white whitespace-nowrap ${
    small ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1'
  }`
  const style = { backgroundColor: option?.color || 'var(--surface-2)', color: option ? '#fff' : 'var(--text-2)' }
  const label = option?.label || '—'
  if (!asButton) return <span className={cls} style={style}>{label}</span>
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick?.(e) }} className={`${cls} active:scale-95 transition-transform`} style={style}>
      {label}
    </button>
  )
}

// Selector de opciones: dropdown anclado (desktop) o sheet (móvil), simplificado como sheet/modal pequeño
export function OptionSheet({ open, onClose, title, options, value, onSelect, allowClear = true, onEdit }) {
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 anim-fade" onClick={(e) => { e.stopPropagation(); onClose() }} />
      <div className="relative surface w-full sm:w-72 rounded-t-ios sm:rounded-ios p-4 anim-sheet sm:anim-pop max-h-[75dvh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]" onClick={e => e.stopPropagation()}>
        <p className="text-sm font-semibold mb-3">{title}</p>
        <div className="flex flex-col gap-1.5">
          {options.map(opt => (
            <button key={opt.id}
              onClick={() => { onSelect(opt.id); onClose() }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-ios-sm text-sm font-medium text-left hover:opacity-90 ${value === opt.id ? 'ring-2 ring-brand-light' : ''}`}
              style={{ backgroundColor: opt.color, color: '#fff' }}>
              {opt.label}
            </button>
          ))}
          {options.length === 0 && (
            <p className="text-xs text-2 px-1 py-1">Sin opciones todavía. Usa "Editar opciones" para añadirlas.</p>
          )}
          {allowClear && (
            <button onClick={() => { onSelect(null); onClose() }}
              className="px-3 py-2.5 rounded-ios-sm text-sm surface-2 text-2 text-left">
              Sin valor
            </button>
          )}
          {onEdit && (
            <button onClick={() => { onClose(); onEdit() }}
              className="px-3 py-2.5 rounded-ios-sm text-sm font-medium text-brand dark:text-brand-light text-left border-t hairline mt-1 pt-2.5">
              Editar opciones…
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export const ICON_MAP = {
  briefcase: Briefcase, rocket: Rocket, star: Star, heart: Heart,
  zap: Zap, globe: Globe, palette: Palette, 'shopping-bag': ShoppingBag,
}

// Devuelve negro o blanco según la luminancia del color de fondo.
function readableFg(hex) {
  if (!hex || hex === 'transparent') return 'var(--text-2)'
  const m = hex.replace('#', '')
  const full = m.length === 3 ? m.split('').map(c => c + c).join('') : m
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  if ([r, g, b].some(Number.isNaN)) return '#fff'
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.62 ? '#3A3A45' : '#fff'
}

export function isEmojiIcon(icon) {
  return !!icon && !ICON_MAP[icon]
}

export function WorkspaceIcon({ icon, color, size = 36 }) {
  const transparent = color === 'transparent'
  const bg = transparent ? 'transparent' : (color || '#E4E4E9')
  const emoji = isEmojiIcon(icon)
  const I = ICON_MAP[icon] || Briefcase
  return (
    <div className="flex items-center justify-center shrink-0"
      style={{
        width: size, height: size,
        borderRadius: Math.round(size * 0.42),
        backgroundColor: bg,
        color: readableFg(bg),
      }}>
      {emoji
        ? <span style={{ fontSize: size * 0.52, lineHeight: 1 }}>{icon}</span>
        : <I size={size * 0.48} strokeWidth={1.75} absoluteStrokeWidth />}
    </div>
  )
}
