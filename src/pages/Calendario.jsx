import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import { useGlobalCalendar } from '../hooks/useGlobalCalendar'
import { useIsMobile } from '../hooks/useIsMobile'
import { MonthCalendar } from '../components/MonthCalendar'
import { AddTaskModal } from '../components/AddTaskModal'

export default function Calendario() {
  const { eventsByDate: raw, loading, refetch } = useGlobalCalendar()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [addDate, setAddDate] = useState(null)

  // Adaptar al formato de MonthCalendar (coloreado por workspace)
  const eventsByDate = useMemo(() => {
    const map = {}
    for (const [date, evs] of Object.entries(raw)) {
      map[date] = evs.map((ev, i) => ({
        key: `${ev.taskId}-${i}`,
        title: ev.title,
        color: ev.color,
        subtitle: `${ev.wsName} · ${ev.boardName}`,
        boardId: ev.boardId,
      }))
    }
    return map
  }, [raw])

  const emptyHint = (
    <div className="rounded-ios border-2 border-dashed hairline p-10 flex flex-col items-center gap-3 text-2 mt-4">
      <CalendarDays size={28} />
      <p className="text-sm text-center">No hay tareas con fecha todavía. Asigna fechas a tus tareas y aparecerán aquí.</p>
    </div>
  )

  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold leading-tight">Calendario</h1>
        <p className="text-sm text-2">Todas tus tareas con fecha</p>
      </div>
      {loading ? (
        <p className="text-sm text-2">Cargando…</p>
      ) : (
        <MonthCalendar eventsByDate={eventsByDate} isMobile={isMobile}
          onEventClick={(ev) => ev.boardId && navigate(`/board/${ev.boardId}`)}
          onDayClick={(date) => setAddDate(date)}
          emptyHint={emptyHint} />
      )}
      <AddTaskModal open={!!addDate} onClose={() => setAddDate(null)}
        initialDate={addDate} onCreated={refetch} />
    </div>
  )
}
