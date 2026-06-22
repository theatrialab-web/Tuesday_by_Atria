import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import {
  X, Check, ChevronDown, Briefcase, Rocket, Star, Heart, Zap, Globe, Palette, ShoppingBag,
  Home as HomeIcon, Folder, Code, Camera, Music, Book, Coffee, Gamepad2,
  Gift, Leaf, Flame, Trophy, Target, Lightbulb, PenTool, Bug, Cloud,
  Database, Smartphone, Megaphone, Calendar, Flag, Bookmark, Crown, Gem,
  Wrench, Sparkles, Building2, Truck, Headphones, Pizza,
} from 'lucide-react'
import { initials } from '../lib/constants'

// Checkbox con el estilo de la app (cuadrado redondeado, marca de check).
export function Checkbox({ checked, onChange, size = 18, green = false, className = '', ariaLabel }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} aria-label={ariaLabel}
      onClick={(e) => { e.stopPropagation(); onChange(!checked) }}
      style={{ width: size, height: size, ...(checked && green ? { backgroundColor: '#00C875', borderColor: '#00C875' } : {}) }}
      className={`shrink-0 grid place-items-center rounded-[6px] border transition-colors ${
        checked ? (green ? 'text-white' : 'bg-brand border-brand text-white') : 'surface hairline border hover:border-brand'
      } ${className}`}>
      {checked && <Check size={Math.round(size * 0.66)} strokeWidth={3} />}
    </button>
  )
}

// Interruptor estilo iOS (verde, con rebote del knob)
export function Switch({ checked, onChange, ariaLabel, disabled = false }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={ariaLabel} disabled={disabled}
      onClick={(e) => { e.stopPropagation(); if (!disabled) onChange(!checked) }}
      className="relative inline-flex h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-300 disabled:opacity-50"
      style={{ backgroundColor: checked ? '#34C759' : 'rgba(120,120,128,0.32)' }}>
      <span className="absolute top-[2px] left-[2px] h-[27px] w-[27px] rounded-full bg-white"
        style={{
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
          transition: 'transform .3s cubic-bezier(.34,1.45,.64,1)',
          boxShadow: '0 3px 8px rgba(0,0,0,0.18), 0 1px 1px rgba(0,0,0,0.12)',
        }} />
    </button>
  )
}

