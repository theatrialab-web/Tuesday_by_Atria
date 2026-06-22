import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, AlertCircle, CheckCircle2, Download, TrendingUp } from 'lucide-react'
import { useAllBilling } from '../hooks/useBilling'
import { WorkspaceIcon, WorkspaceDropdown, Segmented } from '../components/ui'
import { money } from '../components/BillingView'
import { fromDateStr } from '../lib/calendar'

function periodLabel(pm) {
  if (!pm) return ''
  return fromDateStr(pm).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}
function monthShort(key) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')
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
  const [wsFilter, setWsFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const allRows = useMemo(() => cycles.map(c => {
    const total = Number(c.total_amount || 0)
    const paid = paidByCycle[c.id] || 0
    return { ...c, total, paid, remaining: Math.max(0, total - paid), dleft: daysLeft(c.due_date) }
  }), [cycles, paidByCycle])

  const wsOptions = useMemo(() => {
    const map = new Map()
    for (const r of allRows) if (!map.has(r.workspace_id)) {
      map.set(r.workspace_id, { id: r.workspace_id, name: r.workspaces?.name || 'Cliente', color: r.workspaces?.color, icon: r.workspaces?.icon })
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [allRows])

  const rows = useMemo(() => allRows.filter(r => {
    if (wsFilter !== 'all' && r.workspace_id !== wsFilter) return false
    if (statusFilter === 'pending' && r.status === 'paid') return false
    if (statusFilter === 'paid' && r.status !== 'paid') return false
    return true
  }), [allRows, wsFilter, statusFilter])

  const pending = rows.filter(r => r.status !== 'paid').sort((a, b) => (a.due_date || '9999') < (b.due_date || '9999') ? -1 : 1)
  const paid = rows.filter(r => r.status === 'paid').sort((a, b) => (a.period_month < b.period_month ? 1 : -1))

  const totalFacturado = rows.reduce((s, r) => s + r.total, 0)
  const totalCollected = rows.reduce((s, r) => s + r.paid, 0)
  const totalPending = pending.reduce((s, r) => s + r.remaining, 0)
  const rate = totalFacturado > 0 ? Math.round((totalCollected / totalFacturado) * 100) : 0
  const cur = rows[0]?.currency

  const monthly = useMemo(() => {
    const map = new Map()
    for (const r of rows) {
      const key = (r.period_month || '').slice(0, 7)
      if (!key) continue
      const e = map.get(key) || { key, fact: 0, cob: 0 }
      e.fact += r.total; e.cob += r.paid
      map.set(key, e)
    }
    return [...map.values()].sort((a, b) => (a.key < b.key ? -1 : 1)).slice(-8)
  }, [rows])
  const maxV = Math.max(1, ...monthly.map(m => m.fact))

  const exportCSV = () => {
    const q = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`
    const header = ['Cliente', 'Periodo', 'Moneda', 'Facturado', 'Abonado', 'Pendiente', 'Estado', 'Vence']
    const lines = rows.map(r => [
      q(r.workspaces?.name || 'Cliente'), q(periodLabel(r.period_month)), q(r.currency || ''),
      r.total, r.paid, r.remaining, q(r.status === 'paid' ? 'Pagado' : 'Pendiente'), q(r.due_date || ''),
    ].join(','))
    const content = '\ufeff' + [header.join(','), ...lines].join('\n')
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `cobros-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const Card = ({ label, value, color, sub }) => (
    <div className="surface rounded-ios border hairline p-4">
      <p className="text-[11px] text-2 mb-1">{label}</p>
      <p className="text-xl font-semibold" style={color ? { color } : undefined}>{value}</p>
      {sub && <p className="text-[11px] text-2 mt-0.5">{sub}</p>}
    </div>
  )

  const Row = ({ r }) => {
    const ws = r.workspaces
    const overdue = r.dleft != null && r.dleft < 0 && r.status !== 'paid'
    return (
      <button onClick={() => navigate(`/workspace/${r.workspace_id}`)}
        className="w-full flex items-center gap-3 px-4 py-3 border-b hairline last:border-0 text-left hover:surface-2">
        <WorkspaceIcon icon={ws?.icon} color={ws?.color} size={34} round />
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
        {r.status !== 'paid' && r.total > 0 && (
          <div className="hidden sm:block w-24 shrink-0">
            <div className="h-1.5 rounded-full surface-2 overflow-hidden">
              <div className="h-full bg-[#00C875]" style={{ width: `${Math.min(100, (r.paid / r.total) * 100)}%` }} />
            </div>
          </div>
        )}
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold">{money(r.status === 'paid' ? r.total : r.remaining, r.currency)}</p>
          <p className="text-[11px] text-2">{r.status === 'paid' ? 'pagado' : `${money(r.paid, r.currency)} abonado`}</p>
        </div>
      </button>
    )
  }

  return (
    <div className="p-5 sm:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <CreditCard size={22} className="text-brand dark:text-brand-light" />
          <div>
            <h1 className="text-2xl font-semibold leading-tight">Cobros</h1>
            <p className="text-sm text-2">Pagos de todos tus clientes</p>
          </div>
        </div>
        {allRows.length > 0 && (
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-ios-sm surface border hairline text-sm font-medium hover:surface-2 active:scale-95 transition-transform">
            <Download size={15} /> Exportar
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-2">Cargando…</p>
      ) : allRows.length === 0 ? (
        <div className="rounded-ios border-2 border-dashed hairline p-10 flex flex-col items-center gap-3 text-2 text-center">
          <CreditCard size={28} />
          <p className="text-sm">Aún no hay cobros. Configúralos en la pestaña «Pagos» de cada workspace.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <div className="w-full sm:w-64">
              <WorkspaceDropdown workspaces={wsOptions} value={wsFilter} onChange={setWsFilter} allowAll title="Filtrar por cliente" />
            </div>
            <div className="w-full sm:w-auto sm:min-w-[260px]">
              <Segmented value={statusFilter} onChange={setStatusFilter}
                options={[{ value: 'all', label: 'Todos' }, { value: 'pending', label: 'Pendientes' }, { value: 'paid', label: 'Pagados' }]} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <Card label="Facturado" value={money(totalFacturado, cur)} />
            <Card label="Cobrado" value={money(totalCollected, cur)} color="#00C875" />
            <Card label="Pendiente" value={money(totalPending, cur)} color="#E2445C" />
            <Card label="Tasa de cobro" value={`${rate}%`} sub={`${paid.length}/${rows.length} ciclos pagados`} />
          </div>

          {monthly.length > 0 && (
            <div className="surface rounded-ios border hairline p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-brand dark:text-brand-light" />
                <h2 className="text-sm font-semibold">Por mes</h2>
              </div>
              <div className="flex items-end gap-3 h-36">
                {monthly.map(m => (
                  <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                    <div className="flex items-end gap-1 h-full w-full justify-center">
                      <div title={`Facturado ${money(m.fact, cur)}`}
                        className="w-2.5 sm:w-3.5 rounded-t bg-brand transition-all"
                        style={{ height: `${Math.max(2, (m.fact / maxV) * 100)}%` }} />
                      <div title={`Cobrado ${money(m.cob, cur)}`}
                        className="w-2.5 sm:w-3.5 rounded-t bg-[#00C875] transition-all"
                        style={{ height: `${Math.max(2, (m.cob / maxV) * 100)}%` }} />
                    </div>
                    <span className="text-[10px] text-2 truncate w-full text-center capitalize">{monthShort(m.key)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 text-[11px] text-2">
                <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-brand" /> Facturado</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#00C875]" /> Cobrado</span>
              </div>
            </div>
          )}

          {rows.length === 0 && <p className="text-sm text-2 text-center py-8">No hay cobros con este filtro.</p>}

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
