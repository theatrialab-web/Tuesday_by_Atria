import { useMemo, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useGlobalCalendar } from '../hooks/useGlobalCalendar'
import { useIsMobile } from '../hooks/useIsMobile'
import { MonthCalendar } from '../components/MonthCalendar'
import { AddTaskModal } from '../components/AddTaskModal'
import { TaskQuickView } from '../components/TaskQuickView'
import { Segmented } from '../components/ui'

export default function Calendario() {
  const { eventsByDate: raw, loading, refetch } = useGlobalCalendar()
  const isMobile = useIsMobile()
  const [addDate, setAddDate] = useState(null)
  const [quick, setQuick] = useState(null)
  const [scope, setScope] = useState('all') // 'all' | 'mine'

  // Adaptar al formato de MonthCalendar (tareas por workspace + reuniones)
  const eventsByDate = useMemo(() => {
    const map = {}
    for (const [date, evs] of Object.entries(raw)) {
      const list = (scope === 'mine' ? evs.filter(e => e.mine) : evs).map((ev, i) => ev.type === 'meeting' ? {
        key: `m-${ev.meetingId}-${i}`,
        title: ev.title,
        color: ev.color,
        subtitle: `${ev.wsName || ''} · Reunión`,
        type: 'meeting',
        link: ev.link,
      } : {
        key: `${ev.taskId}-${i}`,
        title: ev.title,
        color: ev.color,
        subtitle: `${ev.wsName} · ${ev.boardName}`,
        boardId: ev.boardId,
        taskId: ev.taskId,
      })
      if (list.length) map[date] = list
    }
    return map
  }, [raw, scope])

  const onEventClick = (ev) => {
    if (ev.type === 'meeting') {
      if (ev.link) window.open(ev.link, '_blank', 'noopener')
      return
    }
    if (ev.taskId && ev.boardId) setQuick({ taskId: ev.taskId, boardId: ev.boardId })
  }

  const emptyHint = (
    <div className="rounded-ios border-2 border-dashed hairline p-10 flex flex-col items-center gap-3 text-2 mt-4">
      <CalendarDays size={28} />
      <p className="text-sm text-center">No hay tareas con fecha todavía. Asigna fechas a tus tareas y aparecerán aquí.</p>
    </div>
  )

  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto">
      <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold leading-tight">Calendario</h1>
          <p className="text-sm text-2">Tus tareas con fecha y tus reuniones</p>
        </div>
        <div className="w-44">
          <Segmented value={scope} onChange={setScope}
            options={[{ value: 'all', label: 'Todo' }, { value: 'mine', label: 'Solo mío' }]} />
        </div>
      </div>
      {loading ? (
        <p className="text-sm text-2">Cargando…</p>
      ) : (
        <MonthCalendar eventsByDate={eventsByDate} isMobile={isMobile}
          onEventClick={onEventClick}
          onDayClick={(date) => setAddDate(date)}
          emptyHint={emptyHint} />
      )}
      <AddTaskModal open={!!addDate} onClose={() => setAddDate(null)}
        initialDate={addDate} onCreated={refetch} />
      {quick && (
        <TaskQuickView taskId={quick.taskId} boardId={quick.boardId}
          onClose={() => setQuick(null)} onChanged={refetch} />
      )}
    </div>
  )
}