// Control segmentado estilo iOS (pastilla blanca deslizante)
export function Segmented({ options, value, onChange, className = '' }) {
  const idx = Math.max(0, options.findIndex(o => o.value === value))
  const n = options.length
  return (
    <div className={`relative inline-flex p-0.5 rounded-[11px] w-full ${className}`} style={{ background: 'rgba(120,120,128,0.16)' }}>
      <span className="absolute top-0.5 bottom-0.5 rounded-[9px] surface"
        style={{
          width: `calc((100% - 4px) / ${n})`,
          left: `calc(${idx} * (100% - 4px) / ${n} + 2px)`,
          transition: 'left .32s cubic-bezier(.34,1.4,.64,1)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 1px rgba(0,0,0,0.04)',
        }} />
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`relative z-10 flex-1 px-3 py-1.5 text-[13px] font-semibold rounded-[9px] transition-colors ${value === o.value ? '' : 'text-2'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

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
        className={`relative liquid-glass w-full sm:w-auto sm:min-w-[400px] ${wide ? 'sm:max-w-3xl' : 'sm:max-w-md'} max-h-[92dvh] overflow-y-auto rounded-t-ios-lg sm:rounded-ios border hairline anim-sheet sm:anim-pop`}
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
    <div className="rounded-full btn-brand flex items-center justify-center font-semibold shrink-0" style={s}>
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
      <div className="relative liquid-glass border hairline w-full sm:w-72 rounded-t-ios-lg sm:rounded-ios p-4 anim-sheet sm:anim-pop max-h-[75dvh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]" onClick={e => e.stopPropagation()}>
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

// Dropdown de cliente (mismo patrón que OptionSheet/DateField).
export function WorkspaceDropdown({ workspaces, value, onChange, placeholder = 'Elegir cliente', allowAll = false, title = 'Cliente' }) {
  const [open, setOpen] = useState(false)
  const sel = workspaces.find(w => w.id === value)
  const isAll = allowAll && (value === 'all' || !value)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2.5 surface-2 rounded-ios-sm px-3 py-2.5 text-left">
        {sel ? <WorkspaceIcon icon={sel.icon} color={sel.color} size={24} round />
          : <span className="w-6 h-6 rounded-md surface grid place-items-center text-2 shrink-0"><Briefcase size={14} /></span>}
        <span className={`flex-1 min-w-0 truncate text-sm font-medium ${sel ? '' : 'text-2'}`}>
          {sel ? sel.name : isAll ? 'Todos los clientes' : placeholder}
        </span>
        <ChevronDown size={16} className="text-2 shrink-0" />
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center" onClick={e => e.stopPropagation()}>
          <div className="absolute inset-0 bg-black/30 anim-fade" onClick={() => setOpen(false)} />
          <div className="relative liquid-glass border hairline w-full sm:w-80 rounded-t-ios-lg sm:rounded-ios p-4 anim-sheet sm:anim-pop max-h-[75dvh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
            <p className="text-sm font-semibold mb-3">{title}</p>
            <div className="flex flex-col gap-1.5">
              {allowAll && (
                <button onClick={() => { onChange('all'); setOpen(false) }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-ios-sm text-left ${isAll ? 'bg-brand-soft dark:bg-brand-softDark ring-1 ring-brand-light' : 'surface-2'}`}>
                  <span className="w-[26px] h-[26px] rounded-md surface grid place-items-center text-2 shrink-0"><Briefcase size={14} /></span>
                  <span className="text-sm font-medium">Todos los clientes</span>
                </button>
              )}
              {workspaces.map(w => (
                <button key={w.id} onClick={() => { onChange(w.id); setOpen(false) }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-ios-sm text-left ${value === w.id ? 'bg-brand-soft dark:bg-brand-softDark ring-1 ring-brand-light' : 'surface-2'}`}>
                  <WorkspaceIcon icon={w.icon} color={w.color} size={26} round />
                  <span className="text-sm font-medium truncate flex-1 min-w-0">{w.name}</span>
                </button>
              ))}
              {workspaces.length === 0 && <p className="text-xs text-2 px-1 py-1">No tienes clientes todavía.</p>}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export const ICON_MAP = {
  briefcase: Briefcase, rocket: Rocket, star: Star, heart: Heart,
  zap: Zap, globe: Globe, palette: Palette, 'shopping-bag': ShoppingBag,
  home: HomeIcon, folder: Folder, code: Code, camera: Camera,
  music: Music, book: Book, coffee: Coffee, gamepad: Gamepad2,
  gift: Gift, leaf: Leaf, flame: Flame, trophy: Trophy,
  target: Target, lightbulb: Lightbulb, pen: PenTool, bug: Bug,
  cloud: Cloud, database: Database, phone: Smartphone, megaphone: Megaphone,
  calendar: Calendar, flag: Flag, bookmark: Bookmark, crown: Crown,
  gem: Gem, wrench: Wrench, sparkles: Sparkles, building: Building2,
  truck: Truck, headphones: Headphones, pizza: Pizza,
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

export function WorkspaceIcon({ icon, color, size = 36, round = false }) {
  const transparent = color === 'transparent'
  const bg = transparent ? 'transparent' : (color || '#E4E4E9')
  const emoji = isEmojiIcon(icon)
  const I = ICON_MAP[icon] || Briefcase
  return (
    <div className="flex items-center justify-center shrink-0"
      style={{
        width: size, height: size,
        borderRadius: round ? size / 2 : Math.round(size * 0.42),
        backgroundColor: bg,
        color: readableFg(bg),
      }}>
      {emoji
        ? <span style={{ fontSize: size * 0.52, lineHeight: 1 }}>{icon}</span>
        : <I size={size * 0.48} strokeWidth={1.75} absoluteStrokeWidth />}
    </div>
  )
}
