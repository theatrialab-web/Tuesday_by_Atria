import { useEffect, useState } from 'react'
import { Video, ExternalLink } from 'lucide-react'
import { Modal, WorkspaceDropdown } from './ui'
import { DateField, TimeField } from './DatePicker'

const pad = (n) => String(n).padStart(2, '0')
function todayStr() {
  const t = new Date()
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`
}

export function MeetingModal({ open, onClose, onCreate, onUpdate, meeting, workspaces }) {
  const isEdit = !!meeting?.id
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
    if (!open) return
    setError(null)
    if (isEdit) {
      const dt = new Date(meeting.starts_at)
      setTitle(meeting.title || '')
      setDate(`${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`)
      setTime(`${pad(dt.getHours())}:${pad(dt.getMinutes())}`)
      setDuration(meeting.duration_min || 30)
      setLink(meeting.link || '')
      setNotes(meeting.notes || '')
      if (workspaces) setWsId(meeting.workspace_id)
    } else {
      setTitle(''); setDate(todayStr()); setTime('10:00'); setDuration(30); setLink(''); setNotes('')
      if (workspaces?.length) setWsId(workspaces[0].id)
    }
  }, [open, meeting?.id])

  const submit = async () => {
    if (!title.trim() || !date || busy) return
    if (workspaces && !wsId) { setError('Elige un cliente'); return }
    setBusy(true); setError(null)
    try {
      const [hh, mm] = (time || '00:00').split(':').map(Number)
      const [y, m, d] = date.split('-').map(Number)
      const starts_at = new Date(y, m - 1, d, hh, mm).toISOString()
      const patch = {
        ...(workspaces ? { workspace_id: wsId } : {}),
        title: title.trim(), starts_at, duration_min: Number(duration) || 30,
        link: link.trim() || null, notes: notes.trim() || null,
      }
      if (isEdit) await onUpdate(meeting.id, patch)
      else await onCreate(patch)
      onClose()
    } catch (e) {
      setError(e.message || 'No se pudo guardar la reunión')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar reunión' : 'Agendar reunión'}>
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

        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-2 block mb-1.5">Fecha</label>
            <DateField value={date} onChange={setDate} placeholder="Elegir" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-2 block mb-1.5">Hora</label>
            <TimeField value={time} onChange={setTime} />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-2 block mb-1.5">Duración</label>
          <div className="flex flex-wrap items-center gap-1.5">
            {[15, 30, 45, 60, 90, 120].map(d => (
              <button key={d} type="button" onClick={() => setDuration(d)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${Number(duration) === d ? 'btn-brand' : 'surface-2 text-2'}`}>
                {d < 60 ? `${d} min` : d % 60 === 0 ? `${d / 60} h` : `${Math.floor(d / 60)} h ${d % 60} min`}
              </button>
            ))}
            <span className="inline-flex items-center gap-1 surface-2 rounded-full pl-2.5 pr-1.5 py-0.5">
              <input type="number" min="5" max="600" step="5" value={duration}
                onChange={e => setDuration(e.target.value)}
                className="w-12 bg-transparent text-xs font-semibold text-center outline-none" aria-label="Duración personalizada" />
              <span className="text-[11px] text-2">min</span>
            </span>
          </div>
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
          className="w-full py-3 rounded-ios-sm btn-brand font-semibold disabled:opacity-40 active:scale-[.98] transition-transform">
          {busy ? 'Guardando…' : (isEdit ? 'Guardar cambios' : 'Agendar reunión')}
        </button>
      </div>
    </Modal>
  )
}
