import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAllBilling } from '../hooks/useBilling'
import { WorkspaceIcon } from '../components/ui'
import { money } from '../components/BillingView'
import { fromDateStr } from '../lib/calendar'

function periodLabel(pm) {
  if (!pm) return ''
  return fromDateStr(pm).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

function daysLeft(due) {
  if (!due) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const [y, m, d] = due.split('-').map(Number)
  return Math.round((new Date(y, m - 1, d) - today) / 86400000)
}

export default function Cobros() {
  const { cycles, paidByCycle, loading } = useAllBilling()
  const navigate = useNavigate()

  const rows = useMemo(() => cycles.map(c => {
    const total = Number(c.total_amount || 0)
    const paid = paidByCycle[c.id] || 0
    return { ...c, total, paid, remaining: Math.max(0, total - paid), dleft: daysLeft(c.due_date) }
  }), [cycles, paidByCycle])

  const pending = rows.filter(r => r.status !== 'paid').sort((a, b) => (a.due_date || '9999') < (b.due_date || '9999') ? -1 : 1)
  const paid = rows.filter(r => r.status === 'paid').sort((a, b) => (a.period_month < b.period_month ? 1 : -1))

  const totalPending = pending.reduce((s, r) => s + r.remaining, 0)
  const totalCollected = rows.reduce((s, r) => s + r.paid, 0)
  // Nota: los totales mezclan monedas si usas varias; se muestran como referencia.

  const Row = ({ r }) => {
    const ws = r.workspaces
    const overdue = r.dleft != null && r.dleft < 0 && r.status !== 'paid'
    return (
      <button onClick={() => navigate(`/workspace/${r.workspace_id}`)}
        className="w-full flex items-center gap-3 px-4 py-3 border-b hairline last:border-0 text-left hover:surface-2">
        <WorkspaceIcon icon={ws?.icon} color={ws?.color} size={34} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{ws?.name || 'Cliente'}</p>
          <p className="text-[11px] text-2 capitalize">
            {periodLabel(r.period_month)}
            {r.status !== 'paid' && r.dleft != null && (
              <span className={overdue ? 'text-[#E2445C]' : ''}>
                {' · '}{overdue ? `vencido hace ${Math.abs(r.dleft)}d` : r.dleft === 0 ? 'cobro hoy' : `faltan ${r.dleft}d`}
              </span>
            )}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold">{money(r.status === 'paid' ? r.total : r.remaining, r.currency)}</p>
          <p className="text-[11px] text-2">{r.status === 'paid' ? 'pagado' : `${money(r.paid, r.currency)} abonado`}</p>
        </div>
      </button>
    )
  }

  return (
    <div className="p-5 sm:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-2.5 mb-5">
        <CreditCard size={22} className="text-brand dark:text-brand-light" />
        <div>
          <h1 className="text-2xl font-semibold leading-tight">Cobros</h1>
          <p className="text-sm text-2">Pagos de todos tus clientes</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-2">Cargando…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-ios border-2 border-dashed hairline p-10 flex flex-col items-center gap-3 text-2 text-center">
          <CreditCard size={28} />
          <p className="text-sm">Aún no hay cobros. Configúralos en la pestaña «Pagos» de cada workspace.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="surface rounded-ios border hairline p-4">
              <p className="text-[11px] text-2 mb-1">Pendiente de cobro</p>
              <p className="text-xl font-semibold text-[#E2445C]">{money(totalPending, rows[0]?.currency)}</p>
            </div>
            <div className="surface rounded-ios border hairline p-4">
              <p className="text-[11px] text-2 mb-1">Cobrado (total)</p>
              <p className="text-xl font-semibold text-[#00C875]">{money(totalCollected, rows[0]?.currency)}</p>
            </div>
          </div>

          {pending.length > 0 && (
            <section className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-[#FDAB3D]" />
                <h2 className="text-sm font-semibold">Pendientes ({pending.length})</h2>
              </div>
              <div className="surface rounded-ios border hairline overflow-hidden">
                {pending.map(r => <Row key={r.id} r={r} />)}
              </div>
            </section>
          )}

          {paid.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="text-[#00C875]" />
                <h2 className="text-sm font-semibold">Pagados ({paid.length})</h2>
              </div>
              <div className="surface rounded-ios border hairline overflow-hidden">
                {paid.map(r => <Row key={r.id} r={r} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
