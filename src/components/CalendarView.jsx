import { useMemo, useState } from 'react'
import {
  DndContext, PointerSensor, useSensor, useSensors, useDroppable, useDraggable,
} from '@dnd-kit/core'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { buildMonthGrid, fromDateStr, monthLabel, toDateStr, WEEKDAYS } from '../lib/calendar'
import { formatDate } from '../lib/constants'

function statusColor(statusCol, value) {
  if (!statusCol) return '#9A9AA6'
  const v = Array.isArray(value) ? value[0] : value
  const o = (statusCol.options || []).find(x => x.id === v)
  return o?.color || '#9A9AA6'
}

// ---------- Píldora de tarea (desktop, arrastrable) ----------
function EventChip({ task, onOpen }) {
  const drag = useDraggable({ id: task.id })
  const style = drag.transform
    ? { transform: `translate(${drag.transform.x}px, ${drag.transform.y}px)`, zIndex: 50 }
    : undefined
  return (
    <button ref={drag.setNodeRef} {...drag.listeners} {...drag.attributes} style={style}
      onClick={(e) => { e.stopPropagation(); if (!drag.isDragging) onOpen(task) }}
      className={`w-full text-left text-[11px] leading-tight px-1.5 py-1 rounded-md mb-1 truncate text-white ${drag.isDragging ? 'opacity-60 cursor-grabbing' : 'cursor-grab'}`}
      title={task.title}>
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/80 mr-1 align-middle" />
      {task.title}
    </button>
  )
}

