import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { Avatar } from './ui'
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
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" onClick={e => e.stopPropagation()}>
          <div className="absolute inset-0 bg-black/30 anim-fade" onClick={() => setOpen(false)} />
          <div className="relative surface w-full sm:w-72 rounded-t-ios sm:rounded-ios p-4 anim-sheet sm:anim-pop max-h-[70dvh] overflow-y-auto">
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
            <button onClick={() => setOpen(false)} className="mt-3 w-full py-2.5 rounded-ios-sm bg-brand text-white text-sm font-semibold">
              Listo
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ---------- Fecha ----------
export function DateCell({ value, onChange, compact = false }) {
  return (
    <label onClick={e => e.stopPropagation()} className="relative inline-flex items-center cursor-pointer">
      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${value ? 'surface-2' : 'text-2 surface-2'}`}>
        {value ? formatDate(value) : '—'}
      </span>
      <input type="date" value={value || ''}
        onChange={e => onChange(e.target.value || null)}
        className="absolute inset-0 opacity-0 w-full cursor-pointer" aria-label="Fecha" />
    </label>
  )
}

// ---------- Marca (texto libre como pill) ----------
export function TagCell({ value, onChange }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')

  if (editing) {
    return (
      <input autoFocus value={draft}
        onClick={e => e.stopPropagation()}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { setEditing(false); onChange(draft.trim() || null) }}
        onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
        className="w-24 px-2 py-1 text-xs rounded-full surface-2 border hairline"
        placeholder="Marca" />
    )
  }
  return (
    <button onClick={(e) => { e.stopPropagation(); setDraft(value || ''); setEditing(true) }}
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${value ? 'bg-brand-soft dark:bg-brand-softDark text-brand dark:text-white' : 'surface-2 text-2'}`}>
      {value || '—'}
    </button>
  )
}
