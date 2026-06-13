import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { buildMonthGrid, fromDateStr, monthLabel, toDateStr, WEEKDAYS } from '../lib/calendar'

// eventsByDate: { 'YYYY-MM-DD': [{ key, title, color, subtitle? }] }
export function MonthCalendar({ eventsByDate = {}, onEventClick, isMobile, emptyHint }) {
  const today = new Date()
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selected, setSelected] = useState(toDateStr(today))
  const weeks = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor])

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

  const empty = Object.keys(eventsByDate).length === 0

  if (isMobile) {
    const dayEvents = eventsByDate[selected] || []
    return (
      <div>
        {Header}
        <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-2 mb-1">
          {WEEKDAYS.map(d => <span key={d}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map(day => {
            const evs = eventsByDate[day.dateStr] || []
            const isSel = day.dateStr === selected
            return (
              <button key={day.dateStr} onClick={() => setSelected(day.dateStr)}
                style={{ aspectRatio: '1 / 1' }}
                className={`rounded-lg flex flex-col items-center justify-center gap-0.5 ${
                  isSel ? 'bg-brand text-white' : day.isToday ? 'surface-2' : ''
                } ${day.inMonth ? '' : 'opacity-30'}`}>
                <span className={`text-xs ${day.isToday && !isSel ? 'font-semibold text-brand dark:text-brand-light' : ''}`}>
                  {day.date.getDate()}
                </span>
                <span className="flex gap-0.5 h-1.5">
                  {evs.slice(0, 3).map((ev, i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: isSel ? '#fff' : ev.color }} />
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
            {dayEvents.map(ev => (
              <button key={ev.key} onClick={() => onEventClick?.(ev)}
                className="surface border hairline rounded-ios-sm px-3 py-2.5 text-left flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                <span className="min-w-0">
                  <span className="text-sm font-medium block truncate">{ev.title}</span>
                  {ev.subtitle && <span className="text-[11px] text-2 block truncate">{ev.subtitle}</span>}
                </span>
              </button>
            ))}
            {dayEvents.length === 0 && <p className="text-xs text-2">Nada programado este día.</p>}
          </div>
        </div>
        {empty && emptyHint}
      </div>
    )
  }

  return (
    <div>
      {Header}
      <div className="surface border-l border-t hairline rounded-ios overflow-hidden">
        <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-2">
          {WEEKDAYS.map(d => <span key={d} className="py-2 border-r border-b hairline">{d}</span>)}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map(day => {
              const evs = eventsByDate[day.dateStr] || []
              return (
                <div key={day.dateStr}
                  className={`min-h-[110px] p-1.5 border-r border-b hairline flex flex-col ${day.inMonth ? '' : 'opacity-40'}`}>
                  <span className={`text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full mb-1 ${
                    day.isToday ? 'bg-brand text-white' : 'text-2'
                  }`}>{day.date.getDate()}</span>
                  <div className="flex-1 overflow-hidden">
                    {evs.map(ev => (
                      <button key={ev.key} onClick={() => onEventClick?.(ev)}
                        style={{ backgroundColor: ev.color }}
                        className="w-full text-left text-[11px] leading-tight px-1.5 py-1 rounded-md mb-1 truncate text-white"
                        title={ev.subtitle ? `${ev.title} — ${ev.subtitle}` : ev.title}>
                        {ev.title}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {empty && emptyHint}
    </div>
  )
}
