import { useState } from 'react'
import { Video, Trash2, ExternalLink, CalendarClock, Plus, Pencil } from 'lucide-react'
import { useMeetings } from '../hooks/useMeetings'
import { MeetingModal } from './MeetingModal'
import { WorkspaceIcon } from './ui'

export function meetingWhen(starts_at) {
  const d = new Date(starts_at)
  const fecha = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
  const hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  return `${fecha} · ${hora}`
}

export function MeetingRow({ m, ws, onEdit, onDelete }) {
  const past = new Date(m.starts_at).getTime() + (m.duration_min || 30) * 60000 < Date.now()
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b hairline last:border-0">
      {ws ? <WorkspaceIcon icon={ws.icon} color={ws.color} size={34} round />
        : <span className={`w-9 h-9 rounded-ios-sm grid place-items-center shrink-0 ${past ? 'surface-2 text-2' : 'bg-brand-soft dark:bg-brand-softDark text-brand dark:text-white'}`}><Video size={16} /></span>}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${past ? 'text-2' : ''}`}>{m.title}</p>
        <p className="text-[11px] text-2 capitalize">
          {ws ? `${ws.name} · ` : ''}{meetingWhen(m.starts_at)} · {m.duration_min} min
        </p>
      </div>
      {m.link && (
        <a href={m.link} target="_blank" rel="noreferrer"
          className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-ios-sm shrink-0 ${past ? 'surface-2 text-2' : 'btn-brand'}`}>
          Unirse <ExternalLink size={12} />
        </a>
      )}
      {onEdit && (
        <button onClick={() => onEdit(m)} aria-label="Editar reunión"
          className="p-1.5 rounded-ios-sm text-2 hover:text-brand dark:hover:text-brand-light shrink-0"><Pencil size={15} /></button>
      )}
      {onDelete && (
        <button onClick={() => onDelete(m.id)} aria-label="Eliminar reunión"
          className="p-1.5 rounded-ios-sm text-2 hover:text-[#E2445C] shrink-0"><Trash2 size={15} /></button>
      )}
    </div>
  )
}

export function MeetingsView({ workspaceId }) {
  const { meetings, loading, createMeeting, updateMeeting, deleteMeeting } = useMeetings(workspaceId)
  const [modal, setModal] = useState(null) // null | { meeting }
  const now = Date.now()
  const upcoming = meetings.filter(m => new Date(m.starts_at).getTime() + (m.duration_min || 30) * 60000 >= now)
  const past = meetings.filter(m => new Date(m.starts_at).getTime() + (m.duration_min || 30) * 60000 < now).reverse()

  if (loading) return <p className="text-sm text-2">Cargando reuniones…</p>

  return (
    <div className="max-w-3xl flex flex-col gap-5">
      <button onClick={() => setModal({ meeting: null })}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-ios-sm btn-brand text-sm font-semibold w-fit active:scale-95 transition-transform">
        <Plus size={15} /> Agendar reunión
      </button>

      {meetings.length === 0 ? (
        <div className="rounded-ios border-2 border-dashed hairline p-8 flex flex-col items-center gap-3 text-2 text-center">
          <CalendarClock size={26} />
          <p className="text-sm">Aún no hay reuniones para este cliente.</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold mb-2">Próximas ({upcoming.length})</h3>
              <div className="surface rounded-ios border hairline overflow-hidden">
                {upcoming.map(m => <MeetingRow key={m.id} m={m} onEdit={() => setModal({ meeting: m })} onDelete={deleteMeeting} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold mb-2 text-2">Pasadas ({past.length})</h3>
              <div className="surface rounded-ios border hairline overflow-hidden">
                {past.map(m => <MeetingRow key={m.id} m={m} onEdit={() => setModal({ meeting: m })} onDelete={deleteMeeting} />)}
              </div>
            </section>
          )}
        </>
      )}

      <MeetingModal open={!!modal} onClose={() => setModal(null)} meeting={modal?.meeting}
        onCreate={createMeeting} onUpdate={updateMeeting} />
    </div>
  )
}
