import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Modal } from './ui'
import { DateField, TimeField } from './DatePicker'
import { toDateStr } from '../lib/calendar'

// Atajos rapidos
function plusMinutes(min) {
  const d = new Date(Date.now() + min * 60000)
  return { date: toDateStr(d), time: `${String(d.getHours()).padStart(2, '0')}:${String(Math.floor(d.getMinutes() / 5) * 5).padStart(2, '0')}` }
}

export function ReminderModal({ open, onClose, defaultTitle = '', onCreate }) {
  const [title, setTitle] = useState(defaultTitle)
  const init = plusMinutes(60)
  const [date, setDate] = useState(init.date)
  const [time, setTime] = useState(init.time)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // Reiniciar el titulo cuando se abre con uno nuevo
  const [lastDefault, setLastDefault] = useState(defaultTitle)
  if (open && defaultTitle !== lastDefault) { setLastDefault(defaultTitle); setTitle(defaultTitle) }

  const quick = (min) => { const p = plusMinutes(min); setDate(p.date); setTime(p.time) }

  const submit = async () => {
    setErr('')
    const t = title.trim()
    if (!t) { setErr('Escribe de qué es el recordatorio.'); return }
    if (!date || !time) { setErr('Elige fecha y hora.'); return }
    const when = new Date(`${date}T${time}:00`)
    if (isNaN(when.getTime())) { setErr('Fecha u hora no válida.'); return }
    if (when.getTime() < Date.now() - 60000) { setErr('Esa hora ya pasó.'); return }
    setBusy(true)
    const ok = await onCreate({ title: t, remindAt: when.toISOString() })
    setBusy(false)
    if (ok) onClose()
    else setErr('No se pudo crear el recordatorio.')
  }

  if (!open) return null
  return (
    <Modal open={open} onClose={onClose} title="Nuevo recordatorio">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5 text-brand dark:text-brand-light">
          <Bell size={18} />
          <span className="text-sm font-medium">Te avisaremos a la hora elegida</span>
        </div>

        <input value={title} onChange={e => setTitle(e.target.value)} autoFocus
          placeholder="¿De qué quieres acordarte?"
          className="w-full surface-2 rounded-ios-sm px-3.5 py-3 text-sm outline-none" />

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium mr-1">Cuándo:</span>
          <DateField value={date} onChange={setDate} />
          <TimeField value={time} onChange={setTime} />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => quick(60)} className="px-3 py-1.5 rounded-full surface-2 text-xs font-medium hover:opacity-90">En 1 hora</button>
          <button onClick={() => quick(180)} className="px-3 py-1.5 rounded-full surface-2 text-xs font-medium hover:opacity-90">En 3 horas</button>
          <button onClick={() => quick(60 * 24)} className="px-3 py-1.5 rounded-full surface-2 text-xs font-medium hover:opacity-90">Mañana</button>
        </div>

        {err && <p className="text-xs text-[#E2445C]">{err}</p>}

        <button onClick={submit} disabled={busy}
          className="w-full py-3 rounded-ios-sm btn-brand bg-brand text-white font-semibold text-sm active:scale-[.98] transition-transform disabled:opacity-60">
          {busy ? 'Creando…' : 'Crear recordatorio'}
        </button>
      </div>
    </Modal>
  )
}
