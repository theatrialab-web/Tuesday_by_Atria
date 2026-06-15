import { useMemo, useState } from 'react'
import { Video, Plus, CalendarClock } from 'lucide-react'
import { useAllMeetings } from '../hooks/useMeetings'
import { useWorkspaces } from '../hooks/useWorkspaces'
import { MeetingModal } from '../components/MeetingModal'
import { MeetingRow } from '../components/MeetingsView'

export default function Reuniones() {
  const { meetings, loading, createMeeting, deleteMeeting } = useAllMeetings()
  const { workspaces } = useWorkspaces()
  const [open, setOpen] = useState(false)
  const [wsFilter, setWsFilter] = useState('all')

  const filtered = useMemo(
    () => meetings.filter(m => wsFilter === 'all' || m.workspace_id === wsFilter),
    [meetings, wsFilter]
  )
  const now = Date.now()
  const ended = (m) => new Date(m.starts_at).getTime() + (m.duration_min || 30) * 60000 < now
  const upcoming = filtered.filter(m => !ended(m))
  const past = filtered.filter(ended).reverse()

  return (
    <div className="p-5 sm:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <Video size={22} className="text-brand dark:text-brand-light" />
          <div>
            <h1 className="text-2xl font-semibold leading-tight">Reuniones</h1>
            <p className="text-sm text-2">Videollamadas de todos tus clientes</p>
          </div>
        </div>
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-ios-sm bg-brand text-white text-sm font-semibold shrink-0 active:scale-95 transition-transform">
          <Plus size={15} /> Agendar
        </button>
      </div>

      {!loading && meetings.length > 0 && (
        <select value={wsFilter} onChange={e => setWsFilter(e.target.value)}
          className="text-sm rounded-ios-sm surface-2 px-3 py-2 outline-none mb-5 max-w-full">
          <option value="all">Todos los clientes</option>
          {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      )}

      {loading ? (
        <p className="text-sm text-2">Cargando…</p>
      ) : meetings.length === 0 ? (
        <div className="rounded-ios border-2 border-dashed hairline p-10 flex flex-col items-center gap-3 text-2 text-center">
          <CalendarClock size={28} />
          <p className="text-sm">Aún no hay reuniones. Agenda la primera con el botón de arriba.</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-2 text-center py-8">No hay reuniones de este cliente.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold mb-2">Próximas ({upcoming.length})</h2>
              <div className="surface rounded-ios border hairline overflow-hidden">
                {upcoming.map(m => <MeetingRow key={m.id} m={m} ws={m.workspaces} onDelete={deleteMeeting} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold mb-2 text-2">Pasadas ({past.length})</h2>
              <div className="surface rounded-ios border hairline overflow-hidden">
                {past.map(m => <MeetingRow key={m.id} m={m} ws={m.workspaces} onDelete={deleteMeeting} />)}
              </div>
            </section>
          )}
        </div>
      )}

      <MeetingModal open={open} onClose={() => setOpen(false)} onCreate={createMeeting} workspaces={workspaces} />
    </div>
  )
}
