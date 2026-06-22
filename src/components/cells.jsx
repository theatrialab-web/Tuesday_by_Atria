import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Plus, X } from 'lucide-react'
import { Avatar } from './ui'
import { DateField } from './DatePicker'
import { formatDate } from '../lib/constants'

// ---------- Persona ----------
export function PersonCell({ value, members, onChange, compact = false }) {
  const [open, setOpen] = useState(false)
  const ids = Array.isArray(value) ? value : []
  const assigned = members.filter(m => ids.includes(m.id))

  return (
    <>
      <button onClick={(e) => { e.stopPropagation(); setOpen(true) }}
        className="flex items-center -space-x-1.5 min-h-[28px]" aria-label="Asignar persona">
        {assigned.length === 0 ? (
          <span className="w-7 h-7 rounded-full surface-2 flex items-center justify-center text-2"><Plus size={13} /></span>
        ) : (
          assigned.slice(0, 3).map(m => <Avatar key={m.id} profile={m} size={26} />)
        )}
        {assigned.length > 3 && (
          <span className="w-6 h-6 rounded-full surface-2 text-[10px] flex items-center justify-center text-2">+{assigned.length - 3}</span>
        )}
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" onClick={e => e.stopPropagation()}>
          <div className="absolute inset-0 bg-black/30 anim-fade" onClick={() => setOpen(false)} />
          <div className="relative surface w-full sm:w-72 rounded-t-ios sm:rounded-ios p-4 anim-sheet sm:anim-pop max-h-[75dvh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
            <p className="text-sm font-semibold mb-3">Asignar a</p>
            {members.map(m => {
              const sel = ids.includes(m.id)
              return (
                <button key={m.id}
                  onClick={() => onChange(sel ? ids.filter(i => i !== m.id) : [...ids, m.id])}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-ios-sm hover:surface-2 text-left">
                  <Avatar profile={m} size={30} />
                  <span className="text-sm flex-1 truncate">{m.full_name || m.email}</span>
                  {sel && <Check size={16} className="text-brand-light" />}
                </button>
              )
            })}
            <button onClick={() => setOpen(false)} className="mt-3 w-full py-2.5 rounded-ios-sm btn-brand text-sm font-semibold">
              Listo
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

// ---------- Fecha ----------
export function DateCell({ value, onChange, compact = false }) {
  return <DateField value={value} onChange={onChange} />
}

// ---------- Texto libre (una línea + preview al hacer clic) ----------
export function TagCell({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const [tip, setTip] = useState(null)
  const ref = useRef(null)

  const openPreview = (e) => { e.stopPropagation(); setDraft(value || ''); setOpen(true); setTip(null) }
  const save = () => { onChange(draft.trim() || null); setOpen(false) }

  const showTip = () => {
    if (!value) return
    const r = ref.current?.getBoundingClientRect()
    if (r) setTip({ x: r.left, y: r.top })
  }

  return (
    <>
      <button ref={ref} onClick={openPreview}
        onMouseEnter={showTip} onMouseLeave={() => setTip(null)}
        className={`block max-w-[220px] truncate text-left rounded-full px-2.5 py-1 text-xs font-medium ${
          value ? 'bg-brand-soft dark:bg-brand-softDark text-brand dark:text-white' : 'surface-2 text-2'
        }`}>
        {value || '—'}
      </button>
      {tip && value && createPortal(
        <div className="fixed z-[90] max-w-[280px] surface border hairline rounded-ios-sm shadow-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words pointer-events-none anim-fade"
          style={{ left: Math.min(tip.x, window.innerWidth - 296), top: tip.y - 8, transform: 'translateY(-100%)' }}>
          {value}
        </div>,
        document.body
      )}
      {open && createPortal(
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center" onClick={e => e.stopPropagation()}>
          <div className="absolute inset-0 bg-black/30 anim-fade" onClick={() => setOpen(false)} />
          <div className="relative surface w-full sm:w-96 rounded-t-ios sm:rounded-ios p-4 anim-sheet sm:anim-pop shadow-2xl pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Texto</span>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-full surface-2 text-2"><X size={15} /></button>
            </div>
            <textarea autoFocus value={draft} onChange={e => setDraft(e.target.value)}
              rows={5} placeholder="Escribe aquí…"
              className="w-full text-sm rounded-ios-sm surface-2 p-3 outline-none resize-y leading-relaxed max-h-[50dvh]" />
            <div className="flex items-center justify-end gap-2 mt-3">
              <button onClick={() => { setDraft(''); }} className="text-xs font-medium text-2 px-3 py-2">Limpiar</button>
              <button onClick={save} className="px-4 py-2 rounded-ios-sm btn-brand text-sm font-semibold">Guardar</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
