import { useEffect, useState } from 'react'
import { Video, ExternalLink } from 'lucide-react'
import { Modal, WorkspaceDropdown } from './ui'
import { DateField } from './DatePicker'

function todayStr() {
  const t = new Date()
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

export function MeetingModal({ open, onClose, onCreate, workspaces }) {
  const [wsId, setWsId] = useState('')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(null)
  const [time, setTime] = useState('10:00')
  const [duration, setDuration] = useState(30)
  const [link, setLink] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setTitle(''); setDate(todayStr()); setTime('10:00'); setDuration(30); setLink(''); setNotes(''); setError(null)
      if (workspaces?.length) setWsId(workspaces[0].id)
    }
  }, [open])

  const submit = async () => {
    if (!title.trim() || !date || busy) return
    if (workspaces && !wsId) { setError('Elige un cliente'); return }
    setBusy(true); setError(null)
    try {
      const [hh, mm] = (time || '00:00').split(':').map(Number)
      const [y, m, d] = date.split('-').map(Number)
      const starts_at = new Date(y, m - 1, d, hh, mm).toISOString()
      await onCreate({
        ...(workspaces ? { workspace_id: wsId } : {}),
        title: title.trim(), starts_at, duration_min: Number(duration) || 30,
        link: link.trim() || null, notes: notes.trim() || null,
      })
      onClose()
    } catch (e) {
      setError(e.message || 'No se pudo agendar la reunión')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Agendar reunión">
      <div className="flex flex-col gap-4">
        <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Título de la reunión"
          className="w-full text-lg font-semibold bg-transparent border-b hairline pb-2 placeholder:text-2" />

        {workspaces && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-2 block mb-1.5">Cliente</label>
            <WorkspaceDropdown workspaces={workspaces} value={wsId} onChange={setWsId} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-2 block mb-1.5">Fecha</label>
            <DateField value={date} onChange={setDate} placeholder="Elegir" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-2 block mb-1.5">Hora</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="text-sm rounded-ios-sm surface-2 px-3 py-2 outline-none w-full" />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-2 block mb-1.5">Duración</label>
          <select value={duration} onChange={e => setDuration(e.target.value)}
            className="text-sm rounded-ios-sm surface-2 px-3 py-2 outline-none w-full">
            {[15, 30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-2 block mb-1.5">Enlace de Meet</label>
          <div className="flex gap-2">
            <input value={link} onChange={e => setLink(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="flex-1 min-w-0 text-sm rounded-ios-sm surface-2 px-3 py-2 outline-none" />
            <a href="https://meet.google.com/new" target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-ios-sm surface border hairline text-sm font-medium shrink-0">
              <Video size={15} /> Crear <ExternalLink size={12} />
            </a>
          </div>
          <p className="text-[11px] text-2 mt-1">Pulsa «Crear» para abrir Meet, copia el enlace y pégalo aquí.</p>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-2 block mb-1.5">Notas</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="Agenda, participantes…"
            className="w-full text-sm rounded-ios-sm surface-2 p-3 outline-none resize-y" />
        </div>

        {error && <p className="text-xs text-[#E2445C]">{error}</p>}
        <button onClick={submit} disabled={!title.trim() || !date || busy}
          className="w-full py-3 rounded-ios-sm bg-brand text-white font-semibold disabled:opacity-40 active:scale-[.98] transition-transform">
          {busy ? 'Agendando…' : 'Agendar reunión'}
        </button>
      </div>
    </Modal>
  )
}
