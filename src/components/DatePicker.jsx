import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, ChevronLeft, ChevronRight, X, Clock } from 'lucide-react'
import { buildMonthGrid, fromDateStr, monthLabel, toDateStr, WEEKDAYS } from '../lib/calendar'
import { formatDate } from '../lib/constants'

// Mini-calendario reutilizable.
function MiniCalendar({ value, onPick, onClear }) {
  const base = value ? fromDateStr(value) : new Date()
  const [cursor, setCursor] = useState({ year: base.getFullYear(), month: base.getMonth() })
  const weeks = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor])
  const todayStr = toDateStr(new Date())

  const goPrev = () => setCursor(c => (c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 }))
  const goNext = () => setCursor(c => (c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 }))

  return (
    <div className="w-[300px] max-w-[86vw]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold capitalize">{monthLabel(cursor.year, cursor.month)}</h3>
        <div className="flex items-center gap-1">
          <button onClick={goPrev} aria-label="Mes anterior" className="p-1.5 rounded-ios-sm surface-2"><ChevronLeft size={15} /></button>
          <button onClick={goNext} aria-label="Mes siguiente" className="p-1.5 rounded-ios-sm surface-2"><ChevronRight size={15} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-2 mb-1">
        {WEEKDAYS.map(d => <span key={d} className="py-1">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {weeks.flat().map(day => {
          const isSel = day.dateStr === value
          const isToday = day.dateStr === todayStr
          return (
            <button key={day.dateStr} onClick={() => onPick(day.dateStr)}
              style={{ aspectRatio: '1 / 1' }}
              className={`rounded-lg text-sm flex items-center justify-center transition-colors ${
                isSel ? 'btn-brand font-semibold'
                : isToday ? 'ring-1 ring-brand-light text-brand dark:text-brand-light font-semibold'
                : 'hover:surface-2'
              } ${day.inMonth ? '' : 'opacity-30'}`}>
              {day.date.getDate()}
            </button>
          )
        })}
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t hairline">
        <button onClick={onClear} className="text-xs font-medium text-2 hover:text-[#E2445C] px-2 py-1">Limpiar</button>
        <button onClick={() => onPick(todayStr)} className="text-xs font-semibold text-brand dark:text-brand-light px-2 py-1">Hoy</button>
      </div>
    </div>
  )
}

// Campo de hora: pill clicable + popover con horas y minutos (estilo de la app).
export function TimeField({ value, onChange, className = '' }) {
  const [open, setOpen] = useState(false)
  const [h, m] = (value || '10:00').split(':')
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const mins = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']
  const set = (nh, nm) => onChange(`${nh}:${nm}`)

  return (
    <>
      <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(true) }}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium surface-2 ${className}`}>
        <Clock size={12} className="shrink-0 opacity-70" />
        {value || '—'}
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <div className="absolute inset-0 bg-black/30 anim-fade" onClick={() => setOpen(false)} />
          <div className="relative surface rounded-t-ios sm:rounded-ios p-4 anim-sheet sm:anim-pop shadow-2xl w-full sm:w-[260px] pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Hora</span>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-full surface-2 text-2"><X size={15} /></button>
            </div>
            <div className="flex gap-2 h-44">
              <div className="flex-1 overflow-y-auto rounded-ios-sm surface-2 p-1">
                {hours.map(hh => (
                  <button key={hh} onClick={() => set(hh, m)}
                    className={`w-full py-1.5 rounded-md text-sm font-medium ${h === hh ? 'btn-brand' : 'hover:surface'}`}>{hh}</button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto rounded-ios-sm surface-2 p-1">
                {mins.map(mm => (
                  <button key={mm} onClick={() => set(h, mm)}
                    className={`w-full py-1.5 rounded-md text-sm font-medium ${m === mm ? 'btn-brand' : 'hover:surface'}`}>{mm}</button>
                ))}
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="w-full mt-3 py-2.5 rounded-ios-sm btn-brand text-sm font-semibold">Listo</button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
export function DateField({ value, onChange, placeholder = '—', className = '' }) {
  const [open, setOpen] = useState(false)
  const pick = (dateStr) => { onChange(dateStr); setOpen(false) }
  const clear = () => { onChange(null); setOpen(false) }

  return (
    <>
      <button onClick={(e) => { e.stopPropagation(); setOpen(true) }}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${value ? 'surface-2' : 'surface-2 text-2'} ${className}`}>
        <CalendarDays size={12} className="shrink-0 opacity-70" />
        {value ? formatDate(value) : placeholder}
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <div className="absolute inset-0 bg-black/30 anim-fade" onClick={() => setOpen(false)} />
          <div className="relative surface rounded-t-ios sm:rounded-ios p-4 anim-sheet sm:anim-pop shadow-2xl w-full sm:w-auto">
            <div className="flex items-center justify-between mb-2 sm:hidden">
              <span className="text-sm font-semibold">Elegir fecha</span>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-full surface-2 text-2"><X size={15} /></button>
            </div>
            <MiniCalendar value={value} onPick={pick} onClear={clear} />
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
