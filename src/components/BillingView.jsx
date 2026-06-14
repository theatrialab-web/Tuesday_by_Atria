import { useEffect, useMemo, useState } from 'react'
import { CreditCard, Pencil, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Modal } from './ui'
import { DateField } from './DatePicker'
import { MonthCalendar } from './MonthCalendar'
import { useBilling } from '../hooks/useBilling'
import { useIsMobile } from '../hooks/useIsMobile'
import { fromDateStr } from '../lib/calendar'

const CURRENCIES = ['EUR', 'USD', 'MXN', 'COP', 'GBP', 'ARS']

function money(n, currency) {
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: currency || 'EUR' }).format(n || 0)
  } catch {
    return `${n} ${currency || ''}`
  }
}

export function BillingView({ workspaceId }) {
  const { billing, payments, loading, totals, saveBilling, addPayment, deletePayment } = useBilling(workspaceId)
  const [editOpen, setEditOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const isMobile = useIsMobile()
  const cur = billing?.currency || 'EUR'

  const eventsByDate = useMemo(() => {
    const map = {}
    if (billing?.due_date) map[billing.due_date] = [{ key: 'due', title: 'Fecha de cobro', color: '#E2445C' }]
    for (const p of payments) {
      const k = p.paid_on
      if (!k) continue
      map[k] = map[k] || []
      map[k].push({ key: p.id, title: `Abono ${money(p.amount, cur)}`, color: '#00C875' })
    }
    return map
  }, [billing, payments, cur])

  if (loading) return <p className="text-sm text-2">Cargando información de pago…</p>

  const daysLabel = () => {
    if (totals.daysLeft == null) return 'Sin fecha de cobro'
    if (totals.daysLeft === 0) return 'Es hoy'
    if (totals.daysLeft > 0) return `Faltan ${totals.daysLeft} día${totals.daysLeft === 1 ? '' : 's'}`
    return `Vencido hace ${Math.abs(totals.daysLeft)} día${Math.abs(totals.daysLeft) === 1 ? '' : 's'}`
  }

  const markPaid = () => saveBilling({
    total_amount: billing?.total_amount || 0,
    currency: cur,
    due_date: billing?.due_date || null,
    notes: billing?.notes || null,
    status: billing?.status === 'paid' ? 'pending' : 'paid',
  })

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      {/* Estado */}
      <div className={`rounded-ios p-4 flex items-center gap-3 ${
        totals.isPending ? 'bg-[#FFF4E5] dark:bg-[#3a2a10] text-[#B26A00] dark:text-[#FDAB3D]'
        : 'bg-[#E9F9F0] dark:bg-[#0f2e1f] text-[#00854a] dark:text-[#33d896]'
      }`}>
        {totals.isPending ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">
            {totals.isPending ? 'Pago pendiente' : (totals.fullyPaid || billing?.status === 'paid') ? 'Pagado' : 'Sin importe configurado'}
          </p>
          <p className="text-xs opacity-90">{daysLabel()}</p>
        </div>
        <button onClick={markPaid}
          className="text-xs font-semibold px-3 py-1.5 rounded-ios-sm surface border hairline text-1 shrink-0">
          {billing?.status === 'paid' ? 'Marcar pendiente' : 'Marcar pagado'}
        </button>
      </div>

      {/* Cifras */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total a pagar" value={money(totals.total, cur)} />
        <Stat label="Abonado" value={money(totals.paid, cur)} accent="#00C875" />
        <Stat label="Restante" value={money(totals.remaining, cur)} accent={totals.remaining > 0 ? '#E2445C' : '#00C875'} />
      </div>

      <div className="flex gap-2">
        <button onClick={() => setEditOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-ios-sm surface border hairline text-sm font-medium">
          <Pencil size={14} /> Editar cobro
        </button>
        <button onClick={() => setPayOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-ios-sm bg-brand text-white text-sm font-semibold active:scale-95 transition-transform">
          <Plus size={15} /> Registrar abono
        </button>
      </div>

      {/* Calendario */}
      <div className="surface rounded-ios border hairline p-4">
        <MonthCalendar eventsByDate={eventsByDate} isMobile={isMobile} />
      </div>

      {/* Abonos */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Abonos ({payments.length})</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-2">Aún no hay abonos registrados.</p>
        ) : (
          <div className="surface rounded-ios border hairline overflow-hidden">
            {payments.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b hairline last:border-0">
                <span className="w-2 h-2 rounded-full bg-[#00C875] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{money(p.amount, cur)}</p>
                  <p className="text-[11px] text-2">
                    {fromDateStr(p.paid_on).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {p.note ? ` · ${p.note}` : ''}
                  </p>
                </div>
                <button onClick={() => deletePayment(p.id)} aria-label="Eliminar abono"
                  className="p-1.5 rounded-ios-sm text-2 hover:text-[#E2445C]"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <EditBillingModal open={editOpen} onClose={() => setEditOpen(false)} billing={billing} saveBilling={saveBilling} />
      <AddPaymentModal open={payOpen} onClose={() => setPayOpen(false)} addPayment={addPayment} currency={cur} />
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

function EditBillingModal({ open, onClose, billing, saveBilling }) {
  const [total, setTotal] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [dueDate, setDueDate] = useState(null)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setTotal(billing?.total_amount != null ? String(billing.total_amount) : '')
      setCurrency(billing?.currency || 'EUR')
      setDueDate(billing?.due_date || null)
      setNotes(billing?.notes || '')
    }
  }, [open])

  const save = async () => {
    setBusy(true)
    try {
      await saveBilling({
        total_amount: parseFloat(total) || 0,
        currency,
        due_date: dueDate,
        notes: notes.trim() || null,
        status: billing?.status || 'pending',
      })
      onClose()
    } finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar cobro">
      <div className="flex flex-col gap-4">
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
            placeholder="Condiciones, referencia de factura…"
            className="w-full mt-1.5 text-sm rounded-ios-sm surface-2 p-3 outline-none resize-y" />
        </div>
        <button onClick={save} disabled={busy}
          className="w-full py-3 rounded-ios-sm bg-brand text-white font-semibold disabled:opacity-40 active:scale-[.98] transition-transform">
          {busy ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </Modal>
  )
}

function AddPaymentModal({ open, onClose, addPayment, currency }) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setAmount(''); setNote('')
      const t = new Date()
      setDate(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`)
    }
  }, [open])

  const save = async () => {
    const a = parseFloat(amount)
    if (!a || a <= 0 || busy) return
    setBusy(true)
    try {
      await addPayment({ amount: a, paid_on: date, note: note.trim() })
      onClose()
    } finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar abono">
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-2">Monto ({currency})</label>
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
