import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, CheckCircle2, AlertCircle, CalendarPlus, ChevronDown } from 'lucide-react'
import { Modal } from './ui'
import { DateField } from './DatePicker'
import { MonthCalendar } from './MonthCalendar'
import { useBilling, cycleTotals } from '../hooks/useBilling'
import { useIsMobile } from '../hooks/useIsMobile'
import { fromDateStr } from '../lib/calendar'

const CURRENCIES = ['EUR', 'USD', 'MXN', 'COP', 'GBP', 'ARS']

export function money(n, currency) {
  try { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: currency || 'EUR' }).format(n || 0) }
  catch { return `${n} ${currency || ''}` }
}

function periodLabel(period_month) {
  if (!period_month) return ''
  return fromDateStr(period_month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

function nextMonth(period_month) {
  const base = period_month ? fromDateStr(period_month) : new Date()
  const d = new Date(base.getFullYear(), base.getMonth() + 1, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export function BillingView({ workspaceId }) {
  const { cycles, paymentsByCycle, current, loading, createCycle, updateCycle, setPaid, deleteCycle, addPayment, deletePayment } = useBilling(workspaceId)
  const [editCycle, setEditCycle] = useState(null)   // ciclo a editar (o {nuevo})
  const [payCycle, setPayCycle] = useState(null)      // ciclo al que abonar
  const [expanded, setExpanded] = useState(null)      // mes del historial desplegado
  const isMobile = useIsMobile()

  const cur = current?.currency || 'EUR'
  const curPayments = current ? (paymentsByCycle[current.id] || []) : []
  const t = cycleTotals(current, curPayments)

  const eventsByDate = useMemo(() => {
    const map = {}
    for (const c of cycles) {
      if (c.due_date) (map[c.due_date] = map[c.due_date] || []).push({ key: `due-${c.id}`, title: `Cobro ${periodLabel(c.period_month)}`, color: c.status === 'paid' ? '#9A9AA6' : '#E2445C' })
      for (const p of (paymentsByCycle[c.id] || [])) {
        if (p.paid_on) (map[p.paid_on] = map[p.paid_on] || []).push({ key: p.id, title: `Abono ${money(p.amount, c.currency)}`, color: '#00C875' })
      }
    }
    return map
  }, [cycles, paymentsByCycle])

  if (loading) return <p className="text-sm text-2">Cargando información de pago…</p>

  if (!current) {
    return (
      <div className="max-w-md">
        <div className="rounded-ios border-2 border-dashed hairline p-8 flex flex-col items-center gap-3 text-2 text-center">
          <AlertCircle size={26} />
          <p className="text-sm">Aún no hay cobros configurados para este cliente.</p>
          <button onClick={() => setEditCycle({ period_month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01` })}
            className="px-4 py-2 rounded-ios-sm bg-brand text-white text-sm font-semibold">Configurar primer cobro</button>
        </div>
        <CycleEditorModal cycle={editCycle} onClose={() => setEditCycle(null)} createCycle={createCycle} updateCycle={updateCycle} deleteCycle={deleteCycle} />
      </div>
    )
  }

  const daysLabel = () => {
    if (t.daysLeft == null) return 'Sin fecha de cobro'
    if (t.daysLeft === 0) return 'El cobro es hoy'
    if (t.daysLeft > 0) return `Faltan ${t.daysLeft} día${t.daysLeft === 1 ? '' : 's'} para el cobro`
    return `Vencido hace ${Math.abs(t.daysLeft)} día${Math.abs(t.daysLeft) === 1 ? '' : 's'}`
  }

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      {/* Mes actual + estado */}
      <div className={`rounded-ios p-4 flex items-center gap-3 ${
        t.isPending ? 'bg-[#FFF4E5] dark:bg-[#3a2a10] text-[#B26A00] dark:text-[#FDAB3D]'
        : 'bg-[#E9F9F0] dark:bg-[#0f2e1f] text-[#00854a] dark:text-[#33d896]'
      }`}>
        {t.isPending ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm capitalize">
            {periodLabel(current.period_month)} · {current.status === 'paid' ? 'Pagado' : 'Pendiente'}
          </p>
          <p className="text-xs opacity-90">{daysLabel()}</p>
        </div>
        <button onClick={() => setPaid(current.id, current.status !== 'paid')}
          className="text-xs font-semibold px-3 py-1.5 rounded-ios-sm surface border hairline text-1 shrink-0">
          {current.status === 'paid' ? 'Marcar pendiente' : 'Marcar pagado'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total del mes" value={money(t.total, cur)} />
        <Stat label="Abonado" value={money(t.paid, cur)} accent="#00C875" />
        <Stat label="Restante" value={money(t.remaining, cur)} accent={t.remaining > 0 ? '#E2445C' : '#00C875'} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setEditCycle(current)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-ios-sm surface border hairline text-sm font-medium">
          <Pencil size={14} /> Editar cobro
        </button>
        <button onClick={() => setPayCycle(current)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-ios-sm bg-brand text-white text-sm font-semibold active:scale-95 transition-transform">
          <Plus size={15} /> Registrar abono
        </button>
        {current.status === 'paid' && (
          <button onClick={() => setEditCycle({ period_month: nextMonth(current.period_month), currency: cur })}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-ios-sm surface border hairline text-sm font-medium text-brand dark:text-brand-light">
            <CalendarPlus size={15} /> Programar mes siguiente
          </button>
        )}
      </div>

      {/* Abonos del mes actual */}
      {curPayments.length > 0 && (
        <div className="surface rounded-ios border hairline overflow-hidden">
          {curPayments.map(p => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 border-b hairline last:border-0">
              <span className="w-2 h-2 rounded-full bg-[#00C875] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{money(p.amount, cur)}</p>
                <p className="text-[11px] text-2">{fromDateStr(p.paid_on).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}{p.note ? ` · ${p.note}` : ''}</p>
              </div>
              <button onClick={() => deletePayment(p.id)} aria-label="Eliminar abono" className="p-1.5 rounded-ios-sm text-2 hover:text-[#E2445C]"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="surface rounded-ios border hairline p-4">
        <MonthCalendar eventsByDate={eventsByDate} isMobile={isMobile} />
      </div>

      {/* Historial de meses */}
      {cycles.length > 1 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Historial</h3>
          <div className="surface rounded-ios border hairline overflow-hidden">
            {cycles.slice(1).map(c => {
              const cps = paymentsByCycle[c.id] || []
              const ct = cycleTotals(c, cps)
              const isOpen = expanded === c.id
              return (
                <div key={c.id} className="border-b hairline last:border-0">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button onClick={() => setExpanded(isOpen ? null : c.id)} aria-label="Ver abonos"
                      className="text-2 shrink-0">
                      <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${c.status === 'paid' ? 'bg-[#00C875]' : 'bg-[#FDAB3D]'}`} />
                    <button onClick={() => setExpanded(isOpen ? null : c.id)} className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium capitalize">{periodLabel(c.period_month)}</p>
                      <p className="text-[11px] text-2">{money(ct.paid, c.currency)} / {money(ct.total, c.currency)} · {c.status === 'paid' ? 'Pagado' : 'Pendiente'}</p>
                    </button>
                    <button onClick={() => setPayCycle(c)} className="text-xs font-medium text-brand dark:text-brand-light px-2 py-1">Abonar</button>
                    <button onClick={() => { if (window.confirm('¿Eliminar este mes y sus abonos?')) deleteCycle(c.id) }} aria-label="Eliminar mes" className="p-1.5 rounded-ios-sm text-2 hover:text-[#E2445C]"><Trash2 size={14} /></button>
                  </div>
                  {isOpen && (
                    <div className="px-4 pb-3 pl-12">
                      {cps.length === 0 ? (
                        <p className="text-[11px] text-2 py-1">Sin abonos este mes.</p>
                      ) : cps.map(p => (
                        <div key={p.id} className="flex items-center gap-2 py-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00C875] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium">{money(p.amount, c.currency)}</p>
                            <p className="text-[10px] text-2">{fromDateStr(p.paid_on).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}{p.note ? ` · ${p.note}` : ''}</p>
                          </div>
                          <button onClick={() => deletePayment(p.id)} aria-label="Eliminar abono"
                            className="p-1 rounded-ios-sm text-2 hover:text-[#E2445C]"><Trash2 size={13} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <CycleEditorModal cycle={editCycle} onClose={() => setEditCycle(null)} createCycle={createCycle} updateCycle={updateCycle} deleteCycle={deleteCycle} />
      <AddPaymentModal cycle={payCycle} onClose={() => setPayCycle(null)} addPayment={addPayment} />
    </div>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div className="surface rounded-ios border hairline p-3.5">
      <p className="text-[11px] text-2 mb-1">{label}</p>
      <p className="text-base sm:text-lg font-semibold break-words" style={accent ? { color: accent } : undefined}>{value}</p>
    </div>
  )
}

function CycleEditorModal({ cycle, onClose, createCycle, updateCycle, deleteCycle }) {
  const isNew = cycle && !cycle.id
  const [monthVal, setMonthVal] = useState('')
  const [total, setTotal] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [dueDate, setDueDate] = useState(null)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (cycle) {
      setMonthVal((cycle.period_month || '').slice(0, 7))
      setTotal(cycle.total_amount != null ? String(cycle.total_amount) : '')
      setCurrency(cycle.currency || 'EUR')
      setDueDate(cycle.due_date || null)
      setNotes(cycle.notes || '')
    }
  }, [cycle?.id, cycle?.period_month])

  if (!cycle) return null

  const save = async () => {
    setBusy(true)
    try {
      const period_month = monthVal ? `${monthVal}-01` : cycle.period_month
      const patch = { period_month, total_amount: parseFloat(total) || 0, currency, due_date: dueDate, notes: notes.trim() || null }
      if (isNew) await createCycle(patch)
      else await updateCycle(cycle.id, patch)
      onClose()
    } finally { setBusy(false) }
  }

  return (
    <Modal open={!!cycle} onClose={onClose} title={isNew ? 'Nuevo mes de cobro' : 'Editar cobro'}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-2">Mes</label>
          <input type="month" value={monthVal} onChange={e => setMonthVal(e.target.value)}
            className="w-full mt-1.5 text-sm rounded-ios-sm surface-2 px-3 py-2 outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-2">Total a pagar</label>
          <div className="flex gap-2 mt-1.5">
            <input type="number" inputMode="decimal" value={total} onChange={e => setTotal(e.target.value)}
              placeholder="0.00" className="flex-1 min-w-0 text-sm rounded-ios-sm surface-2 px-3 py-2 outline-none" />
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              className="text-sm rounded-ios-sm surface-2 px-2 py-2 outline-none">
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-2 block mb-1.5">Fecha de cobro</label>
          <DateField value={dueDate} onChange={setDueDate} placeholder="Elegir fecha" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-2">Notas</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="Referencia de factura, condiciones…"
            className="w-full mt-1.5 text-sm rounded-ios-sm surface-2 p-3 outline-none resize-y" />
        </div>
        <button onClick={save} disabled={busy || !monthVal}
          className="w-full py-3 rounded-ios-sm bg-brand text-white font-semibold disabled:opacity-40 active:scale-[.98] transition-transform">
          {busy ? 'Guardando…' : (isNew ? 'Crear mes' : 'Guardar')}
        </button>
        {!isNew && deleteCycle && (
          <button onClick={() => { if (window.confirm('¿Eliminar este cobro y todos sus abonos? Útil si este cliente ya no lo necesita.')) { deleteCycle(cycle.id); onClose() } }}
            className="w-full flex items-center justify-center gap-1.5 text-sm text-[#E2445C] font-medium py-1">
            <Trash2 size={14} /> Eliminar este cobro
          </button>
        )}
      </div>
    </Modal>
  )
}

function AddPaymentModal({ cycle, onClose, addPayment }) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (cycle) {
      setAmount(''); setNote('')
      const tt = new Date()
      setDate(`${tt.getFullYear()}-${String(tt.getMonth() + 1).padStart(2, '0')}-${String(tt.getDate()).padStart(2, '0')}`)
    }
  }, [cycle?.id])

  if (!cycle) return null

  const save = async () => {
    const a = parseFloat(amount)
    if (!a || a <= 0 || busy) return
    setBusy(true)
    try {
      await addPayment({ cycle_id: cycle.id, amount: a, paid_on: date, note: note.trim() })
      onClose()
    } finally { setBusy(false) }
  }

  return (
    <Modal open={!!cycle} onClose={onClose} title={`Abono · ${periodLabel(cycle.period_month)}`}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-2">Monto ({cycle.currency})</label>
          <input autoFocus type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="0.00" className="w-full mt-1.5 text-lg font-semibold rounded-ios-sm surface-2 px-3 py-2 outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-2 block mb-1.5">Fecha del abono</label>
          <DateField value={date} onChange={setDate} placeholder="Elegir fecha" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-2">Nota (opcional)</label>
          <input value={note} onChange={e => setNote(e.target.value)}
            placeholder="Transferencia, efectivo…"
            className="w-full mt-1.5 text-sm rounded-ios-sm surface-2 px-3 py-2 outline-none" />
        </div>
        <button onClick={save} disabled={!parseFloat(amount) || busy}
          className="w-full py-3 rounded-ios-sm bg-brand text-white font-semibold disabled:opacity-40 active:scale-[.98] transition-transform">
          {busy ? 'Guardando…' : 'Registrar abono'}
        </button>
      </div>
    </Modal>
  )
}