function DayCell({ day, events, statusCol, values, onOpen, onAddToDay }) {
  const { setNodeRef, isOver } = useDroppable({ id: day.dateStr })
  return (
    <div ref={setNodeRef}
      onClick={() => onAddToDay(day.dateStr)}
      className={`min-h-[104px] p-1.5 border-r border-b hairline flex flex-col cursor-pointer transition-colors group ${
        day.inMonth ? '' : 'opacity-40'
      } ${isOver ? 'bg-brand-soft dark:bg-brand-softDark' : 'hover:surface-2'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full ${
          day.isToday ? 'bg-brand text-white' : 'text-2'
        }`}>{day.date.getDate()}</span>
        <Plus size={12} className="text-2 opacity-0 group-hover:opacity-100" />
      </div>
      <div className="flex-1 overflow-hidden">
        {events.map(t => (
          <div key={t.id} style={{ backgroundColor: statusColor(statusCol, values[t.id]?.[statusCol?.id]) }} className="rounded-md mb-1">
            <EventChip task={t} onOpen={onOpen} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- Móvil: mes con puntos + lista del día ----------
function MobileCalendar({ weeks, eventsByDate, statusCol, values, selected, setSelected, onOpen, onAddToDay }) {
  const dayEvents = eventsByDate[selected] || []
  return (
    <div>
      <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-2 mb-1">
        {WEEKDAYS.map(d => <span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {weeks.flat().map(day => {
          const evs = eventsByDate[day.dateStr] || []
          const isSel = day.dateStr === selected
          return (
            <button key={day.dateStr} onClick={() => setSelected(day.dateStr)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 ${
                isSel ? 'bg-brand text-white' : day.isToday ? 'surface-2' : ''
              } ${day.inMonth ? '' : 'opacity-30'}`}>
              <span className={`text-xs ${day.isToday && !isSel ? 'font-semibold text-brand dark:text-brand-light' : ''}`}>
                {day.date.getDate()}
              </span>
              <span className="flex gap-0.5 h-1.5">
                {evs.slice(0, 3).map(t => (
                  <span key={t.id} className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: isSel ? '#fff' : statusColor(statusCol, values[t.id]?.[statusCol?.id]) }} />
                ))}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold mb-2 capitalize">
          {fromDateStr(selected).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <div className="flex flex-col gap-2">
          {dayEvents.map(t => (
            <button key={t.id} onClick={() => onOpen(t)}
              className="surface border hairline rounded-ios-sm px-3 py-2.5 text-left flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: statusColor(statusCol, values[t.id]?.[statusCol?.id]) }} />
              <span className="text-sm font-medium">{t.title}</span>
            </button>
          ))}
          <button onClick={() => onAddToDay(selected)}
            className="flex items-center gap-2 text-sm text-2 px-3 py-2">
            <Plus size={15} /> Agregar tarea este día
          </button>
        </div>
      </div>
    </div>
  )
}

export function CalendarView({ columns, topTasks, values, createTask, setValue, onOpenTask, isMobile }) {
  const dateCol = useMemo(() => columns.find(c => c.type === 'date'), [columns])
  const statusCol = useMemo(() => columns.find(c => c.type === 'status'), [columns])
  const today = new Date()
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selected, setSelected] = useState(toDateStr(today))

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const eventsByDate = useMemo(() => {
    const map = {}
    if (!dateCol) return map
    for (const t of topTasks) {
      const d = values[t.id]?.[dateCol.id]
      if (!d) continue
      if (!map[d]) map[d] = []
      map[d].push(t)
    }
    return map
  }, [topTasks, values, dateCol])

  const unscheduled = useMemo(() => {
    if (!dateCol) return []
    return topTasks.filter(t => !values[t.id]?.[dateCol.id])
  }, [topTasks, values, dateCol])

  const weeks = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor])

  if (!dateCol) {
    return <p className="text-sm text-2 p-4">Este board no tiene columna de Fecha, necesaria para el calendario.</p>
  }

  const goPrev = () => setCursor(c => {
    const m = c.month - 1
    return m < 0 ? { year: c.year - 1, month: 11 } : { ...c, month: m }
  })
  const goNext = () => setCursor(c => {
    const m = c.month + 1
    return m > 11 ? { year: c.year + 1, month: 0 } : { ...c, month: m }
  })
  const goToday = () => {
    const n = new Date()
    setCursor({ year: n.getFullYear(), month: n.getMonth() })
    setSelected(toDateStr(n))
  }

  // Crear tarea en un día concreto y abrir su detalle para renombrar
  const addToDay = async (dateStr) => {
    const task = await createTask('Nueva tarea', null, { [dateCol.id]: dateStr })
    onOpenTask(task)
  }

  const onDragEnd = ({ active, over }) => {
    if (!over) return
    setValue(active.id, dateCol.id, over.id)
  }

  const Header = (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-semibold capitalize">{monthLabel(cursor.year, cursor.month)}</h2>
      <div className="flex items-center gap-1">
        <button onClick={goToday} className="text-xs font-medium px-2.5 py-1.5 rounded-ios-sm surface-2">Hoy</button>
        <button onClick={goPrev} aria-label="Mes anterior" className="p-1.5 rounded-ios-sm surface-2"><ChevronLeft size={16} /></button>
        <button onClick={goNext} aria-label="Mes siguiente" className="p-1.5 rounded-ios-sm surface-2"><ChevronRight size={16} /></button>
      </div>
    </div>
  )

  const UnscheduledTray = unscheduled.length > 0 && (
    <details className="mt-3 surface border hairline rounded-ios-sm">
      <summary className="px-4 py-2.5 text-sm font-medium cursor-pointer text-2">
        Sin fecha · {unscheduled.length}
      </summary>
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        {unscheduled.map(t => (
          <button key={t.id} onClick={() => onOpenTask(t)}
            className="text-xs surface-2 rounded-full px-3 py-1.5">{t.title}</button>
        ))}
      </div>
    </details>
  )

  if (isMobile) {
    return (
      <div>
        {Header}
        <MobileCalendar weeks={weeks} eventsByDate={eventsByDate} statusCol={statusCol}
          values={values} selected={selected} setSelected={setSelected}
          onOpen={onOpenTask} onAddToDay={addToDay} />
        {UnscheduledTray}
      </div>
    )
  }

  return (
    <div>
      {Header}
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="surface border-l border-t hairline rounded-ios overflow-hidden">
          <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-2">
            {WEEKDAYS.map(d => <span key={d} className="py-2 border-r border-b hairline">{d}</span>)}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map(day => (
                <DayCell key={day.dateStr} day={day} events={eventsByDate[day.dateStr] || []}
                  statusCol={statusCol} values={values} onOpen={onOpenTask} onAddToDay={addToDay} />
              ))}
            </div>
          ))}
        </div>
      </DndContext>
      {UnscheduledTray}
    </div>
  )
}
